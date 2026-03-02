import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc
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

export default function AlertsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [filtre, setFiltre] = useState("tous");
  const [alertes, setAlertes] = useState([]);

  // 🔥 Connexion Firebase temps réel
  useEffect(() => {
    const q = query(collection(db, "alertes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAlertes(data);
    });
    return unsubscribe;
  }, []);

  const filtres = [
    { id: "tous", label: "Tous", count: alertes.length },
    {
      id: "urgent",
      label: "🔴 Urgent",
      count: alertes.filter((a) => a.niveau === "urgent").length,
    },
    {
      id: "warning",
      label: "🟠 Warning",
      count: alertes.filter((a) => a.niveau === "warning").length,
    },
    {
      id: "info",
      label: "🔵 Info",
      count: alertes.filter((a) => a.niveau === "info").length,
    },
  ];

  const alertesFiltrees =
    filtre === "tous" ? alertes : alertes.filter((a) => a.niveau === filtre);

  const getNiveauStyle = (niveau) => {
    switch (niveau) {
      case "urgent":
        return { bg: "#2C1010", border: "#E53935", badge: "#E53935" };
      case "warning":
        return { bg: "#2C1E10", border: "#F57C00", badge: "#F57C00" };
      case "info":
        return { bg: "#0D1E2C", border: "#1565C0", badge: "#1565C0" };
      default:
        return { bg: "#1E2D45", border: "#2A3F5F", badge: "#888" };
    }
  };

  const handleResoudre = async (id) => {
    try {
      await updateDoc(doc(db, "alertes", id), { resolu: true });
    } catch (error) {
      console.log("Erreur:", error);
    }
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚨 Alertes</Text>
        <View style={styles.alertBadge}>
          <Text style={styles.alertBadgeText}>
            {alertes.filter((a) => a.niveau === "urgent" && !a.resolu).length}{" "}
            urgent
          </Text>
        </View>
      </View>

      {/* Résumé */}
      <View style={styles.resumeGrid}>
        <View style={[styles.resumeCard, { backgroundColor: "#E53935" }]}>
          <Text style={styles.resumeNumber}>
            {alertes.filter((a) => a.niveau === "urgent").length}
          </Text>
          <Text style={styles.resumeLabel}>Urgent</Text>
        </View>
        <View style={[styles.resumeCard, { backgroundColor: "#F57C00" }]}>
          <Text style={styles.resumeNumber}>
            {alertes.filter((a) => a.niveau === "warning").length}
          </Text>
          <Text style={styles.resumeLabel}>Warning</Text>
        </View>
        <View style={[styles.resumeCard, { backgroundColor: "#1565C0" }]}>
          <Text style={styles.resumeNumber}>
            {alertes.filter((a) => a.niveau === "info").length}
          </Text>
          <Text style={styles.resumeLabel}>Info</Text>
        </View>
      </View>

      {/* Filtres */}
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
              filtre === f.id && styles.filtreBtnActive,
            ]}
            onPress={() => setFiltre(f.id)}
          >
            <Text
              style={[
                styles.filtreText,
                filtre === f.id && styles.filtreTextActive,
              ]}
            >
              {f.label} ({f.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste alertes */}
      <View style={styles.alertesList}>
        {alertesFiltrees.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>✅ Aucune alerte</Text>
          </View>
        ) : (
          alertesFiltrees.map((alerte) => {
            const style = getNiveauStyle(alerte.niveau);
            return (
              <View
                key={alerte.id}
                style={[
                  styles.alerteCard,
                  { backgroundColor: style.bg, borderColor: style.border },
                  alerte.resolu && styles.alerteResolue,
                ]}
              >
                <Text style={styles.alerteIcone}>{alerte.icone}</Text>
                <View style={styles.alerteCenter}>
                  <View style={styles.alerteHeaderRow}>
                    <Text style={styles.alerteChambre}>
                      Chambre {alerte.chambre}
                    </Text>
                    <View
                      style={[
                        styles.niveauBadge,
                        { backgroundColor: style.badge },
                      ]}
                    >
                      <Text style={styles.niveauText}>
                        {alerte.niveau?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.alerteMessage}>{alerte.message}</Text>
                  <Text style={styles.alerteHeure}>🕐 {alerte.heure}</Text>
                  {!alerte.resolu && (
                    <TouchableOpacity
                      style={styles.resoudreBtn}
                      onPress={() => handleResoudre(alerte.id)}
                    >
                      <Text style={styles.resoudreBtnText}>
                        ✅ Marquer résolu
                      </Text>
                    </TouchableOpacity>
                  )}
                  {alerte.resolu && (
                    <Text style={styles.resoluText}>✅ Résolu</Text>
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
  container: { flex: 1, backgroundColor: "#0A1628" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#fff" },
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
    backgroundColor: "#1E2D45",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  filtreBtnActive: { backgroundColor: "#1565C0", borderColor: "#1565C0" },
  filtreText: { color: "#888", fontSize: 13 },
  filtreTextActive: { color: "#fff", fontWeight: "bold" },
  alertesList: { paddingHorizontal: 15, gap: 10 },
  emptyCard: {
    backgroundColor: "#1E2D45",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
  },
  emptyText: { color: "#64B5F6", fontSize: 16 },
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
  alerteChambre: { fontSize: 15, fontWeight: "bold", color: "#fff" },
  niveauBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  niveauText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  alerteMessage: {
    fontSize: 13,
    color: "#ccc",
    marginBottom: 6,
    lineHeight: 18,
  },
  alerteHeure: { fontSize: 11, color: "#888", marginBottom: 8 },
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
