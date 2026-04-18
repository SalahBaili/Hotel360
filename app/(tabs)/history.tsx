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
import { useApp } from "../../context/AppContext";

export default function HistoryScreen() {
  const { theme, lang } = useApp();
  const [activeTab, setActiveTab] = useState("stats");
  const [refreshing, setRefreshing] = useState(false);
  const [historique, setHistorique] = useState([]);
  const [chambres, setChambres] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "historique"), (snapshot) => {
      setHistorique(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "chambres"), (snapshot) => {
      setChambres(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const lbl = {
    title: lang === "ar" ? "السجل" : lang === "en" ? "History" : "Historique",
    stats:
      lang === "ar"
        ? "الاحصائيات"
        : lang === "en"
          ? "Statistics"
          : "Statistiques",
    events: lang === "ar" ? "الاحداث" : lang === "en" ? "Events" : "Evenements",
    occupation:
      lang === "ar"
        ? "نسبة الاشغال"
        : lang === "en"
          ? "Occupancy Rate"
          : "Taux Occupation",
    temp:
      lang === "ar"
        ? "متوسط الحرارة"
        : lang === "en"
          ? "Avg Temp"
          : "Temp Moyenne",
    totalAlertes:
      lang === "ar"
        ? "مجموع التنبيهات"
        : lang === "en"
          ? "Total Alerts"
          : "Total Alertes",
    chambres: lang === "ar" ? "الغرف" : lang === "en" ? "Rooms" : "Chambres",
    chargement:
      lang === "ar"
        ? "جاري التحميل..."
        : lang === "en"
          ? "Loading..."
          : "Chargement...",
  };

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
    if (type === "login") return "#2E7D32";
    if (type === "alerte") return "#E53935";
    return "#1565C0";
  };

  const historiqueGroupe = historique.reduce((groups, item) => {
    const date = item.date || "Autre";
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {});

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
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "stats" && styles.tabActive]}
          onPress={() => setActiveTab("stats")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "stats" ? "#fff" : theme.textSub },
            ]}
          >
            {lbl.stats}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "events" && styles.tabActive]}
          onPress={() => setActiveTab("events")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "events" ? "#fff" : theme.textSub },
            ]}
          >
            {lbl.events}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "stats" ? (
        <View>
          <View style={styles.resumeGrid}>
            {[
              ["#1565C0", tauxOccupation + "%", lbl.occupation],
              ["#F57C00", tempMoy + "°", lbl.temp],
              [
                "#E53935",
                historique.filter((h) => h.type === "alerte").length,
                lbl.totalAlertes,
              ],
              ["#2E7D32", chambres.length, lbl.chambres],
            ].map(([color, val, label], i) => (
              <View
                key={i}
                style={[styles.resumeCard, { backgroundColor: color }]}
              >
                <Text style={styles.resumeNumber}>{val}</Text>
                <Text style={styles.resumeLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.chartTitle, { color: theme.accent }]}>
              {lang === "ar"
                ? "نسبة الاشغال (%) - 7 ايام"
                : lang === "en"
                  ? "Occupancy Rate (%) - 7 days"
                  : "Taux d'Occupation (%) - 7 jours"}
            </Text>
            <View style={styles.chart}>
              {statsData.map((item) => (
                <View key={item.jour} style={styles.chartBar}>
                  <Text style={[styles.chartValue, { color: theme.textSub }]}>
                    {item.occupation}%
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      { height: (item.occupation / 100) * 120 },
                    ]}
                  />
                  <Text style={[styles.chartLabel, { color: theme.textSub }]}>
                    {item.jour}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.chartTitle, { color: theme.accent }]}>
              {lang === "ar"
                ? "التنبيهات اليومية - 7 ايام"
                : lang === "en"
                  ? "Daily Alerts - 7 days"
                  : "Alertes par jour - 7 jours"}
            </Text>
            <View style={styles.chart}>
              {statsData.map((item) => (
                <View key={item.jour} style={styles.chartBar}>
                  <Text style={[styles.chartValue, { color: theme.textSub }]}>
                    {item.alertes}
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (item.alertes / 10) * 120,
                        backgroundColor: "#E53935",
                      },
                    ]}
                  />
                  <Text style={[styles.chartLabel, { color: theme.textSub }]}>
                    {item.jour}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.eventsList}>
          {Object.keys(historiqueGroupe).length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.emptyText, { color: theme.accent }]}>
                {lbl.chargement}
              </Text>
            </View>
          ) : (
            Object.entries(historiqueGroupe).map(([date, events]: any) => (
              <View key={date}>
                <Text style={[styles.dateTitle, { color: theme.accent }]}>
                  {date}
                </Text>
                {events.map((event) => (
                  <View
                    key={event.id}
                    style={[styles.eventCard, { backgroundColor: theme.card }]}
                  >
                    <View
                      style={[
                        styles.eventDot,
                        { backgroundColor: getTypeColor(event.type) },
                      ]}
                    />
                    <Text style={styles.eventIcone}>{event.icone}</Text>
                    <View style={styles.eventCenter}>
                      <Text
                        style={[styles.eventMessage, { color: theme.text }]}
                      >
                        {event.message}
                      </Text>
                      <Text
                        style={[styles.eventHeure, { color: theme.textSub }]}
                      >
                        🕐 {event.heure}
                      </Text>
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
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: "bold" },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 14,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 12 },
  tabActive: { backgroundColor: "#1565C0" },
  tabText: { fontSize: 14, fontWeight: "600" },
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
    borderRadius: 16,
    padding: 20,
  },
  chartTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 15 },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 150,
  },
  chartBar: { alignItems: "center", flex: 1 },
  chartValue: { fontSize: 9, marginBottom: 4 },
  bar: { width: 28, backgroundColor: "#1565C0", borderRadius: 6 },
  chartLabel: { fontSize: 11, marginTop: 6 },
  eventsList: { paddingHorizontal: 15 },
  emptyCard: { borderRadius: 16, padding: 30, alignItems: "center" },
  emptyText: { fontSize: 16 },
  dateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 15,
    marginBottom: 8,
    gap: 10,
  },
  eventDot: { width: 8, height: 8, borderRadius: 4 },
  eventIcone: { fontSize: 22 },
  eventCenter: { flex: 1 },
  eventMessage: { fontSize: 13, marginBottom: 4 },
  eventHeure: { fontSize: 11 },
});
