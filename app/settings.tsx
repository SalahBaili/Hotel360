import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../config/firebase";
import { useApp } from "../context/AppContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { t, theme, themeMode, setThemeMode, lang, setLang, isRTL } = useApp();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── États locaux (pas encore appliqués au contexte) ──────────
  const [notifAlertes, setNotifAlertes] = useState(true);
  const [notifTemperature, setNotifTemperature] = useState(true);
  const [notifPresence, setNotifPresence] = useState(false);
  const [notifSon, setNotifSon] = useState(true);
  const [seuilTemp, setSeuilTemp] = useState(27);
  const [seuilHumidite, setSeuilHumidite] = useState(75);
  const [actualisation, setActualisation] = useState(true);

  // ── Valeurs locales pour thème et langue (appliquées seulement au Save) ──
  const [localModeNuit, setLocalModeNuit] = useState(themeMode === "dark");
  const [localLang, setLocalLang] = useState(lang);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem("hotel360_settings");
        if (saved) {
          const s = JSON.parse(saved);
          setNotifAlertes(s.notifAlertes ?? true);
          setNotifTemperature(s.notifTemperature ?? true);
          setNotifPresence(s.notifPresence ?? false);
          setNotifSon(s.notifSon ?? true);
          setSeuilTemp(s.seuilTemp ?? 27);
          setSeuilHumidite(s.seuilHumidite ?? 75);
          setActualisation(s.actualisation ?? true);
          setLocalModeNuit(s.modeNuit ?? true);
          setLocalLang(s.langue ?? "fr");
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // ── Sauvegarde : applique tout au contexte global ────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = {
        notifAlertes,
        notifTemperature,
        notifPresence,
        notifSon,
        seuilTemp,
        seuilHumidite,
        modeNuit: localModeNuit,
        actualisation,
        langue: localLang,
      };
      await AsyncStorage.setItem("hotel360_settings", JSON.stringify(settings));

      // ✅ Appliquer thème et langue seulement maintenant
      setThemeMode(localModeNuit ? "dark" : "light");
      setLang(localLang);

      // Nettoyer alertes périmées
      const q1 = query(
        collection(db, "alertes"),
        where("type", "==", "temperature"),
      );
      const q2 = query(
        collection(db, "alertes"),
        where("type", "==", "humidite"),
      );
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      await Promise.all(
        [...snap1.docs, ...snap2.docs].map((d) =>
          deleteDoc(doc(db, "alertes", d.id)),
        ),
      );

      Alert.alert(t("sauvegarde_ok"), t("sauvegarde_msg"));
    } catch (e) {
      Alert.alert("Erreur", "Impossible de sauvegarder");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(t("reinit_titre"), t("reinit_msg"), [
      { text: t("annuler"), style: "cancel" },
      {
        text: t("reinitialiser"),
        style: "destructive",
        onPress: async () => {
          setNotifAlertes(true);
          setNotifTemperature(true);
          setNotifPresence(false);
          setNotifSon(true);
          setSeuilTemp(27);
          setSeuilHumidite(75);
          setActualisation(true);
          setLocalModeNuit(true);
          setLocalLang("fr");
          // Appliquer immédiatement au reset
          setThemeMode("dark");
          setLang("fr");
          await AsyncStorage.removeItem("hotel360_settings");
        },
      },
    ]);
  };

  const SettingRow = ({ icon, title, subtitle, value, onValueChange }) => (
    <View
      style={[
        styles.settingRow,
        {
          borderBottomColor: theme.border,
          flexDirection: isRTL ? "row-reverse" : "row",
        },
      ]}
    >
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={[styles.settingInfo, isRTL && { alignItems: "flex-end" }]}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: theme.textSub }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.bg3, true: "#1565C0" }}
        thumbColor={value ? "#64B5F6" : "#888"}
      />
    </View>
  );

  const SeuilRow = ({ icon, title, value, onMoins, onPlus, unite }) => (
    <View
      style={[
        styles.settingRow,
        {
          borderBottomColor: theme.border,
          flexDirection: isRTL ? "row-reverse" : "row",
        },
      ]}
    >
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={[styles.settingInfo, isRTL && { alignItems: "flex-end" }]}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>
          {title}
        </Text>
        <Text style={[styles.settingSubtitle, { color: theme.textSub }]}>
          {value}
          {unite}
        </Text>
      </View>
      <View style={styles.seuilControls}>
        <TouchableOpacity style={styles.seuilBtn} onPress={onMoins}>
          <Text style={styles.seuilBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={[styles.seuilValue, { color: theme.text }]}>{value}</Text>
        <TouchableOpacity style={styles.seuilBtn} onPress={onPlus}>
          <Text style={styles.seuilBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color="#64B5F6" />
        <Text style={{ color: theme.accent, marginTop: 10 }}>
          {t("chargement")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View
        style={[
          styles.header,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: theme.accent, fontSize: 16 }}>
            {t("retour")}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t("parametres")}
        </Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Notifications */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.accent }]}>
          {t("notifications")}
        </Text>
        <SettingRow
          icon="🚨"
          title={t("alertes_critiques")}
          subtitle={t("alertes_critiques_sub")}
          value={notifAlertes}
          onValueChange={setNotifAlertes}
        />
        <SettingRow
          icon="🌡️"
          title={t("temperature")}
          subtitle={t("temperature_sub")}
          value={notifTemperature}
          onValueChange={setNotifTemperature}
        />
        <SettingRow
          icon="👤"
          title={t("presence")}
          subtitle={t("presence_sub")}
          value={notifPresence}
          onValueChange={setNotifPresence}
        />
        <SettingRow
          icon="🔊"
          title={t("son")}
          subtitle={t("son_sub")}
          value={notifSon}
          onValueChange={setNotifSon}
        />
      </View>

      {/* Seuils */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.accent }]}>
          {t("seuils")}
        </Text>
        <SeuilRow
          icon="🌡️"
          title={t("temp_max")}
          value={seuilTemp}
          unite="°C"
          onMoins={() => setSeuilTemp((v) => Math.max(20, v - 1))}
          onPlus={() => setSeuilTemp((v) => Math.min(40, v + 1))}
        />
        <SeuilRow
          icon="💧"
          title={t("humidite_max")}
          value={seuilHumidite}
          unite="%"
          onMoins={() => setSeuilHumidite((v) => Math.max(50, v - 5))}
          onPlus={() => setSeuilHumidite((v) => Math.min(100, v + 5))}
        />
      </View>

      {/* Affichage — utilise localModeNuit, pas le thème global */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.accent }]}>
          {t("affichage")}
        </Text>
        <SettingRow
          icon="🌙"
          title={t("mode_nuit")}
          subtitle={localModeNuit ? t("mode_nuit_sub") : t("mode_jour_sub")}
          value={localModeNuit}
          onValueChange={(val) => setLocalModeNuit(val)}
        />
        <SettingRow
          icon="🔄"
          title={t("actualisation")}
          subtitle={t("actualisation_sub")}
          value={actualisation}
          onValueChange={setActualisation}
        />
      </View>

      {/* Langue — utilise localLang, pas le contexte global */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.accent }]}>
          {t("langue")}
        </Text>
        <View style={styles.langRow}>
          {(["fr", "en", "ar"] as const).map((l) => (
            <TouchableOpacity
              key={l}
              style={[
                styles.langBtn,
                {
                  borderColor: localLang === l ? "#64B5F6" : theme.border,
                  backgroundColor:
                    localLang === l ? "#1565C022" : theme.inputBg,
                },
              ]}
              onPress={() => setLocalLang(l)}
            >
              <Text style={styles.langFlag}>
                {l === "fr" ? "🇫🇷" : l === "en" ? "🇬🇧" : "🇹🇳"}
              </Text>
              <Text
                style={[
                  styles.langLabel,
                  {
                    color: localLang === l ? "#64B5F6" : theme.textSub,
                    fontWeight: localLang === l ? "bold" : "normal",
                  },
                ]}
              >
                {l === "fr" ? "Francais" : l === "en" ? "English" : "العربية"}
              </Text>
              {localLang === l && (
                <Text style={{ color: "#64B5F6", fontSize: 16 }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Infos */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.accent }]}>
          {t("informations")}
        </Text>
        {[
          ["Version", "1.0.0"],
          ["Systeme", "Hotel 360"],
          ["Firebase", "Connecte"],
          ["MQTT", "En attente"],
        ].map(([label, value], i) => (
          <View
            key={i}
            style={[
              styles.infoRow,
              {
                borderBottomColor: theme.border,
                flexDirection: isRTL ? "row-reverse" : "row",
              },
            ]}
          >
            <Text style={[styles.infoLabel, { color: theme.textSub }]}>
              {label}
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {value}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.btn,
          { backgroundColor: "#1565C0", marginHorizontal: 15 },
        ]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{t("sauvegarder")}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.btn,
          { backgroundColor: "#E53935", marginHorizontal: 15, marginTop: 10 },
        ]}
        onPress={handleReset}
      >
        <Text style={styles.btnText}>{t("reinitialiser")}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: { width: 70 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  section: {
    borderRadius: 16,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 15 },
  settingRow: {
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  settingIcon: { fontSize: 22 },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: "600" },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  seuilControls: { flexDirection: "row", alignItems: "center", gap: 10 },
  seuilBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1565C0",
    justifyContent: "center",
    alignItems: "center",
  },
  seuilBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  seuilValue: {
    fontSize: 16,
    fontWeight: "bold",
    minWidth: 30,
    textAlign: "center",
  },
  langRow: { gap: 8 },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 4,
  },
  langFlag: { fontSize: 24 },
  langLabel: { flex: 1, fontSize: 15 },
  infoRow: {
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13 },
  btn: {
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
