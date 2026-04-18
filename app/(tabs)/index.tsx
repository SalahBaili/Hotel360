import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../config/firebase";
import { useApp } from "../../context/AppContext";

export default function DashboardScreen() {
  const router = useRouter();
  const { theme, t, lang, isRTL, globalPhotoURL, setGlobalPhotoURL } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    chambresOccupees: 0,
    chambresLibres: 0,
    alertes: 0,
    temperature: 0,
  });
  const [chambres, setChambres] = useState([]);
  const [zonesCommunes, setZonesCommunes] = useState([]);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [seuilTemp, setSeuilTemp] = useState(27);
  const [seuilHumidite, setSeuilHumidite] = useState(75);
  const [userRole, setUserRole] = useState("admin");

  // ✅ Charge la photo depuis Firestore au mount — initialise le contexte global
  useEffect(() => {
    const loadUser = async () => {
      if (!auth.currentUser) return;
      try {
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.role) setUserRole(data.role);
          if (data.photoURL?.startsWith("http") && !globalPhotoURL) {
            setGlobalPhotoURL(data.photoURL);
          } else if (
            auth.currentUser.photoURL?.startsWith("http") &&
            !globalPhotoURL
          ) {
            setGlobalPhotoURL(auth.currentUser.photoURL);
          }
        }
      } catch (e) {}
    };
    loadUser();
  }, []);

  // Recharger seuils quand on revient
  useFocusEffect(
    useCallback(() => {
      const reload = async () => {
        try {
          const saved = await AsyncStorage.getItem("hotel360_settings");
          if (saved) {
            const s = JSON.parse(saved);
            setSeuilTemp(s.seuilTemp ?? 27);
            setSeuilHumidite(s.seuilHumidite ?? 75);
          }
        } catch (e) {}
      };
      reload();
    }, []),
  );

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setCurrentUser(user));
    return unsubscribe;
  }, []);

  const genererAlerteAuto = async (chambre, type, niveau, message, icone) => {
    try {
      const q = query(
        collection(db, "alertes"),
        where("chambre", "==", chambre.id),
        where("type", "==", type),
        where("resolu", "==", false),
      );
      const existing = await getDocs(q);
      if (existing.empty) {
        const now = new Date();
        const heure = now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        await addDoc(collection(db, "alertes"), {
          chambre: chambre.id,
          message,
          niveau,
          type,
          icone,
          heure,
          date: "Aujourd'hui",
          resolu: false,
        });
      }
    } catch (e) {}
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "chambres"),
      async (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        data.sort((a, b) => a.id.localeCompare(b.id));
        setChambres(data);
        const occupees = data.filter((c) => c.presence).length;
        const tempMoy =
          data.length > 0
            ? Math.round(
                data.reduce((a, c) => a + c.temperature, 0) / data.length,
              )
            : 0;
        data.forEach((chambre) => {
          if (chambre.temperature > seuilTemp)
            genererAlerteAuto(
              chambre,
              "temperature",
              "urgent",
              `Temperature elevee chambre ${chambre.id}: ${chambre.temperature}C`,
              "🌡️",
            );
          if (chambre.fenetre && chambre.clim)
            genererAlerteAuto(
              chambre,
              "fenetre",
              "warning",
              `Fenetre ouverte avec clim active chambre ${chambre.id}`,
              "🪟",
            );
          if (chambre.humidite > seuilHumidite)
            genererAlerteAuto(
              chambre,
              "humidite",
              "warning",
              `Humidite elevee chambre ${chambre.id}: ${chambre.humidite}%`,
              "💧",
            );
        });
        const alertesCount = data.filter(
          (c) =>
            c.temperature > seuilTemp ||
            (c.fenetre && c.clim) ||
            c.humidite > seuilHumidite,
        ).length;
        setStats({
          chambresOccupees: occupees,
          chambresLibres: data.length - occupees,
          alertes: alertesCount,
          temperature: tempMoy,
        });
      },
    );
    return unsubscribe;
  }, [seuilTemp, seuilHumidite]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "zones"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => a.nom.localeCompare(b.nom));
      setZonesCommunes(data);
    });
    return unsubscribe;
  }, []);

  const getRoleColor = () =>
    userRole === "admin"
      ? "#E53935"
      : userRole === "manager"
        ? "#F57C00"
        : "#1565C0";
  const getRoleLabel = () => {
    if (lang === "ar")
      return userRole === "admin"
        ? "مدير"
        : userRole === "manager"
          ? "مشرف"
          : "موظف";
    if (lang === "en")
      return userRole === "admin"
        ? "Admin"
        : userRole === "manager"
          ? "Manager"
          : "Receptionist";
    return userRole === "admin"
      ? "Admin"
      : userRole === "manager"
        ? "Manager"
        : "Receptionniste";
  };

  const lbl = {
    occupees:
      lang === "ar" ? "مشغولة" : lang === "en" ? "Occupied" : "Occupees",
    libres: lang === "ar" ? "حرة" : lang === "en" ? "Free" : "Libres",
    alertes: lang === "ar" ? "تنبيهات" : lang === "en" ? "Alerts" : "Alertes",
    tempMoy:
      lang === "ar" ? "متوسط الحرارة" : lang === "en" ? "Avg Temp" : "Temp Moy",
    chambres:
      lang === "ar"
        ? "حالة الغرف"
        : lang === "en"
          ? "Room Status"
          : "Etat des Chambres",
    zones:
      lang === "ar"
        ? "المناطق المشتركة"
        : lang === "en"
          ? "Common Areas"
          : "Zones Communes",
    chargement:
      lang === "ar"
        ? "جاري التحميل..."
        : lang === "en"
          ? "Loading..."
          : "Chargement...",
    occupee: lang === "ar" ? "مشغولة" : lang === "en" ? "Occupied" : "Occupee",
    libre: lang === "ar" ? "حرة" : lang === "en" ? "Free" : "Libre",
    voir_hist:
      lang === "ar"
        ? "عرض السجل"
        : lang === "en"
          ? "View History"
          : "Voir l'Historique",
    gerer_u:
      lang === "ar"
        ? "ادارة المستخدمين"
        : lang === "en"
          ? "Manage Users"
          : "Gerer Users",
    gerer_z:
      lang === "ar"
        ? "ادارة المناطق"
        : lang === "en"
          ? "Manage Areas"
          : "Gerer Zones",
    planning:
      lang === "ar" ? "الجدول" : lang === "en" ? "Planning" : "Planning",
    espace_r:
      lang === "ar"
        ? "مساحة الموظف"
        : lang === "en"
          ? "Receptionist Space"
          : "Mon espace Receptionniste",
    espace_m:
      lang === "ar"
        ? "مساحة المشرف"
        : lang === "en"
          ? "Manager Space"
          : "Mon espace Manager",
    occupe: lang === "ar" ? "مشغول" : lang === "en" ? "Occupied" : "Occupe",
    dispo: lang === "ar" ? "حر" : lang === "en" ? "Free" : "Libre",
  };

  // ✅ La photo affichée = globalPhotoURL (mis à jour instantanément depuis profile)
  const displayPhoto = globalPhotoURL;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            setTimeout(() => setRefreshing(false), 1000);
          }}
          tintColor="#64B5F6"
        />
      }
    >
      {/* HEADER */}
      <View
        style={[
          styles.header,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <View style={isRTL ? { alignItems: "flex-end" } : {}}>
          <Text style={[styles.headerGreeting, { color: theme.accent }]}>
            صلي على النبي محمد صلى الله عليه وسلم 🤲🏻
          </Text>
          <Text style={[styles.headerName, { color: theme.text }]}>
            {currentUser?.displayName || "Manager"}
          </Text>
          <Text style={[styles.headerDate, { color: theme.textSub }]}>
            {new Date().toLocaleDateString(
              lang === "ar" ? "ar-TN" : lang === "en" ? "en-US" : "fr-FR",
              { weekday: "long", day: "numeric", month: "long" },
            )}
          </Text>
          <View
            style={[
              styles.roleBadgeSmall,
              {
                backgroundColor: getRoleColor() + "22",
                borderColor: getRoleColor(),
              },
            ]}
          >
            <Text style={[styles.roleBadgeText, { color: getRoleColor() }]}>
              {getRoleLabel()}
            </Text>
          </View>
        </View>
        {/* ✅ Avatar utilise globalPhotoURL directement */}
        <TouchableOpacity onPress={() => router.push("/profile")}>
          {displayPhoto ? (
            <Image source={{ uri: displayPhoto }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatarCircle, { backgroundColor: "#1565C0" }]}>
              <Text style={styles.avatarLetter}>
                {currentUser?.displayName?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* STATS */}
      <View style={styles.statsGrid}>
        {[
          {
            color: "#1565C0",
            icon: "🛏️",
            val: stats.chambresOccupees,
            label: lbl.occupees,
          },
          {
            color: "#2E7D32",
            icon: "✅",
            val: stats.chambresLibres,
            label: lbl.libres,
          },
          {
            color: "#E53935",
            icon: "⚠️",
            val: stats.alertes,
            label: lbl.alertes,
            onPress: () => router.push("/(tabs)/alerts"),
          },
          {
            color: "#F57C00",
            icon: "🌡️",
            val: stats.temperature + "°",
            label: lbl.tempMoy,
          },
        ].map((s, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.statCard, { backgroundColor: s.color }]}
            onPress={s.onPress}
            activeOpacity={s.onPress ? 0.7 : 1}
          >
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={styles.statNumber}>{s.val}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* BOUTONS ROLE */}
      {userRole === "receptionniste" && (
        <TouchableOpacity
          style={[
            styles.roleBtn,
            { borderColor: "#1565C0", backgroundColor: theme.card },
          ]}
          onPress={() => router.push("/receptionniste")}
        >
          <Text style={styles.roleBtnIcon}>🛎️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.roleBtnTitle, { color: "#1565C0" }]}>
              {lbl.espace_r}
            </Text>
          </View>
          <Text style={[styles.roleBtnArrow, { color: "#1565C0" }]}>
            {isRTL ? "←" : "→"}
          </Text>
        </TouchableOpacity>
      )}
      {userRole === "manager" && (
        <TouchableOpacity
          style={[
            styles.roleBtn,
            { borderColor: "#F57C00", backgroundColor: theme.card },
          ]}
          onPress={() => router.push("/manager")}
        >
          <Text style={styles.roleBtnIcon}>📊</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.roleBtnTitle, { color: "#F57C00" }]}>
              {lbl.espace_m}
            </Text>
          </View>
          <Text style={[styles.roleBtnArrow, { color: "#F57C00" }]}>
            {isRTL ? "←" : "→"}
          </Text>
        </TouchableOpacity>
      )}
      {userRole === "admin" && (
        <View style={styles.adminBtns}>
          {[
            {
              color: "#E53935",
              icon: "👥",
              label: lbl.gerer_u,
              route: "/manage-users",
            },
            {
              color: "#7B1FA2",
              icon: "🏨",
              label: lbl.gerer_z,
              route: "/manage-zones",
            },
            {
              color: "#F57C00",
              icon: "📊",
              label: lbl.planning,
              route: "/manager",
            },
          ].map((btn, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.adminBtn,
                { borderColor: btn.color, backgroundColor: theme.card },
              ]}
              onPress={() => router.push(btn.route)}
            >
              <Text style={styles.adminBtnIcon}>{btn.icon}</Text>
              <Text style={[styles.adminBtnText, { color: btn.color }]}>
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* CHAMBRES */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        🛏️ {lbl.chambres}
      </Text>
      {chambres.length === 0 ? (
        <View style={[styles.loadingCard, { backgroundColor: theme.card }]}>
          <Text style={{ color: theme.accent, fontSize: 14 }}>
            {lbl.chargement}
          </Text>
        </View>
      ) : (
        <View style={styles.chambresGrid}>
          {chambres.map((chambre) => (
            <TouchableOpacity
              key={chambre.id}
              style={[
                styles.chambreCard,
                {
                  backgroundColor: theme.card,
                  borderColor: chambre.presence ? "#E53935" : theme.border,
                },
                chambre.presence && { borderWidth: 1.5 },
              ]}
              onPress={() => router.push(`/chambre-detail?id=${chambre.id}`)}
            >
              <View style={styles.chambreHeader}>
                <Text style={[styles.chambreNum, { color: theme.text }]}>
                  #{chambre.id}
                </Text>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: chambre.presence ? "#E53935" : "#2E7D32",
                    },
                  ]}
                />
              </View>
              <Text style={[styles.chambreStatus, { color: theme.textSub }]}>
                {chambre.presence ? lbl.occupee : lbl.libre}
              </Text>
              <Text
                style={{ fontSize: 12, color: theme.accent, marginBottom: 2 }}
              >
                🌡️ {chambre.temperature}°C
              </Text>
              <Text
                style={{ fontSize: 12, color: theme.accent, marginBottom: 8 }}
              >
                💧 {chambre.humidite}%
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
                <Text style={{ opacity: chambre.lumiere ? 1 : 0.3 }}>💡</Text>
                <Text style={{ opacity: chambre.clim ? 1 : 0.3 }}>❄️</Text>
                <Text style={{ opacity: chambre.fenetre ? 1 : 0.3 }}>🪟</Text>
              </View>
              {chambre.temperature > seuilTemp && (
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>⚠️ Chaud</Text>
                </View>
              )}
              {chambre.fenetre && chambre.clim && (
                <View
                  style={[styles.alertBadge, { backgroundColor: "#F57C00" }]}
                >
                  <Text style={styles.alertBadgeText}>🪟 Fenetre!</Text>
                </View>
              )}
              {chambre.humidite > seuilHumidite && (
                <View
                  style={[styles.alertBadge, { backgroundColor: "#1565C0" }]}
                >
                  <Text style={styles.alertBadgeText}>💧 Humide!</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.historyBtn,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
        onPress={() => router.push("/(tabs)/history")}
      >
        <Text style={{ color: theme.accent, fontSize: 16, fontWeight: "bold" }}>
          {lbl.voir_hist}
        </Text>
      </TouchableOpacity>

      {/* ZONES */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        🏨 {lbl.zones}
      </Text>
      {zonesCommunes.length === 0 ? (
        <View style={[styles.loadingCard, { backgroundColor: theme.card }]}>
          <Text style={{ color: theme.accent, fontSize: 14 }}>
            {lbl.chargement}
          </Text>
        </View>
      ) : (
        <View style={styles.zonesGrid}>
          {zonesCommunes.map((zone) => (
            <TouchableOpacity
              key={zone.id}
              style={[
                styles.zoneCard,
                {
                  backgroundColor: theme.card,
                  borderColor: zone.occupee ? "#F57C00" : theme.border,
                },
              ]}
              onPress={() => router.push(`/zone-detail?id=${zone.nom}`)}
            >
              <Text style={styles.zoneIcon}>{zone.icone}</Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.textSub,
                  textAlign: "center",
                  marginBottom: 4,
                }}
              >
                {zone.nom}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "bold",
                  color: zone.occupee ? "#E53935" : "#2E7D32",
                }}
              >
                {zone.occupee ? lbl.occupe : lbl.dispo}
              </Text>
              {zone.occupee && (
                <Text
                  style={{
                    fontSize: 10,
                    color: "#F57C00",
                    fontWeight: "bold",
                    marginTop: 2,
                  }}
                >
                  👥 {zone.personnes}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerGreeting: { fontSize: 14 },
  headerName: { fontSize: 22, fontWeight: "bold", marginTop: 2 },
  headerDate: { fontSize: 12, marginTop: 2 },
  roleBadgeSmall: {
    marginTop: 6,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  roleBadgeText: { fontSize: 11, fontWeight: "bold" },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#64B5F6",
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#64B5F6",
  },
  avatarLetter: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
    marginBottom: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 16,
    padding: 15,
    alignItems: "center",
  },
  statIcon: { fontSize: 24, marginBottom: 5 },
  statNumber: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  roleBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    marginBottom: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  roleBtnIcon: { fontSize: 28 },
  roleBtnTitle: { fontSize: 15, fontWeight: "bold" },
  roleBtnArrow: { fontSize: 18, fontWeight: "bold" },
  adminBtns: {
    flexDirection: "row",
    marginHorizontal: 15,
    gap: 10,
    marginBottom: 16,
  },
  adminBtn: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  adminBtnIcon: { fontSize: 24, marginBottom: 6 },
  adminBtnText: { fontSize: 11, fontWeight: "bold", textAlign: "center" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  loadingCard: {
    marginHorizontal: 15,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  chambresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
    gap: 10,
  },
  chambreCard: { width: "47%", borderRadius: 16, padding: 15, borderWidth: 1 },
  chambreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chambreNum: { fontSize: 16, fontWeight: "bold" },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  chambreStatus: { fontSize: 12, marginBottom: 4 },
  alertBadge: {
    marginTop: 4,
    backgroundColor: "#E53935",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  alertBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  historyBtn: {
    marginHorizontal: 15,
    marginTop: 20,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  zonesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
    gap: 10,
  },
  zoneCard: {
    width: "30%",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  zoneIcon: { fontSize: 28, marginBottom: 6 },
});
