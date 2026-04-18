import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../config/firebase";
import { useApp } from "../context/AppContext";

export default function ChambreDetailScreen() {
  const router = useRouter();
  const { theme, lang } = useApp();
  const params = useLocalSearchParams();
  const chambreId = params.id as string;
  const [chambre, setChambre] = useState(null);
  const [alertes, setAlertes] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [activeTab, setActiveTab] = useState("etat");

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "chambres", chambreId), (snap) => {
      if (snap.exists()) setChambre({ id: snap.id, ...snap.data() });
    });
    return unsubscribe;
  }, [chambreId]);

  useEffect(() => {
    const q = query(collection(db, "alertes"), where("chambre", "==", chambreId), where("resolu", "==", false));
    const unsubscribe = onSnapshot(q, (snap) => {
      setAlertes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [chambreId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "historique"), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .filter((h) => h.message?.includes(chambreId) && h.type === "rfid").slice(0, 10);
      setHistorique(all);
    });
    return unsubscribe;
  }, [chambreId]);

  const lbl = {
    retour: lang === "ar" ? "رجوع" : lang === "en" ? "Back" : "Retour",
    chambre: lang === "ar" ? "غرفة" : lang === "en" ? "Room" : "Chambre",
    occupe: lang === "ar" ? "مشغولة" : lang === "en" ? "Occupied" : "Occupee",
    libre: lang === "ar" ? "حرة" : lang === "en" ? "Free" : "Libre",
    etat: lang === "ar" ? "الحالة" : lang === "en" ? "Status" : "Etat",
    capteurs: lang === "ar" ? "المجسات" : lang === "en" ? "Sensors" : "Capteurs",
    acces: lang === "ar" ? "الوصول" : lang === "en" ? "Access" : "Acces",
    alertes: lang === "ar" ? "التنبيهات" : lang === "en" ? "Alerts" : "Alertes",
    lumiere: lang === "ar" ? "الضوء" : lang === "en" ? "Light" : "Lumiere",
    clim: lang === "ar" ? "التكييف" : lang === "en" ? "AC" : "Climatisation",
    fenetre: lang === "ar" ? "النافذة" : lang === "en" ? "Window" : "Fenetre",
    porte: lang === "ar" ? "الباب" : lang === "en" ? "Door" : "Porte",
    allume: lang === "ar" ? "مضاء" : lang === "en" ? "On" : "Allumee",
    eteint: lang === "ar" ? "مطفأ" : lang === "en" ? "Off" : "Eteinte",
    ouverte: lang === "ar" ? "مفتوح" : lang === "en" ? "Open" : "Ouverte",
    fermee: lang === "ar" ? "مغلق" : lang === "en" ? "Closed" : "Fermee",
    active: lang === "ar" ? "نشط" : lang === "en" ? "Active" : "Active",
    etatChambre: lang === "ar" ? "حالة الغرفة" : lang === "en" ? "Room Status" : "Etat de la chambre",
    presence: lang === "ar" ? "الحضور" : lang === "en" ? "Presence" : "Detection de presence",
    chambreOccupee: lang === "ar" ? "الغرفة مشغولة" : lang === "en" ? "Room occupied" : "Chambre occupee",
    chambreVide: lang === "ar" ? "الغرفة فارغة" : lang === "en" ? "Room empty" : "Chambre vide",
    donneesTempsReel: lang === "ar" ? "البيانات الآنية" : lang === "en" ? "Real-time data" : "Donnees en temps reel",
    alertesActives: lang === "ar" ? "التنبيهات النشطة" : lang === "en" ? "Active alerts" : "Alertes actives",
    aucuneAlerte: lang === "ar" ? "لا توجد تنبيهات" : lang === "en" ? "No active alerts" : "Aucune alerte active",
    aucunAcces: lang === "ar" ? "لا يوجد وصول" : lang === "en" ? "No access recorded" : "Aucun acces enregistre",
    chargement: lang === "ar" ? "جاري التحميل..." : lang === "en" ? "Loading..." : "Chargement...",
  };

  if (!chambre) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backBtnText, { color: theme.accent }]}>← {lbl.retour}</Text>
        </TouchableOpacity>
        <View style={styles.loadingBox}>
          <Text style={{ color: theme.accent, fontSize: 16 }}>{lbl.chargement}</Text>
        </View>
      </View>
    );
  }

  const tempColor = chambre.temperature > 30 ? "#E53935" : chambre.temperature > 27 ? "#F57C00" : "#2E7D32";
  const humColor = chambre.humidite > 80 ? "#E53935" : chambre.humidite > 75 ? "#F57C00" : "#2E7D32";
  const tempPct = Math.min((chambre.temperature / 40) * 100, 100);
  const humPct = Math.min(chambre.humidite, 100);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* HEADER */}
      <View style={[styles.hero, { backgroundColor: theme.card, borderBottomColor: chambre.presence ? "#E53935" : "#2E7D32" }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backBtnText, { color: theme.accent }]}>← {lbl.retour}</Text>
        </TouchableOpacity>
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.heroTitle, { color: theme.text }]}>{lbl.chambre} #{chambre.id}</Text>
            <Text style={[styles.heroSub, { color: theme.textSub }]}>{chambre.presence ? "👤 " + lbl.occupe : "🔓 " + lbl.libre}</Text>
          </View>
          <View style={[styles.statusBig, { backgroundColor: chambre.presence ? "#E5393522" : "#2E7D3222" }]}>
            <Text style={{ fontSize: 22 }}>{chambre.presence ? "🔴" : "🟢"}</Text>
          </View>
        </View>
        {alertes.length > 0 && (
          <View style={styles.alertesBannerRow}>
            {alertes.map((a) => (
              <View key={a.id} style={[styles.alerteBanner, { backgroundColor: a.niveau === "urgent" ? "#E53935" : "#F57C00" }]}>
                <Text style={styles.alerteBannerText}>{a.icone} {a.message?.split("chambre")[0]}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* TABS */}
      <View style={[styles.tabBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        {["etat","capteurs","acces","alertes"].map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && { borderBottomColor: "#64B5F6", borderBottomWidth: 2 }]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, { color: activeTab === tab ? "#64B5F6" : theme.textSub }]}>
              {tab === "etat" ? lbl.etat : tab === "capteurs" ? lbl.capteurs : tab === "acces" ? lbl.acces : lbl.alertes}
            </Text>
            {tab === "alertes" && alertes.length > 0 && (
              <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{alertes.length}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ETAT */}
        {activeTab === "etat" && (
          <View>
            <Text style={[styles.sectionLabel, { color: theme.accent }]}>{lbl.etatChambre}</Text>
            <View style={styles.equipGrid}>
              {[
                { icon: "💡", label: lbl.lumiere, status: chambre.lumiere ? lbl.allume : lbl.eteint, color: chambre.lumiere ? "#FFD54F" : theme.textSub, active: chambre.lumiere },
                { icon: "❄️", label: lbl.clim, status: chambre.clim ? lbl.active : lbl.eteint, color: chambre.clim ? "#64B5F6" : theme.textSub, active: chambre.clim },
                { icon: "🪟", label: lbl.fenetre, status: chambre.fenetre ? lbl.ouverte : lbl.fermee, color: chambre.fenetre ? "#F57C00" : theme.textSub, active: chambre.fenetre },
                { icon: "🚪", label: lbl.porte, status: chambre.porteOuverte ? lbl.ouverte : lbl.fermee, color: chambre.porteOuverte ? "#2E7D32" : theme.textSub, active: chambre.porteOuverte },
              ].map((item, i) => (
                <View key={i} style={[styles.equipCard, { backgroundColor: theme.card, borderColor: item.active ? item.color : theme.border }]}>
                  <Text style={styles.equipIcon}>{item.icon}</Text>
                  <Text style={[styles.equipLabel, { color: theme.textSub }]}>{item.label}</Text>
                  <Text style={[styles.equipStatus, { color: item.color }]}>{item.status}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.sectionLabel, { color: theme.accent }]}>{lbl.presence}</Text>
            <View style={[styles.presenceCard, { backgroundColor: theme.card }]}>
              <Text style={styles.presenceIcon}>{chambre.presence ? "👤" : "🚶"}</Text>
              <View style={styles.presenceInfo}>
                <Text style={[styles.presenceTitle, { color: theme.text }]}>{chambre.presence ? lbl.chambreOccupee : lbl.chambreVide}</Text>
              </View>
              <View style={[styles.presenceDot, { backgroundColor: chambre.presence ? "#E53935" : "#2E7D32" }]} />
            </View>
            {chambre.fenetre && chambre.clim && (
              <View style={[styles.warningBox, { backgroundColor: "#F57C0022", borderColor: "#F57C00" }]}>
                <Text style={{ color: "#F57C00", fontSize: 13, lineHeight: 20 }}>⚠️ Fenetre ouverte avec climatisation active</Text>
              </View>
            )}
          </View>
        )}

        {/* CAPTEURS */}
        {activeTab === "capteurs" && (
          <View>
            <Text style={[styles.sectionLabel, { color: theme.accent }]}>{lbl.donneesTempsReel}</Text>
            {[
              { icon: "🌡️", label: lang === "ar" ? "درجة الحرارة" : "Temperature", value: chambre.temperature?.toFixed(1) + "°C", color: tempColor, pct: tempPct, scale: ["0°C", "18-24°C", "40°C"] },
              { icon: "💧", label: lang === "ar" ? "الرطوبة" : "Humidite", value: chambre.humidite?.toFixed(1) + "%", color: humColor, pct: humPct, scale: ["0%", "40-60%", "100%"] },
            ].map((sensor, i) => (
              <View key={i} style={[styles.sensorCard, { backgroundColor: theme.card }]}>
                <View style={styles.sensorHeader}>
                  <Text style={styles.sensorIcon}>{sensor.icon}</Text>
                  <View>
                    <Text style={[styles.sensorLabel, { color: theme.textSub }]}>{sensor.label}</Text>
                    <Text style={[styles.sensorValue, { color: sensor.color }]}>{sensor.value}</Text>
                  </View>
                </View>
                <View style={[styles.progressBar, { backgroundColor: theme.bg3 }]}>
                  <View style={[styles.progressFill, { width: `${sensor.pct}%`, backgroundColor: sensor.color }]} />
                </View>
                <View style={styles.sensorScale}>
                  {sensor.scale.map((s, j) => <Text key={j} style={[styles.sensorScaleText, { color: theme.textSub }]}>{s}</Text>)}
                </View>
              </View>
            ))}
            <View style={styles.resumeGrid}>
              {["Capteur PIR","Capteur DHT22","Module RFID","ESP32"].map((item, i) => (
                <View key={i} style={[styles.resumeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.resumeLabel, { color: theme.textSub }]}>{item}</Text>
                  <Text style={[styles.resumeVal, { color: "#2E7D32" }]}>Actif</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ACCES */}
        {activeTab === "acces" && (
          <View>
            <Text style={[styles.sectionLabel, { color: theme.accent }]}>RFID</Text>
            {historique.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: theme.card }]}>
                <Text style={[styles.emptyText, { color: theme.textSub }]}>{lbl.aucunAcces}</Text>
              </View>
            ) : (
              historique.map((h) => (
                <View key={h.id} style={[styles.rfidItem, { backgroundColor: theme.card, borderLeftColor: h.autorise === false ? "#E53935" : "#2E7D32" }]}>
                  <Text style={styles.rfidIcon}>{h.icone || "🔑"}</Text>
                  <View style={styles.rfidInfo}>
                    <Text style={[styles.rfidMsg, { color: theme.text }]}>{h.message}</Text>
                    <Text style={[styles.rfidMeta, { color: theme.textSub }]}>{h.heure} · {h.date}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ALERTES */}
        {activeTab === "alertes" && (
          <View>
            <Text style={[styles.sectionLabel, { color: theme.accent }]}>{lbl.alertesActives}</Text>
            {alertes.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: theme.card }]}>
                <Text style={[styles.emptyText, { color: theme.textSub }]}>{lbl.aucuneAlerte}</Text>
              </View>
            ) : (
              alertes.map((a) => (
                <View key={a.id} style={[styles.alerteCard, { backgroundColor: theme.card, borderLeftColor: a.niveau === "urgent" ? "#E53935" : "#F57C00" }]}>
                  <Text style={styles.alerteIcon}>{a.icone}</Text>
                  <View style={styles.alerteInfo}>
                    <Text style={[styles.alerteMsg, { color: theme.text }]}>{a.message}</Text>
                    <Text style={[styles.alerteMeta, { color: theme.textSub }]}>{a.heure} · {a.date}</Text>
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
  container: { flex: 1 },
  backBtn: { position: "absolute", top: 16, left: 16, zIndex: 10, padding: 8 },
  backBtnText: { fontSize: 16 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  hero: { padding: 20, paddingTop: 60, borderBottomWidth: 2 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  heroTitle: { fontSize: 26, fontWeight: "bold" },
  heroSub: { fontSize: 13, marginTop: 4 },
  statusBig: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  alertesBannerRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  alerteBanner: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  alerteBannerText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center", position: "relative" },
  tabText: { fontSize: 11 },
  tabBadge: { position: "absolute", top: 8, right: 8, backgroundColor: "#E53935", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  content: { flex: 1, padding: 16 },
  sectionLabel: { fontSize: 15, fontWeight: "bold", marginBottom: 12, marginTop: 8 },
  equipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  equipCard: { width: "47%", borderRadius: 14, padding: 16, alignItems: "center", borderWidth: 1 },
  equipIcon: { fontSize: 32, marginBottom: 8 },
  equipLabel: { fontSize: 12, marginBottom: 4 },
  equipStatus: { fontSize: 13, fontWeight: "bold" },
  presenceCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 16, marginBottom: 12, gap: 12 },
  presenceIcon: { fontSize: 36 },
  presenceInfo: { flex: 1 },
  presenceTitle: { fontSize: 15, fontWeight: "bold" },
  presenceDot: { width: 12, height: 12, borderRadius: 6 },
  warningBox: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 12 },
  sensorCard: { borderRadius: 14, padding: 16, marginBottom: 14 },
  sensorHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  sensorIcon: { fontSize: 32 },
  sensorLabel: { fontSize: 12, marginBottom: 2 },
  sensorValue: { fontSize: 28, fontWeight: "bold" },
  progressBar: { height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: "100%", borderRadius: 5 },
  sensorScale: { flexDirection: "row", justifyContent: "space-between" },
  sensorScaleText: { fontSize: 10 },
  resumeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  resumeCard: { width: "47%", borderRadius: 12, padding: 14, borderWidth: 1 },
  resumeLabel: { fontSize: 11, marginBottom: 4 },
  resumeVal: { fontSize: 13, fontWeight: "bold" },
  rfidItem: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 3, gap: 10 },
  rfidIcon: { fontSize: 24 },
  rfidInfo: { flex: 1 },
  rfidMsg: { fontSize: 12, marginBottom: 3 },
  rfidMeta: { fontSize: 11 },
  alerteCard: { flexDirection: "row", alignItems: "flex-start", borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 3, gap: 10 },
  alerteIcon: { fontSize: 24 },
  alerteInfo: { flex: 1 },
  alerteMsg: { fontSize: 13, marginBottom: 4 },
  alerteMeta: { fontSize: 11 },
  emptyBox: { borderRadius: 14, padding: 30, alignItems: "center" },
  emptyText: { fontSize: 14 },
});
