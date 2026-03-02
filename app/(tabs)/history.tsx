import { collection, onSnapshot } from "firebase/firestore";
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

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState("stats");
  const [refreshing, setRefreshing] = useState(false);
  const [historique, setHistorique] = useState([]);
  const [chambres, setChambres] = useState([]);

  // 🔥 Connexion Firebase temps réel - Historique
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "historique"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHistorique(data);
    });
    return unsubscribe;
  }, []);

  // 🔥 Connexion Firebase temps réel - Chambres pour stats
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "chambres"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChambres(data);
    });
    return unsubscribe;
  }, []);

  const statsData = [
    { jour: "Lun", occupation: 65, alertes: 3 },
    { jour: "Mar", occupation: 72, alertes: 5 },
    { jour: "Mer", occupation: 58, alertes: 2 },
    { jour: "Jeu", occupation: 80, alertes: 7 },
    { jour: "Ven", occupation: 90, alertes: 4 },
    { jour: "Sam", occupation: 95, alertes: 6 },
    { jour: "Dim", occupation: 85, alertes: 3 },
  ];

  const tempMoy =
    chambres.length > 0
      ? (
          chambres.reduce((a, c) => a + c.temperature, 0) / chambres.length
        ).toFixed(1)
      : 0;

  const tauxOccupation =
    chambres.length > 0
      ? Math.round(
          (chambres.filter((c) => c.presence).length / chambres.length) * 100,
        )
      : 0;

  const getTypeColor = (type) => {
    switch (type) {
      case "login":
        return "#2E7D32";
      case "alerte":
        return "#E53935";
      case "auto":
        return "#1565C0";
      default:
        return "#888";
    }
  };

  // Grouper par date
  const historiqueGroupe = historique.reduce((groups, item) => {
    const date = item.date || "Autre";
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {});

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
        <Text style={styles.headerTitle}>📊 Historique</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "stats" && styles.tabActive]}
          onPress={() => setActiveTab("stats")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "stats" && styles.tabTextActive,
            ]}
          >
            📈 Statistiques
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "events" && styles.tabActive]}
          onPress={() => setActiveTab("events")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "events" && styles.tabTextActive,
            ]}
          >
            📋 Événements
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "stats" ? (
        <View>
          {/* Stats résumé depuis Firebase */}
          <View style={styles.resumeGrid}>
            <View style={[styles.resumeCard, { backgroundColor: "#1565C0" }]}>
              <Text style={styles.resumeNumber}>{tauxOccupation}%</Text>
              <Text style={styles.resumeLabel}>Taux Occupation</Text>
            </View>
            <View style={[styles.resumeCard, { backgroundColor: "#F57C00" }]}>
              <Text style={styles.resumeNumber}>{tempMoy}°</Text>
              <Text style={styles.resumeLabel}>Temp Moyenne</Text>
            </View>
            <View style={[styles.resumeCard, { backgroundColor: "#E53935" }]}>
              <Text style={styles.resumeNumber}>
                {historique.filter((h) => h.type === "alerte").length}
              </Text>
              <Text style={styles.resumeLabel}>Total Alertes</Text>
            </View>
            <View style={[styles.resumeCard, { backgroundColor: "#2E7D32" }]}>
              <Text style={styles.resumeNumber}>{chambres.length}</Text>
              <Text style={styles.resumeLabel}>Chambres</Text>
            </View>
          </View>

          {/* Graphique occupation */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              📊 Taux d'Occupation (%) — 7 jours
            </Text>
            <View style={styles.chart}>
              {statsData.map((item) => (
                <View key={item.jour} style={styles.chartBar}>
                  <Text style={styles.chartValue}>{item.occupation}%</Text>
                  <View
                    style={[
                      styles.bar,
                      { height: (item.occupation / 100) * 120 },
                    ]}
                  />
                  <Text style={styles.chartLabel}>{item.jour}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Graphique alertes */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>🚨 Alertes par jour — 7 jours</Text>
            <View style={styles.chart}>
              {statsData.map((item) => (
                <View key={item.jour} style={styles.chartBar}>
                  <Text style={styles.chartValue}>{item.alertes}</Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (item.alertes / 10) * 120,
                        backgroundColor: "#E53935",
                      },
                    ]}
                  />
                  <Text style={styles.chartLabel}>{item.jour}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tableau détaillé */}
          <View style={styles.tableCard}>
            <Text style={styles.chartTitle}>📋 Détail 7 jours</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Jour</Text>
              <Text style={styles.tableHeaderText}>Occup.</Text>
              <Text style={styles.tableHeaderText}>Alertes</Text>
            </View>
            {statsData.map((item) => (
              <View key={item.jour} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.jour}</Text>
                <Text style={[styles.tableCell, { color: "#64B5F6" }]}>
                  {item.occupation}%
                </Text>
                <Text style={[styles.tableCell, { color: "#E53935" }]}>
                  {item.alertes}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.eventsList}>
          {Object.keys(historiqueGroupe).length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>⏳ Chargement...</Text>
            </View>
          ) : (
            Object.entries(historiqueGroupe).map(([date, events]) => (
              <View key={date}>
                <Text style={styles.dateTitle}>{date}</Text>
                {events.map((event) => (
                  <View key={event.id} style={styles.eventCard}>
                    <View
                      style={[
                        styles.eventDot,
                        { backgroundColor: getTypeColor(event.type) },
                      ]}
                    />
                    <Text style={styles.eventIcone}>{event.icone}</Text>
                    <View style={styles.eventCenter}>
                      <Text style={styles.eventMessage}>{event.message}</Text>
                      <Text style={styles.eventHeure}>🕐 {event.heure}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628" },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginBottom: 20,
    backgroundColor: "#1E2D45",
    borderRadius: 14,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 12 },
  tabActive: { backgroundColor: "#1565C0" },
  tabText: { color: "#888", fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  resumeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
    marginBottom: 15,
    gap: 10,
  },
  resumeCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
  },
  resumeNumber: { fontSize: 26, fontWeight: "bold", color: "#fff" },
  resumeLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
    textAlign: "center",
  },
  chartCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#1E2D45",
    borderRadius: 16,
    padding: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#64B5F6",
    marginBottom: 15,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 150,
  },
  chartBar: { alignItems: "center", flex: 1 },
  chartValue: { fontSize: 9, color: "#888", marginBottom: 4 },
  bar: { width: 28, backgroundColor: "#1565C0", borderRadius: 6 },
  chartLabel: { fontSize: 11, color: "#888", marginTop: 6 },
  tableCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#1E2D45",
    borderRadius: 16,
    padding: 20,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2A3F5F",
  },
  tableHeaderText: {
    color: "#64B5F6",
    fontSize: 13,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2A3F5F",
  },
  tableCell: { color: "#fff", fontSize: 13, flex: 1, textAlign: "center" },
  eventsList: { paddingHorizontal: 15 },
  emptyCard: {
    backgroundColor: "#1E2D45",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
  },
  emptyText: { color: "#64B5F6", fontSize: 16 },
  dateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#64B5F6",
    marginTop: 15,
    marginBottom: 10,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E2D45",
    borderRadius: 14,
    padding: 15,
    marginBottom: 8,
    gap: 10,
  },
  eventDot: { width: 8, height: 8, borderRadius: 4 },
  eventIcone: { fontSize: 22 },
  eventCenter: { flex: 1 },
  eventMessage: { fontSize: 13, color: "#fff", marginBottom: 4 },
  eventHeure: { fontSize: 11, color: "#888" },
});
