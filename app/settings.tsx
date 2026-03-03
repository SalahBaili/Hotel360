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

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Notifications
  const [notifAlertes, setNotifAlertes] = useState(true);
  const [notifTemperature, setNotifTemperature] = useState(true);
  const [notifPresence, setNotifPresence] = useState(false);
  const [notifSon, setNotifSon] = useState(true);

  // Seuils
  const [seuilTemp, setSeuilTemp] = useState(27);
  const [seuilHumidite, setSeuilHumidite] = useState(75);

  // Affichage
  const [modeNuit, setModeNuit] = useState(true);
  const [actualisation, setActualisation] = useState(true);

  // 🔥 Charger les paramètres sauvegardés
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem("hotel360_settings");
        if (saved) {
          const settings = JSON.parse(saved);
          setNotifAlertes(settings.notifAlertes ?? true);
          setNotifTemperature(settings.notifTemperature ?? true);
          setNotifPresence(settings.notifPresence ?? false);
          setNotifSon(settings.notifSon ?? true);
          setSeuilTemp(settings.seuilTemp ?? 27);
          setSeuilHumidite(settings.seuilHumidite ?? 75);
          setModeNuit(settings.modeNuit ?? true);
          setActualisation(settings.actualisation ?? true);
        }
      } catch (error) {
        console.log("Erreur chargement:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // 🔥 Sauvegarder les paramètres
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
        modeNuit,
        actualisation,
      };
      await AsyncStorage.setItem("hotel360_settings", JSON.stringify(settings));

      // Supprimer alertes temperature et humidite pour recalculer
      const q1 = query(
        collection(db, "alertes"),
        where("type", "==", "temperature"),
      );
      const q2 = query(
        collection(db, "alertes"),
        where("type", "==", "humidite"),
      );
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const deleteAll = [...snap1.docs, ...snap2.docs].map((d) =>
        deleteDoc(doc(db, "alertes", d.id)),
      );
      await Promise.all(deleteAll);

      Alert.alert(
        "✅ Sauvegardé",
        "Paramètres enregistrés et alertes recalculées !",
      );
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "🔄 Réinitialiser",
      "Voulez-vous réinitialiser tous les paramètres ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Réinitialiser",
          style: "destructive",
          onPress: async () => {
            setNotifAlertes(true);
            setNotifTemperature(true);
            setNotifPresence(false);
            setNotifSon(true);
            setSeuilTemp(27);
            setSeuilHumidite(75);
            setModeNuit(true);
            setActualisation(true);
            await AsyncStorage.removeItem("hotel360_settings");
            Alert.alert("✅ Réinitialisé !");
          },
        },
      ],
    );
  };

  const SettingRow = ({ icon, title, subtitle, value, onValueChange }) => (
    <View style={styles.settingRow}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#2A3F5F", true: "#1565C0" }}
        thumbColor={value ? "#64B5F6" : "#888"}
      />
    </View>
  );

  const SeuilRow = ({ icon, title, value, onMoins, onPlus, unite }) => (
    <View style={styles.settingRow}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>
          Seuil actuel : {value}
          {unite}
        </Text>
      </View>
      <View style={styles.seuilControls}>
        <TouchableOpacity style={styles.seuilBtn} onPress={onMoins}>
          <Text style={styles.seuilBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.seuilValue}>{value}</Text>
        <TouchableOpacity style={styles.seuilBtn} onPress={onPlus}>
          <Text style={styles.seuilBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#64B5F6" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ Paramètres</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Notifications</Text>
        <SettingRow
          icon="🚨"
          title="Alertes critiques"
          subtitle="Recevoir les alertes urgentes"
          value={notifAlertes}
          onValueChange={setNotifAlertes}
        />
        <SettingRow
          icon="🌡️"
          title="Température"
          subtitle="Alertes de température anormale"
          value={notifTemperature}
          onValueChange={setNotifTemperature}
        />
        <SettingRow
          icon="👤"
          title="Présence"
          subtitle="Détection de mouvement"
          value={notifPresence}
          onValueChange={setNotifPresence}
        />
        <SettingRow
          icon="🔊"
          title="Son"
          subtitle="Activer le son des notifications"
          value={notifSon}
          onValueChange={setNotifSon}
        />
      </View>

      {/* Seuils */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Seuils d'alerte</Text>
        <SeuilRow
          icon="🌡️"
          title="Température max"
          value={seuilTemp}
          unite="°C"
          onMoins={() => setSeuilTemp((v) => Math.max(20, v - 1))}
          onPlus={() => setSeuilTemp((v) => Math.min(40, v + 1))}
        />
        <SeuilRow
          icon="💧"
          title="Humidité max"
          value={seuilHumidite}
          unite="%"
          onMoins={() => setSeuilHumidite((v) => Math.max(50, v - 5))}
          onPlus={() => setSeuilHumidite((v) => Math.min(100, v + 5))}
        />
      </View>

      {/* Affichage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎨 Affichage</Text>
        <SettingRow
          icon="🌙"
          title="Mode nuit"
          subtitle="Thème sombre activé"
          value={modeNuit}
          onValueChange={setModeNuit}
        />
        <SettingRow
          icon="🔄"
          title="Actualisation auto"
          subtitle="Mise à jour en temps réel"
          value={actualisation}
          onValueChange={setActualisation}
        />
      </View>

      {/* Infos app */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ Informations</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📱 Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🏨 Système</Text>
          <Text style={styles.infoValue}>Hotel 360°</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>☁️ Firebase</Text>
          <Text style={[styles.infoValue, { color: "#2E7D32" }]}>
            ✅ Connecté
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📡 MQTT</Text>
          <Text style={[styles.infoValue, { color: "#F57C00" }]}>
            ⏳ En attente
          </Text>
        </View>
      </View>

      {/* Boutons */}
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
          <Text style={styles.btnText}>💾 Sauvegarder</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.btn,
          { backgroundColor: "#E53935", marginHorizontal: 15, marginTop: 10 },
        ]}
        onPress={handleReset}
      >
        <Text style={styles.btnText}>🔄 Réinitialiser</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628" },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#0A1628",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: "#64B5F6", marginTop: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: { width: 70 },
  backText: { color: "#64B5F6", fontSize: 16 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  section: {
    backgroundColor: "#1E2D45",
    borderRadius: 16,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#64B5F6",
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A3F5F",
  },
  settingIcon: { fontSize: 22, marginRight: 12 },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 14, color: "#fff", fontWeight: "600" },
  settingSubtitle: { fontSize: 12, color: "#888", marginTop: 2 },
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    minWidth: 30,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2A3F5F",
  },
  infoLabel: { color: "#888", fontSize: 13 },
  infoValue: { color: "#fff", fontSize: 13 },
  btn: {
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
