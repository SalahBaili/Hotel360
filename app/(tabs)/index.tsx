import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../config/firebase";

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    chambresOccupees: 0,
    chambresLibres: 0,
    alertes: 0,
    temperature: 0,
  });
  const [chambres] = useState([
    {
      id: "101",
      presence: false,
      temperature: 22,
      humidite: 55,
      fenetre: false,
      clim: false,
      lumiere: false,
    },
    {
      id: "102",
      presence: true,
      temperature: 26,
      humidite: 60,
      fenetre: false,
      clim: true,
      lumiere: true,
    },
    {
      id: "103",
      presence: false,
      temperature: 21,
      humidite: 50,
      fenetre: true,
      clim: false,
      lumiere: false,
    },
    {
      id: "104",
      presence: true,
      temperature: 28,
      humidite: 65,
      fenetre: false,
      clim: true,
      lumiere: true,
    },
    {
      id: "105",
      presence: false,
      temperature: 23,
      humidite: 52,
      fenetre: false,
      clim: false,
      lumiere: false,
    },
    {
      id: "106",
      presence: true,
      temperature: 25,
      humidite: 58,
      fenetre: false,
      clim: true,
      lumiere: true,
    },
  ]);
  const [zonesCommunes] = useState([
    { id: "lobby", nom: "Lobby", icone: "🏛️", occupee: true },
    { id: "restaurant", nom: "Restaurant", icone: "🍽️", occupee: true },
    { id: "spa", nom: "Spa", icone: "🧖", occupee: false },
    { id: "gym", nom: "Gym", icone: "🏋️", occupee: false },
    { id: "salle_reunion", nom: "Salle Réunion", icone: "💼", occupee: true },
    { id: "piscine", nom: "Piscine", icone: "🏊", occupee: false },
  ]);

  useEffect(() => {
    const occupees = chambres.filter((c) => c.presence).length;
    const alertes = chambres.filter(
      (c) => c.temperature > 27 || (c.fenetre && c.clim),
    ).length;
    const tempMoy = Math.round(
      chambres.reduce((a, c) => a + c.temperature, 0) / chambres.length,
    );
    setStats({
      chambresOccupees: occupees,
      chambresLibres: chambres.length - occupees,
      alertes,
      temperature: tempMoy,
    });
  }, [chambres]);

  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setCurrentUser(user));
    return unsubscribe;
  }, []);

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

      {/* Stats Cards */}
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

      {/* Chambres */}
      <Text style={styles.sectionTitle}>🛏️ État des Chambres</Text>
      <View style={styles.chambresGrid}>
        {chambres.map((chambre) => (
          <View
            key={chambre.id}
            style={[
              styles.chambreCard,
              chambre.presence && styles.chambreOccupee,
            ]}
          >
            <View style={styles.chambreHeader}>
              <Text style={styles.chambreNum}>#{chambre.id}</Text>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: chambre.presence ? "#E53935" : "#2E7D32" },
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
            {chambre.temperature > 27 && (
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>⚠️ Chaud</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Bouton Historique */}
      <TouchableOpacity
        style={styles.historyBtn}
        onPress={() => router.push("/(tabs)/history")}
      >
        <Text style={styles.historyBtnText}>
          📊 Voir l'Historique & Statistiques
        </Text>
      </TouchableOpacity>

      {/* Zones Communes */}
      <Text style={styles.sectionTitle}>🏨 Zones Communes</Text>
      <View style={styles.zonesGrid}>
        {zonesCommunes.map((zone) => (
          <View
            key={zone.id}
            style={[styles.zoneCard, zone.occupee && styles.zoneOccupee]}
          >
            <Text style={styles.zoneIcon}>{zone.icone}</Text>
            <Text style={styles.zoneNom}>{zone.nom}</Text>
            <Text
              style={[
                styles.zoneStatus,
                { color: zone.occupee ? "#E53935" : "#2E7D32" },
              ]}
            >
              {zone.occupee ? "Occupé" : "Libre"}
            </Text>
          </View>
        ))}
      </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
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
  chambreIcons: { flexDirection: "row", gap: 8 },
  alertBadge: {
    marginTop: 8,
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
});
