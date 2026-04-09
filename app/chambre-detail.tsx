import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { db } from "../config/firebase";

export default function ChambreDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const chambreId = params.id as string;

  const [chambre, setChambre] = useState(null);
  const [alertes, setAlertes] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [activeTab, setActiveTab] = useState("etat");

  // Données chambre temps réel
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "chambres", chambreId), (snap) => {
      if (snap.exists()) setChambre({ id: snap.id, ...snap.data() });
    });
    return unsubscribe;
  }, [chambreId]);

  // Alertes non résolues de cette chambre
  useEffect(() => {
    const q = query(
      collection(db, "alertes"),
      where("chambre", "==", chambreId),
      where("resolu", "==", false),
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setAlertes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [chambreId]);

  // Historique RFID de cette chambre
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "historique"), (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((h) => h.message?.includes(chambreId) && h.type === "rfid")
        .slice(0, 10);
      setHistorique(all);
    });
    return unsubscribe;
  }, [chambreId]);

  if (!chambre) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>⏳ Chargement...</Text>
        </View>
      </View>
    );
  }

  const tempColor =
    chambre.temperature > 30
      ? "#E53935"
      : chambre.temperature > 27
        ? "#F57C00"
        : "#2E7D32";

  const humColor =
    chambre.humidite > 80
      ? "#E53935"
      : chambre.humidite > 75
        ? "#F57C00"
        : "#2E7D32";

  const tempPct = Math.min((chambre.temperature / 40) * 100, 100);
  const humPct = Math.min(chambre.humidite, 100);

  return (
    <View style={styles.container}>
      {/* ── HEADER ── */}
      <View
        style={[
          styles.hero,
          { borderBottomColor: chambre.presence ? "#E53935" : "#2E7D32" },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>

        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroTitle}>Chambre #{chambre.id}</Text>
            <Text style={styles.heroSub}>
              {chambre.presence ? "👤 Occupée" : "🔓 Libre"}
              {chambre.porteOuverte ? "  •  🚪 Porte ouverte" : ""}
            </Text>
          </View>
          <View
            style={[
              styles.statusBig,
              { backgroundColor: chambre.presence ? "#E5393522" : "#2E7D3222" },
            ]}
          >
            <Text
              style={[
                styles.statusBigDot,
                { color: chambre.presence ? "#E53935" : "#2E7D32" },
              ]}
            >
              {chambre.presence ? "🔴" : "🟢"}
            </Text>
          </View>
        </View>

        {/* Badges alertes */}
        {alertes.length > 0 && (
          <View style={styles.alertesBannerRow}>
            {alertes.map((a) => (
              <View
                key={a.id}
                style={[
                  styles.alerteBanner,
                  {
                    backgroundColor:
                      a.niveau === "urgent" ? "#E53935" : "#F57C00",
                  },
                ]}
              >
                <Text style={styles.alerteBannerText}>
                  {a.icone} {a.message?.split("chambre")[0]}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── TABS ── */}
      <View style={styles.tabBar}>
        {["etat", "capteurs", "acces", "alertes"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "etat"
                ? "🛏️ État"
                : tab === "capteurs"
                  ? "📡 Capteurs"
                  : tab === "acces"
                    ? "🔐 Accès"
                    : "🚨 Alertes"}
            </Text>
            {tab === "alertes" && alertes.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{alertes.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ══ TAB ÉTAT ══ */}
        {activeTab === "etat" && (
          <View>
            <Text style={styles.sectionLabel}>État de la chambre</Text>

            {/* Grille équipements */}
            <View style={styles.equipGrid}>
              <View
                style={[
                  styles.equipCard,
                  chambre.lumiere && styles.equipActive,
                ]}
              >
                <Text style={styles.equipIcon}>💡</Text>
                <Text style={styles.equipLabel}>Lumière</Text>
                <Text
                  style={[
                    styles.equipStatus,
                    { color: chambre.lumiere ? "#FFD54F" : "#888" },
                  ]}
                >
                  {chambre.lumiere ? "Allumée" : "Éteinte"}
                </Text>
              </View>
              <View
                style={[styles.equipCard, chambre.clim && styles.equipActive]}
              >
                <Text style={styles.equipIcon}>❄️</Text>
                <Text style={styles.equipLabel}>Climatisation</Text>
                <Text
                  style={[
                    styles.equipStatus,
                    { color: chambre.clim ? "#64B5F6" : "#888" },
                  ]}
                >
                  {chambre.clim ? "Active" : "Éteinte"}
                </Text>
              </View>
              <View
                style={[
                  styles.equipCard,
                  chambre.fenetre && styles.equipActiveOrange,
                ]}
              >
                <Text style={styles.equipIcon}>🪟</Text>
                <Text style={styles.equipLabel}>Fenêtre</Text>
                <Text
                  style={[
                    styles.equipStatus,
                    { color: chambre.fenetre ? "#F57C00" : "#888" },
                  ]}
                >
                  {chambre.fenetre ? "Ouverte" : "Fermée"}
                </Text>
              </View>
              <View
                style={[
                  styles.equipCard,
                  chambre.porteOuverte && styles.equipActiveGreen,
                ]}
              >
                <Text style={styles.equipIcon}>🚪</Text>
                <Text style={styles.equipLabel}>Porte</Text>
                <Text
                  style={[
                    styles.equipStatus,
                    { color: chambre.porteOuverte ? "#2E7D32" : "#888" },
                  ]}
                >
                  {chambre.porteOuverte ? "Ouverte" : "Fermée"}
                </Text>
              </View>
            </View>

            {/* Présence */}
            <Text style={styles.sectionLabel}>Détection de présence</Text>
            <View style={styles.presenceCard}>
              <Text style={styles.presenceIcon}>
                {chambre.presence ? "👤" : "🚶"}
              </Text>
              <View style={styles.presenceInfo}>
                <Text style={styles.presenceTitle}>
                  {chambre.presence ? "Chambre occupée" : "Chambre vide"}
                </Text>
                <Text style={styles.presenceSub}>
                  {chambre.presence
                    ? "Un occupant est détecté dans la chambre"
                    : "Aucune présence détectée actuellement"}
                </Text>
              </View>
              <View
                style={[
                  styles.presenceDot,
                  { backgroundColor: chambre.presence ? "#E53935" : "#2E7D32" },
                ]}
              />
            </View>

            {/* Alerte fenêtre + clim */}
            {chambre.fenetre && chambre.clim && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Fenêtre ouverte avec climatisation active — consommation
                  énergétique excessive !
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ══ TAB CAPTEURS ══ */}
        {activeTab === "capteurs" && (
          <View>
            <Text style={styles.sectionLabel}>Données en temps réel</Text>

            {/* Température */}
            <View style={styles.sensorCard}>
              <View style={styles.sensorHeader}>
                <Text style={styles.sensorIcon}>🌡️</Text>
                <View>
                  <Text style={styles.sensorLabel}>Température</Text>
                  <Text style={[styles.sensorValue, { color: tempColor }]}>
                    {chambre.temperature?.toFixed(1)}°C
                  </Text>
                </View>
                <View
                  style={[
                    styles.sensorBadge,
                    { backgroundColor: tempColor + "22" },
                  ]}
                >
                  <Text style={[styles.sensorBadgeText, { color: tempColor }]}>
                    {chambre.temperature > 30
                      ? "🔴 Critique"
                      : chambre.temperature > 27
                        ? "🟠 Élevée"
                        : "🟢 Normale"}
                  </Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${tempPct}%`, backgroundColor: tempColor },
                  ]}
                />
              </View>
              <View style={styles.sensorScale}>
                <Text style={styles.sensorScaleText}>0°C</Text>
                <Text style={styles.sensorScaleText}>Idéal: 18–24°C</Text>
                <Text style={styles.sensorScaleText}>40°C</Text>
              </View>
            </View>

            {/* Humidité */}
            <View style={styles.sensorCard}>
              <View style={styles.sensorHeader}>
                <Text style={styles.sensorIcon}>💧</Text>
                <View>
                  <Text style={styles.sensorLabel}>Humidité</Text>
                  <Text style={[styles.sensorValue, { color: humColor }]}>
                    {chambre.humidite?.toFixed(1)}%
                  </Text>
                </View>
                <View
                  style={[
                    styles.sensorBadge,
                    { backgroundColor: humColor + "22" },
                  ]}
                >
                  <Text style={[styles.sensorBadgeText, { color: humColor }]}>
                    {chambre.humidite > 80
                      ? "🔴 Trop humide"
                      : chambre.humidite > 75
                        ? "🟠 Élevée"
                        : "🟢 Normale"}
                  </Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${humPct}%`, backgroundColor: humColor },
                  ]}
                />
              </View>
              <View style={styles.sensorScale}>
                <Text style={styles.sensorScaleText}>0%</Text>
                <Text style={styles.sensorScaleText}>Idéal: 40–60%</Text>
                <Text style={styles.sensorScaleText}>100%</Text>
              </View>
            </View>

            {/* Résumé capteurs */}
            <View style={styles.resumeGrid}>
              <View style={styles.resumeCard}>
                <Text style={styles.resumeLabel}>Capteur PIR</Text>
                <Text style={styles.resumeVal}>✅ Actif</Text>
              </View>
              <View style={styles.resumeCard}>
                <Text style={styles.resumeLabel}>Capteur DHT22</Text>
                <Text style={styles.resumeVal}>✅ Actif</Text>
              </View>
              <View style={styles.resumeCard}>
                <Text style={styles.resumeLabel}>Module RFID</Text>
                <Text style={styles.resumeVal}>✅ Actif</Text>
              </View>
              <View style={styles.resumeCard}>
                <Text style={styles.resumeLabel}>ESP32</Text>
                <Text style={styles.resumeVal}>✅ Connecté</Text>
              </View>
            </View>
          </View>
        )}

        {/* ══ TAB ACCÈS RFID ══ */}
        {activeTab === "acces" && (
          <View>
            <Text style={styles.sectionLabel}>Historique des accès RFID</Text>
            {historique.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>🔐 Aucun accès enregistré</Text>
              </View>
            ) : (
              historique.map((h) => (
                <View
                  key={h.id}
                  style={[
                    styles.rfidItem,
                    {
                      borderLeftColor:
                        h.autorise === false ? "#E53935" : "#2E7D32",
                    },
                  ]}
                >
                  <Text style={styles.rfidIcon}>{h.icone || "🔑"}</Text>
                  <View style={styles.rfidInfo}>
                    <Text style={styles.rfidMsg}>{h.message}</Text>
                    <Text style={styles.rfidMeta}>
                      {h.heure} · {h.date}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.rfidBadge,
                      {
                        backgroundColor:
                          h.autorise === false ? "#E5393522" : "#2E7D3222",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rfidBadgeText,
                        { color: h.autorise === false ? "#E53935" : "#2E7D32" },
                      ]}
                    >
                      {h.autorise === false ? "❌ Refusé" : "✅ Autorisé"}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ══ TAB ALERTES ══ */}
        {activeTab === "alertes" && (
          <View>
            <Text style={styles.sectionLabel}>Alertes actives</Text>
            {alertes.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>✅ Aucune alerte active</Text>
              </View>
            ) : (
              alertes.map((a) => (
                <View
                  key={a.id}
                  style={[
                    styles.alerteCard,
                    {
                      borderLeftColor:
                        a.niveau === "urgent" ? "#E53935" : "#F57C00",
                    },
                  ]}
                >
                  <Text style={styles.alerteIcon}>{a.icone}</Text>
                  <View style={styles.alerteInfo}>
                    <Text style={styles.alerteMsg}>{a.message}</Text>
                    <Text style={styles.alerteMeta}>
                      {a.heure} · {a.date}
                    </Text>
                    <View
                      style={[
                        styles.niveauBadge,
                        {
                          backgroundColor:
                            a.niveau === "urgent" ? "#E53935" : "#F57C00",
                        },
                      ]}
                    >
                      <Text style={styles.niveauText}>
                        {a.niveau?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628" },
  backBtn: { position: "absolute", top: 16, left: 16, zIndex: 10, padding: 8 },
  backBtnText: { color: "#64B5F6", fontSize: 16 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#64B5F6", fontSize: 16 },

  hero: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#1E2D45",
    borderBottomWidth: 2,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  heroTitle: { fontSize: 26, fontWeight: "bold", color: "#fff" },
  heroSub: { fontSize: 13, color: "#888", marginTop: 4 },
  statusBig: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBigDot: { fontSize: 22 },

  alertesBannerRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  alerteBanner: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  alerteBannerText: { color: "#fff", fontSize: 11, fontWeight: "bold" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#1E2D45",
    borderBottomWidth: 1,
    borderBottomColor: "#2A3F5F",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    position: "relative",
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#64B5F6" },
  tabText: { fontSize: 11, color: "#888" },
  tabTextActive: { color: "#64B5F6", fontWeight: "bold" },
  tabBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#E53935",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tabBadgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },

  content: { flex: 1, padding: 16 },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#64B5F6",
    marginBottom: 12,
    marginTop: 8,
  },

  equipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  equipCard: {
    width: "47%",
    backgroundColor: "#1E2D45",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  equipActive: { borderColor: "#FFD54F", backgroundColor: "#1E2D45" },
  equipActiveOrange: { borderColor: "#F57C00" },
  equipActiveGreen: { borderColor: "#2E7D32" },
  equipIcon: { fontSize: 32, marginBottom: 8 },
  equipLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
  equipStatus: { fontSize: 13, fontWeight: "bold" },

  presenceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E2D45",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  presenceIcon: { fontSize: 36 },
  presenceInfo: { flex: 1 },
  presenceTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  presenceSub: { fontSize: 12, color: "#888" },
  presenceDot: { width: 12, height: 12, borderRadius: 6 },

  warningBox: {
    backgroundColor: "#F57C0022",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F57C00",
    marginBottom: 12,
  },
  warningText: { color: "#F57C00", fontSize: 13, lineHeight: 20 },

  sensorCard: {
    backgroundColor: "#1E2D45",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  sensorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  sensorIcon: { fontSize: 32 },
  sensorLabel: { fontSize: 12, color: "#888", marginBottom: 2 },
  sensorValue: { fontSize: 28, fontWeight: "bold" },
  sensorBadge: {
    marginLeft: "auto",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sensorBadgeText: { fontSize: 11, fontWeight: "bold" },
  progressBar: {
    height: 10,
    backgroundColor: "#2A3F5F",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: { height: "100%", borderRadius: 5 },
  sensorScale: { flexDirection: "row", justifyContent: "space-between" },
  sensorScaleText: { fontSize: 10, color: "#555" },

  resumeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  resumeCard: {
    width: "47%",
    backgroundColor: "#1E2D45",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  resumeLabel: { fontSize: 11, color: "#888", marginBottom: 4 },
  resumeVal: { fontSize: 13, fontWeight: "bold", color: "#2E7D32" },

  rfidItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E2D45",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    gap: 10,
  },
  rfidIcon: { fontSize: 24 },
  rfidInfo: { flex: 1 },
  rfidMsg: { fontSize: 12, color: "#ccc", marginBottom: 3 },
  rfidMeta: { fontSize: 11, color: "#555" },
  rfidBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  rfidBadgeText: { fontSize: 10, fontWeight: "bold" },

  alerteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#1E2D45",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    gap: 10,
  },
  alerteIcon: { fontSize: 24 },
  alerteInfo: { flex: 1 },
  alerteMsg: { fontSize: 13, color: "#fff", marginBottom: 4 },
  alerteMeta: { fontSize: 11, color: "#555", marginBottom: 8 },
  niveauBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  niveauText: { color: "#fff", fontSize: 10, fontWeight: "bold" },

  emptyBox: {
    backgroundColor: "#1E2D45",
    borderRadius: 14,
    padding: 30,
    alignItems: "center",
  },
  emptyText: { color: "#888", fontSize: 14 },
});
