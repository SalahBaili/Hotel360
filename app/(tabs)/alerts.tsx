import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebase";
import { useApp } from "../../context/AppContext";

export default function AlertsScreen() {
  const { theme, lang } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [filtre, setFiltre] = useState("tous");
  const [alertes, setAlertes] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "alertes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAlertes(data);
    });
    return unsubscribe;
  }, []);

  const lbl = {
    title: lang === "ar" ? "التنبيهات" : lang === "en" ? "Alerts" : "Alertes",
    urgent: lang === "ar" ? "عاجل" : "Urgent",
    warning: lang === "ar" ? "تحذير" : "Warning",
    info: lang === "ar" ? "معلومات" : "Info",
    tous: lang === "ar" ? "الكل" : lang === "en" ? "All" : "Tous",
    aucune:
      lang === "ar"
        ? "لا توجد تنبيهات"
        : lang === "en"
          ? "No alerts"
          : "Aucune alerte",
    resoudre:
      lang === "ar"
        ? "تم الحل"
        : lang === "en"
          ? "Mark resolved"
          : "Marquer resolu",
    resolu: lang === "ar" ? "تم الحل" : lang === "en" ? "Resolved" : "Resolu",
    chambre: lang === "ar" ? "غرفة" : lang === "en" ? "Room" : "Chambre",
  };

  const filtres = [
    { id: "tous", label: lbl.tous, count: alertes.length },
    {
      id: "urgent",
      label: lbl.urgent,
      count: alertes.filter((a) => a.niveau === "urgent").length,
    },
    {
      id: "warning",
      label: lbl.warning,
      count: alertes.filter((a) => a.niveau === "warning").length,
    },
    {
      id: "info",
      label: lbl.info,
      count: alertes.filter((a) => a.niveau === "info").length,
    },
  ];

  const alertesFiltrees =
    filtre === "tous" ? alertes : alertes.filter((a) => a.niveau === filtre);

  const getNiveauStyle = (niveau) => {
    switch (niveau) {
      case "urgent":
        return {
          bg: theme.themeMode === "light" ? "#FFE0E0" : "#2C1010",
          border: "#E53935",
          badge: "#E53935",
        };
      case "warning":
        return {
          bg: theme.themeMode === "light" ? "#FFF3E0" : "#2C1E10",
          border: "#F57C00",
          badge: "#F57C00",
        };
      case "info":
        return {
          bg: theme.themeMode === "light" ? "#E3F2FD" : "#0D1E2C",
          border: "#1565C0",
          badge: "#1565C0",
        };
      default:
        return { bg: theme.card, border: theme.border, badge: "#888" };
    }
  };

  const handleResoudre = async (id) => {
    try {
      await updateDoc(doc(db, "alertes", id), { resolu: true });
    } catch (e) {}
  };

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
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {lbl.title}
        </Text>
        <View style={styles.alertBadge}>
          <Text style={styles.alertBadgeText}>
            {alertes.filter((a) => a.niveau === "urgent" && !a.resolu).length}{" "}
            {lbl.urgent}
          </Text>
        </View>
      </View>

      <View style={styles.resumeGrid}>
        {[
          [
            "#E53935",
            alertes.filter((a) => a.niveau === "urgent").length,
            lbl.urgent,
          ],
          [
            "#F57C00",
            alertes.filter((a) => a.niveau === "warning").length,
            lbl.warning,
          ],
          [
            "#1565C0",
            alertes.filter((a) => a.niveau === "info").length,
            lbl.info,
          ],
        ].map(([color, count, label], i) => (
          <View key={i} style={[styles.resumeCard, { backgroundColor: color }]}>
            <Text style={styles.resumeNumber}>{count}</Text>
            <Text style={styles.resumeLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtresContainer}
      >
        {filtres.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[
              styles.filtreBtn,
              { backgroundColor: theme.card, borderColor: theme.border },
              filtre === f.id && styles.filtreBtnActive,
            ]}
            onPress={() => setFiltre(f.id)}
          >
            <Text
              style={[
                styles.filtreText,
                { color: theme.textSub },
                filtre === f.id && styles.filtreTextActive,
              ]}
            >
              {f.label} ({f.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.alertesList}>
        {alertesFiltrees.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.emptyText, { color: theme.accent }]}>
              {lbl.aucune}
            </Text>
          </View>
        ) : (
          alertesFiltrees.map((alerte) => {
            const s = getNiveauStyle(alerte.niveau);
            return (
              <View
                key={alerte.id}
                style={[
                  styles.alerteCard,
                  { backgroundColor: s.bg, borderColor: s.border },
                  alerte.resolu && styles.alerteResolue,
                ]}
              >
                <Text style={styles.alerteIcone}>{alerte.icone}</Text>
                <View style={styles.alerteCenter}>
                  <View style={styles.alerteHeaderRow}>
                    <Text style={[styles.alerteChambre, { color: theme.text }]}>
                      {lbl.chambre} {alerte.chambre}
                    </Text>
                    <View
                      style={[styles.niveauBadge, { backgroundColor: s.badge }]}
                    >
                      <Text style={styles.niveauText}>
                        {alerte.niveau?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[styles.alerteMessage, { color: theme.textSub }]}
                  >
                    {alerte.message}
                  </Text>
                  <Text style={[styles.alerteHeure, { color: theme.textSub }]}>
                    🕐 {alerte.heure}
                  </Text>
                  {!alerte.resolu ? (
                    <TouchableOpacity
                      style={styles.resoudreBtn}
                      onPress={() => handleResoudre(alerte.id)}
                    >
                      <Text style={styles.resoudreBtnText}>{lbl.resoudre}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.resoluText}>{lbl.resolu}</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold" },
  alertBadge: {
    backgroundColor: "#E53935",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  alertBadgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  resumeGrid: {
    flexDirection: "row",
    paddingHorizontal: 15,
    marginBottom: 15,
    gap: 10,
  },
  resumeCard: { flex: 1, borderRadius: 14, padding: 15, alignItems: "center" },
  resumeNumber: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  resumeLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  filtresContainer: { paddingHorizontal: 15, marginBottom: 15 },
  filtreBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filtreBtnActive: { backgroundColor: "#1565C0", borderColor: "#1565C0" },
  filtreText: { fontSize: 13 },
  filtreTextActive: { color: "#fff", fontWeight: "bold" },
  alertesList: { paddingHorizontal: 15, gap: 10 },
  emptyCard: { borderRadius: 16, padding: 30, alignItems: "center" },
  emptyText: { fontSize: 16 },
  alerteCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 15,
    borderWidth: 1.5,
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  alerteResolue: { opacity: 0.5 },
  alerteIcone: { fontSize: 28, paddingTop: 2 },
  alerteCenter: { flex: 1 },
  alerteHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  alerteChambre: { fontSize: 15, fontWeight: "bold" },
  niveauBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  niveauText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  alerteMessage: { fontSize: 13, marginBottom: 6, lineHeight: 18 },
  alerteHeure: { fontSize: 11, marginBottom: 8 },
  resoudreBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  resoudreBtnText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  resoluText: { color: "#2E7D32", fontSize: 12, fontWeight: "bold" },
});
