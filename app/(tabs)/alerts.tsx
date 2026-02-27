import React, { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const alertesData = [
  {
    id: "1",
    type: "temperature",
    niveau: "urgent",
    chambre: "104",
    message: "Température trop élevée : 28°C",
    heure: "22:05",
    icone: "🌡️",
  },
  {
    id: "2",
    type: "fenetre",
    niveau: "warning",
    chambre: "103",
    message: "Fenêtre ouverte avec climatisation active",
    heure: "21:48",
    icone: "🪟",
  },
  {
    id: "3",
    type: "presence",
    niveau: "info",
    chambre: "102",
    message: "Présence détectée — lumière allumée automatiquement",
    heure: "21:30",
    icone: "👤",
  },
  {
    id: "4",
    type: "consommation",
    niveau: "warning",
    chambre: "106",
    message: "Consommation électrique anormale détectée",
    heure: "21:10",
    icone: "⚡",
  },
  {
    id: "5",
    type: "temperature",
    niveau: "urgent",
    chambre: "201",
    message: "Température trop élevée : 31°C",
    heure: "20:55",
    icone: "🌡️",
  },
  {
    id: "6",
    type: "presence",
    niveau: "info",
    chambre: "205",
    message: "Chambre vide depuis 3h — clim éteinte automatiquement",
    heure: "20:30",
    icone: "❄️",
  },
  {
    id: "7",
    type: "humidite",
    niveau: "warning",
    chambre: "301",
    message: "Humidité anormale détectée : 85%",
    heure: "19:45",
    icone: "💧",
  },
  {
    id: "8",
    type: "presence",
    niveau: "info",
    chambre: "Lobby",
    message: "Lobby vide — éclairage réduit automatiquement",
    heure: "19:20",
    icone: "🏛️",
  },
];

export default function AlertsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [filtre, setFiltre] = useState("tous");

  const filtres = [
    { id: "tous", label: "Tous", count: alertesData.length },
    {
      id: "urgent",
      label: "🔴 Urgent",
      count: alertesData.filter((a) => a.niveau === "urgent").length,
    },
    {
      id: "warning",
      label: "🟠 Warning",
      count: alertesData.filter((a) => a.niveau === "warning").length,
    },
    {
      id: "info",
      label: "🔵 Info",
      count: alertesData.filter((a) => a.niveau === "info").length,
    },
  ];

  const alertesFiltrees =
    filtre === "tous"
      ? alertesData
      : alertesData.filter((a) => a.niveau === filtre);

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚨 Alertes</Text>
        <View style={styles.alertBadge}>
          <Text style={styles.alertBadgeText}>
            {alertesData.filter((a) => a.niveau === "urgent").length} urgent
          </Text>
        </View>
      </View>

      <View style={styles.resumeGrid}>
        <View style={[styles.resumeCard, { backgroundColor: "#E53935" }]}>
          <Text style={styles.resumeNumber}>
            {alertesData.filter((a) => a.niveau === "urgent").length}
          </Text>
          <Text style={styles.resumeLabel}>Urgent</Text>
        </View>
        <View style={[styles.resumeCard, { backgroundColor: "#F57C00" }]}>
          <Text style={styles.resumeNumber}>
            {alertesData.filter((a) => a.niveau === "warning").length}
          </Text>
          <Text style={styles.resumeLabel}>Warning</Text>
        </View>
        <View style={[styles.resumeCard, { backgroundColor: "#1565C0" }]}>
          <Text style={styles.resumeNumber}>
            {alertesData.filter((a) => a.niveau === "info").length}
          </Text>
          <Text style={styles.resumeLabel}>Info</Text>
        </View>
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

      <View style={styles.alertesList}>
        {alertesFiltrees.map((alerte) => {
          const style = getNiveauStyle(alerte.niveau);
          return (
            <View
              key={alerte.id}
              style={[
                styles.alerteCard,
                { backgroundColor: style.bg, borderColor: style.border },
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
                      {alerte.niveau.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.alerteMessage}>{alerte.message}</Text>
                <Text style={styles.alerteHeure}>🕐 {alerte.heure}</Text>
              </View>
            </View>
          );
        })}
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
  alerteCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 15,
    borderWidth: 1.5,
    alignItems: "flex-start",
    gap: 12,
  },
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
  alerteHeure: { fontSize: 11, color: "#888" },
});
