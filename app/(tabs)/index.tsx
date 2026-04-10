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

export default function DashboardScreen() {
  const router = useRouter();
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

  // Charger le rôle depuis Firestore
  useEffect(() => {
    const loadRole = async () => {
      if (!auth.currentUser) return;
      try {
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (snap.exists() && snap.data().role) {
          setUserRole(snap.data().role);
        }
      } catch (e) {}
    };
    loadRole();
  }, []);

  // Recharger les seuils à chaque fois que la page devient active
  useFocusEffect(
    useCallback(() => {
      const loadSeuils = async () => {
        try {
          const saved = await AsyncStorage.getItem("hotel360_settings");
          if (saved) {
            const settings = JSON.parse(saved);
            setSeuilTemp(settings.seuilTemp ?? 27);
            setSeuilHumidite(settings.seuilHumidite ?? 75);
          }
        } catch (e) {}
      };
      loadSeuils();
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
        await addDoc(collection(db, "historique"), {
          type: "alerte",
          message: `Alerte auto: ${message}`,
          heure,
          date: "Aujourd'hui",
          icone,
        });
      }
    } catch (error) {
      console.log("Erreur alerte auto:", error);
    }
  };

  // Chambres — se relance quand les seuils changent
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
          if (chambre.temperature > seuilTemp) {
            genererAlerteAuto(
              chambre,
              "temperature",
              "urgent",
              `Température élevée chambre ${chambre.id}: ${chambre.temperature}°C`,
              "🌡️",
            );
          }
          if (chambre.fenetre && chambre.clim) {
            genererAlerteAuto(
              chambre,
              "fenetre",
              "warning",
              `Fenêtre ouverte avec clim active chambre ${chambre.id}`,
              "🪟",
            );
          }
          if (chambre.humidite > seuilHumidite) {
            genererAlerteAuto(
              chambre,
              "humidite",
              "warning",
              `Humidité élevée chambre ${chambre.id}: ${chambre.humidite}%`,
              "💧",
            );
          }
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
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      data.sort((a, b) => a.nom.localeCompare(b.nom));
      setZonesCommunes(data);
    });
    return unsubscribe;
  }, []);

  const getRoleColor = () => {
    if (userRole === "admin") return "#E53935";
    if (userRole === "manager") return "#F57C00";
    return "#1565C0";
  };

  const getRoleLabel = () => {
    if (userRole === "admin") return "👑 Admin";
    if (userRole === "manager") return "📊 Manager";
    return "🛎️ Réceptionniste";
  };

  return (
    <ScrollView
      style={styles.container}
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
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>
            صلي على النبي محمد صلى الله عليه وسلم 🤲🏻
          </Text>
          <Text style={styles.headerName}>
            {currentUser?.displayName || "Manager"}
          </Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
          {/* Badge rôle */}
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
        <TouchableOpacity onPress={() => router.push("/profile")}>
          {currentUser?.photoURL ? (
            <Image
              source={{ uri: currentUser.photoURL }}
              style={styles.avatarImg}
            />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>
                {currentUser?.displayName?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── STATS ── */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: "#1565C0" }]}>
          <Text style={styles.statIcon}>🛏️</Text>
          <Text style={styles.statNumber}>{stats.chambresOccupees}</Text>
          <Text style={styles.statLabel}>Occupées</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#2E7D32" }]}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={styles.statNumber}>{stats.chambresLibres}</Text>
          <Text style={styles.statLabel}>Libres</Text>
        </View>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: "#E53935" }]}
          onPress={() => router.push("/(tabs)/alerts")}
        >
          <Text style={styles.statIcon}>⚠️</Text>
          <Text style={styles.statNumber}>{stats.alertes}</Text>
          <Text style={styles.statLabel}>Alertes</Text>
        </TouchableOpacity>
        <View style={[styles.statCard, { backgroundColor: "#F57C00" }]}>
          <Text style={styles.statIcon}>🌡️</Text>
          <Text style={styles.statNumber}>{stats.temperature}°</Text>
          <Text style={styles.statLabel}>Temp Moy</Text>
        </View>
      </View>

      {/* ── BOUTON RÔLE SPÉCIFIQUE ── */}
      {userRole === "receptionniste" && (
        <TouchableOpacity
          style={[styles.roleBtn, { borderColor: "#1565C0" }]}
          onPress={() => router.push("/receptionniste")}
        >
          <Text style={styles.roleBtnIcon}>🛎️</Text>
          <View>
            <Text style={[styles.roleBtnTitle, { color: "#1565C0" }]}>
              Mon espace Réceptionniste
            </Text>
            <Text style={styles.roleBtnSub}>
              Pointage • État chambres • Propreté
            </Text>
          </View>
          <Text style={[styles.roleBtnArrow, { color: "#1565C0" }]}>→</Text>
        </TouchableOpacity>
      )}

      {userRole === "manager" && (
        <TouchableOpacity
          style={[styles.roleBtn, { borderColor: "#F57C00" }]}
          onPress={() => router.push("/manager")}
        >
          <Text style={styles.roleBtnIcon}>📊</Text>
          <View>
            <Text style={[styles.roleBtnTitle, { color: "#F57C00" }]}>
              Mon espace Manager
            </Text>
            <Text style={styles.roleBtnSub}>
              Employés • Planning • Pointages
            </Text>
          </View>
          <Text style={[styles.roleBtnArrow, { color: "#F57C00" }]}>→</Text>
        </TouchableOpacity>
      )}

      {userRole === "admin" && (
        <View style={styles.adminBtns}>
          <TouchableOpacity
            style={[styles.adminBtn, { borderColor: "#E53935" }]}
            onPress={() => router.push("/manage-users")}
          >
            <Text style={styles.adminBtnIcon}>👥</Text>
            <Text style={[styles.adminBtnText, { color: "#E53935" }]}>
              Gérer Users
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminBtn, { borderColor: "#7B1FA2" }]}
            onPress={() => router.push("/manage-zones")}
          >
            <Text style={styles.adminBtnIcon}>🏨</Text>
            <Text style={[styles.adminBtnText, { color: "#7B1FA2" }]}>
              Gérer Zones
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminBtn, { borderColor: "#F57C00" }]}
            onPress={() => router.push("/manager")}
          >
            <Text style={styles.adminBtnIcon}>📊</Text>
            <Text style={[styles.adminBtnText, { color: "#F57C00" }]}>
              Planning
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── CHAMBRES ── */}
      <Text style={styles.sectionTitle}>🛏️ État des Chambres</Text>
      {chambres.length === 0 ? (
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>⏳ Chargement des chambres...</Text>
        </View>
      ) : (
        <View style={styles.chambresGrid}>
          {chambres.map((chambre) => (
            <TouchableOpacity
              key={chambre.id}
              style={[
                styles.chambreCard,
                chambre.presence && styles.chambreOccupee,
              ]}
              onPress={() => router.push(`/chambre-detail?id=${chambre.id}`)}
            >
              <View style={styles.chambreHeader}>
                <Text style={styles.chambreNum}>#{chambre.id}</Text>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: chambre.presence ? "#E53935" : "#2E7D32",
                    },
                  ]}
                />
              </View>
              <Text style={styles.chambreStatus}>
                {chambre.presence ? "👤 Occupée" : "🔓 Libre"}
              </Text>
              <Text style={styles.chambreTemp}>🌡️ {chambre.temperature}°C</Text>
              <Text style={styles.chambreHum}>💧 {chambre.humidite}%</Text>
              <View style={styles.chambreIcons}>
                <Text style={{ opacity: chambre.lumiere ? 1 : 0.3 }}>💡</Text>
                <Text style={{ opacity: chambre.clim ? 1 : 0.3 }}>❄️</Text>
                <Text style={{ opacity: chambre.fenetre ? 1 : 0.3 }}>🪟</Text>
              </View>
              {/* Badge propreté */}
              {chambre.propre !== undefined && (
                <View
                  style={[
                    styles.propreteTag,
                    {
                      backgroundColor: chambre.propre
                        ? "#2E7D3222"
                        : "#E5393522",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.propreteText,
                      { color: chambre.propre ? "#2E7D32" : "#E53935" },
                    ]}
                  >
                    {chambre.propre ? "✅ Propre" : "🧹 Sale"}
                  </Text>
                </View>
              )}
              {chambre.temperature > seuilTemp && (
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>⚠️ Chaud</Text>
                </View>
              )}
              {chambre.fenetre && chambre.clim && (
                <View
                  style={[styles.alertBadge, { backgroundColor: "#F57C00" }]}
                >
                  <Text style={styles.alertBadgeText}>🪟 Fenêtre!</Text>
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
        style={styles.historyBtn}
        onPress={() => router.push("/(tabs)/history")}
      >
        <Text style={styles.historyBtnText}>
          📊 Voir l'Historique & Statistiques
        </Text>
      </TouchableOpacity>

      {/* ── ZONES COMMUNES ── */}
      <Text style={styles.sectionTitle}>🏨 Zones Communes</Text>
      {zonesCommunes.length === 0 ? (
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>⏳ Chargement des zones...</Text>
        </View>
      ) : (
        <View style={styles.zonesGrid}>
          {zonesCommunes.map((zone) => (
            <TouchableOpacity
              key={zone.id}
              style={[styles.zoneCard, zone.occupee && styles.zoneOccupee]}
              onPress={() => router.push(`/zone-detail?id=${zone.nom}`)}
            >
              <Text style={styles.zoneIcon}>{zone.icone}</Text>
              <Text style={styles.zoneNom}>{zone.nom}</Text>
              <Text
                style={[
                  styles.zoneStatus,
                  { color: zone.occupee ? "#E53935" : "#2E7D32" },
                ]}
              >
                {zone.occupee ? "🔴 Occupé" : "🟢 Libre"}
              </Text>
              {zone.occupee && (
                <Text style={styles.zonePersonnes}>
                  👥 {zone.personnes} pers.
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
  container: { flex: 1, backgroundColor: "#0A1628" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerGreeting: { fontSize: 14, color: "#64B5F6" },
  headerName: { fontSize: 22, fontWeight: "bold", color: "#fff", marginTop: 2 },
  headerDate: { fontSize: 12, color: "#888", marginTop: 2 },
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
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#64B5F6",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1565C0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#64B5F6",
  },
  avatarLetter: { fontSize: 20, fontWeight: "bold", color: "#fff" },

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
    backgroundColor: "#1E2D45",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  roleBtnIcon: { fontSize: 28 },
  roleBtnTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 2 },
  roleBtnSub: { fontSize: 11, color: "#888" },
  roleBtnArrow: { marginLeft: "auto", fontSize: 18, fontWeight: "bold" },

  adminBtns: {
    flexDirection: "row",
    marginHorizontal: 15,
    gap: 10,
    marginBottom: 16,
  },
  adminBtn: {
    flex: 1,
    backgroundColor: "#1E2D45",
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
    color: "#fff",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  loadingCard: {
    marginHorizontal: 15,
    backgroundColor: "#1E2D45",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  loadingText: { color: "#64B5F6", fontSize: 14 },

  chambresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
    gap: 10,
  },
  chambreCard: {
    width: "47%",
    backgroundColor: "#1E2D45",
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  chambreOccupee: { borderColor: "#E53935", borderWidth: 1.5 },
  chambreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chambreNum: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  chambreStatus: { fontSize: 12, color: "#ccc", marginBottom: 4 },
  chambreTemp: { fontSize: 12, color: "#64B5F6", marginBottom: 2 },
  chambreHum: { fontSize: 12, color: "#64B5F6", marginBottom: 8 },
  chambreIcons: { flexDirection: "row", gap: 8, marginBottom: 6 },
  propreteTag: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  propreteText: { fontSize: 10, fontWeight: "bold" },
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
    backgroundColor: "#1E2D45",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  historyBtnText: { color: "#64B5F6", fontSize: 16, fontWeight: "bold" },

  zonesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
    gap: 10,
  },
  zoneCard: {
    width: "30%",
    backgroundColor: "#1E2D45",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  zoneOccupee: { borderColor: "#F57C00" },
  zoneIcon: { fontSize: 28, marginBottom: 6 },
  zoneNom: {
    fontSize: 11,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 4,
  },
  zoneStatus: { fontSize: 11, fontWeight: "bold" },
  zonePersonnes: {
    fontSize: 10,
    color: "#F57C00",
    fontWeight: "bold",
    marginTop: 2,
  },
});
