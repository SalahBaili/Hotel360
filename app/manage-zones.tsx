import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../config/firebase";

const ZONES_DEFAULT = [
  {
    key: "gym",
    nom: "Gym",
    icone: "🏋️",
    horaires: "06:00 — 22:00",
    description: "Salle de sport équipée avec machines cardio et musculation.",
    capacite: 30,
  },
  {
    key: "lobby",
    nom: "Lobby",
    icone: "🏨",
    horaires: "24h/24",
    description: "Espace d'accueil luxueux avec service de conciergerie.",
    capacite: 100,
  },
  {
    key: "piscine",
    nom: "Piscine",
    icone: "🏊",
    horaires: "08:00 — 20:00",
    description: "Piscine extérieure chauffée avec vue sur la Méditerranée.",
    capacite: 50,
  },
  {
    key: "restaurant",
    nom: "Restaurant",
    icone: "🍽️",
    horaires: "07:00 — 23:00",
    description: "Restaurant gastronomique tunisien et méditerranéen.",
    capacite: 80,
  },
  {
    key: "salle-reunion",
    nom: "Salle de Réunion",
    icone: "📊",
    horaires: "08:00 — 20:00",
    description: "Salle équipée pour événements professionnels.",
    capacite: 30,
  },
  {
    key: "spa",
    nom: "Spa",
    icone: "💆",
    horaires: "09:00 — 21:00",
    description: "Espace bien-être avec massages, hammam et jacuzzi.",
    capacite: 10,
  },
];

// ── Upload vers Imgur (100% gratuit) ──
const uploadToImgur = async (uri: string): Promise<string> => {
  const formData = new FormData();
  formData.append("image", {
    uri: uri,
    type: "image/jpeg",
    name: "photo.jpg",
  } as any);

  const response = await fetch("https://api.imgur.com/3/image", {
    method: "POST",
    headers: {
      Authorization: "Client-ID 546c25a59c58ad7",
    },
    body: formData,
  });

  const data = await response.json();
  if (data.success) {
    return data.data.link;
  }
  throw new Error("Upload échoué");
};

export default function ManageZonesScreen() {
  const router = useRouter();
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const [editNom, setEditNom] = useState("");
  const [editHoraires, setEditHoraires] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCapacite, setEditCapacite] = useState("");
  const [editIcone, setEditIcone] = useState("");
  const [editPhotos, setEditPhotos] = useState([
    { uri: "", uploaded: true },
    { uri: "", uploaded: true },
    { uri: "", uploaded: true },
  ]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "zones"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const merged = ZONES_DEFAULT.map((def) => {
        const found = data.find((z) => z.nom === def.nom || z.id === def.key);
        return found ? { ...def, ...found } : def;
      });
      setZones(merged);
    });
    return unsubscribe;
  }, []);

  const openEdit = (zone) => {
    setSelectedZone(zone);
    setEditNom(zone.nom || "");
    setEditHoraires(zone.horaires || "");
    setEditDescription(zone.description || "");
    setEditCapacite(String(zone.capacite || ""));
    setEditIcone(zone.icone || "");
    setEditPhotos([
      { uri: zone.photos?.[0] || "", uploaded: true },
      { uri: zone.photos?.[1] || "", uploaded: true },
      { uri: zone.photos?.[2] || "", uploaded: true },
    ]);
    setModalVisible(true);
  };

  const pickImage = async (index: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission refusée",
        "Autorisez l'accès à la galerie dans les paramètres.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const newPhotos = [...editPhotos];
      newPhotos[index] = { uri, uploaded: false };
      setEditPhotos(newPhotos);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...editPhotos];
    newPhotos[index] = { uri: "", uploaded: true };
    setEditPhotos(newPhotos);
  };

  const handleSave = async () => {
    if (!selectedZone) return;
    setUploading(true);
    try {
      const zoneKey = selectedZone.id || selectedZone.key;
      const finalPhotos: string[] = [];

      for (let i = 0; i < editPhotos.length; i++) {
        const photo = editPhotos[i];
        if (!photo.uri) continue;

        if (!photo.uploaded) {
          setUploadProgress(`📤 Upload photo ${i + 1}/3...`);
          const url = await uploadToImgur(photo.uri);
          finalPhotos.push(url);
        } else {
          finalPhotos.push(photo.uri);
        }
      }

      setUploadProgress("💾 Sauvegarde dans Firebase...");

      await setDoc(
        doc(db, "zones", zoneKey),
        {
          nom: editNom,
          horaires: editHoraires,
          description: editDescription,
          capacite: parseInt(editCapacite) || 0,
          icone: editIcone,
          photos: finalPhotos,
          occupee: selectedZone.occupee || false,
          personnes: selectedZone.personnes || 0,
        },
        { merge: true },
      );

      Alert.alert(
        "✅ Zone mise à jour !",
        `${editNom} et ses photos sont sauvegardées.`,
      );
      setModalVisible(false);
    } catch (e) {
      console.log(e);
      Alert.alert(
        "Erreur",
        "Impossible de sauvegarder. Vérifiez votre connexion internet.",
      );
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const handleToggleOccupation = async (zone) => {
    try {
      const zoneId = zone.id || zone.key;
      await setDoc(
        doc(db, "zones", zoneId),
        {
          nom: zone.nom,
          icone: zone.icone,
          occupee: !zone.occupee,
          personnes: !zone.occupee ? 1 : 0,
        },
        { merge: true },
      );
    } catch (e) {
      Alert.alert("Erreur", "Impossible de modifier l'occupation");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏨 Gérer les Zones</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
        <Text style={styles.hint}>
          Appuyez sur ✏️ Modifier pour éditer une zone
        </Text>

        {zones.map((zone, i) => (
          <View key={i} style={styles.zoneCard}>
            <View style={styles.zoneTop}>
              <Text style={styles.zoneIconBig}>{zone.icone}</Text>
              <View style={styles.zoneInfo}>
                <Text style={styles.zoneName}>{zone.nom}</Text>
                <Text style={styles.zoneHoraires}>🕐 {zone.horaires}</Text>
                <Text style={styles.zoneDesc} numberOfLines={2}>
                  {zone.description}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: zone.occupee ? "#E5393522" : "#2E7D3222" },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: zone.occupee ? "#E53935" : "#2E7D32" },
                  ]}
                >
                  {zone.occupee ? "🔴 Occupé" : "🟢 Libre"}
                </Text>
              </View>
            </View>

            <View style={styles.zoneStats}>
              <View style={styles.zoneStat}>
                <Text style={styles.zoneStatLabel}>Capacité</Text>
                <Text style={styles.zoneStatVal}>{zone.capacite || "—"}</Text>
              </View>
              <View style={styles.zoneStat}>
                <Text style={styles.zoneStatLabel}>Présents</Text>
                <Text style={[styles.zoneStatVal, { color: "#F57C00" }]}>
                  {zone.personnes || 0}
                </Text>
              </View>
              <View style={styles.zoneStat}>
                <Text style={styles.zoneStatLabel}>Photos</Text>
                <Text style={styles.zoneStatVal}>
                  {zone.photos?.filter(Boolean).length || 0}/3
                </Text>
              </View>
            </View>

            {zone.photos?.filter(Boolean).length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.photosRow}
              >
                {zone.photos.filter(Boolean).map((p, j) => (
                  <Image
                    key={j}
                    source={{ uri: p }}
                    style={styles.photoThumb}
                  />
                ))}
              </ScrollView>
            )}

            <View style={styles.zoneActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => openEdit(zone)}
              >
                <Text style={styles.editBtnText}>✏️ Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: zone.occupee ? "#E5393511" : "#2E7D3211",
                    borderColor: zone.occupee ? "#E53935" : "#2E7D32",
                  },
                ]}
                onPress={() => handleToggleOccupation(zone)}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    { color: zone.occupee ? "#E53935" : "#2E7D32" },
                  ]}
                >
                  {zone.occupee ? "🔓 Libérer" : "🔒 Occuper"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── MODAL ÉDITION ── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ {selectedZone?.nom}</Text>
              <TouchableOpacity
                onPress={() => !uploading && setModalVisible(false)}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Icône</Text>
              <TextInput
                style={styles.fieldInput}
                value={editIcone}
                onChangeText={setEditIcone}
                placeholder="Ex: 🏋️"
                placeholderTextColor="#555"
              />

              <Text style={styles.fieldLabel}>Nom de la zone</Text>
              <TextInput
                style={styles.fieldInput}
                value={editNom}
                onChangeText={setEditNom}
                placeholder="Ex: Gym"
                placeholderTextColor="#555"
              />

              <Text style={styles.fieldLabel}>Horaires</Text>
              <TextInput
                style={styles.fieldInput}
                value={editHoraires}
                onChangeText={setEditHoraires}
                placeholder="Ex: 06:00 — 22:00"
                placeholderTextColor="#555"
              />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldTextarea]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Description de la zone..."
                placeholderTextColor="#555"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.fieldLabel}>Capacité maximale</Text>
              <TextInput
                style={styles.fieldInput}
                value={editCapacite}
                onChangeText={setEditCapacite}
                placeholder="Ex: 30"
                placeholderTextColor="#555"
                keyboardType="numeric"
              />

              {/* ── PHOTOS ── */}
              <Text style={styles.fieldLabel}>
                📸 Photos (depuis votre téléphone)
              </Text>
              <Text style={styles.uploadHint}>
                Les photos seront uploadées automatiquement ☁️
              </Text>

              {[0, 1, 2].map((index) => (
                <View key={index} style={styles.photoBlock}>
                  <View style={styles.photoBlockHeader}>
                    <Text style={styles.photoNum}>Photo {index + 1}</Text>
                    {!editPhotos[index].uploaded && editPhotos[index].uri && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>✨ NOUVELLE</Text>
                      </View>
                    )}
                    {editPhotos[index].uploaded && editPhotos[index].uri && (
                      <View style={styles.savedBadge}>
                        <Text style={styles.savedBadgeText}>
                          ☁️ Sauvegardée
                        </Text>
                      </View>
                    )}
                  </View>

                  {editPhotos[index].uri ? (
                    <View>
                      <Image
                        source={{ uri: editPhotos[index].uri }}
                        style={styles.photoPreview}
                      />
                      <View style={styles.photoActions}>
                        <TouchableOpacity
                          style={styles.photoChangeBtn}
                          onPress={() => pickImage(index)}
                        >
                          <Text style={styles.photoChangeBtnText}>
                            🔄 Changer
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.photoDeleteBtn}
                          onPress={() => removePhoto(index)}
                        >
                          <Text style={styles.photoDeleteBtnText}>
                            🗑️ Supprimer
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.pickBtn}
                      onPress={() => pickImage(index)}
                    >
                      <Text style={styles.pickBtnIcon}>📷</Text>
                      <Text style={styles.pickBtnText}>
                        Choisir depuis la galerie
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {uploading ? (
                <View style={styles.uploadingBox}>
                  <ActivityIndicator color="#64B5F6" size="large" />
                  <Text style={styles.uploadingText}>{uploadProgress}</Text>
                  <Text style={styles.uploadingSubText}>
                    Ne fermez pas l'application...
                  </Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>
                    💾 Enregistrer les modifications
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.cancelBtn, uploading && { opacity: 0.4 }]}
                onPress={() => !uploading && setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
  backText: { color: "#64B5F6", fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  list: { flex: 1, paddingHorizontal: 15 },
  hint: { fontSize: 12, color: "#888", marginBottom: 12, textAlign: "center" },
  zoneCard: {
    backgroundColor: "#1E2D45",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  zoneTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  zoneIconBig: { fontSize: 36 },
  zoneInfo: { flex: 1 },
  zoneName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  zoneHoraires: { fontSize: 11, color: "#888", marginBottom: 4 },
  zoneDesc: { fontSize: 12, color: "#aaa", lineHeight: 18 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "bold" },
  zoneStats: {
    flexDirection: "row",
    backgroundColor: "#0A1628",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  zoneStat: { flex: 1, alignItems: "center" },
  zoneStatLabel: { fontSize: 10, color: "#888", marginBottom: 2 },
  zoneStatVal: { fontSize: 14, fontWeight: "bold", color: "#fff" },
  photosRow: { marginBottom: 10 },
  photoThumb: { width: 80, height: 60, borderRadius: 8, marginRight: 8 },
  zoneActions: { flexDirection: "row", gap: 10 },
  editBtn: {
    flex: 1,
    backgroundColor: "#1565C022",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1565C0",
  },
  editBtnText: { color: "#64B5F6", fontSize: 13, fontWeight: "bold" },
  toggleBtn: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  toggleBtnText: { fontSize: 13, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#1E2D45",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: "bold", color: "#fff" },
  modalClose: { fontSize: 20, color: "#888", padding: 4 },
  fieldLabel: {
    fontSize: 11,
    color: "#64B5F6",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 12,
  },
  fieldInput: {
    backgroundColor: "#0A1628",
    borderRadius: 10,
    padding: 12,
    color: "#fff",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  fieldTextarea: { height: 80, textAlignVertical: "top" },
  uploadHint: {
    fontSize: 11,
    color: "#888",
    marginBottom: 10,
    fontStyle: "italic",
  },
  photoBlock: {
    backgroundColor: "#0A1628",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  photoBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  photoNum: { fontSize: 12, color: "#64B5F6", fontWeight: "bold" },
  newBadge: {
    backgroundColor: "#2E7D3222",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#2E7D32",
  },
  newBadgeText: { color: "#2E7D32", fontSize: 9, fontWeight: "bold" },
  savedBadge: {
    backgroundColor: "#1565C022",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#64B5F6",
  },
  savedBadgeText: { color: "#64B5F6", fontSize: 9, fontWeight: "bold" },
  photoPreview: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    marginBottom: 10,
  },
  photoActions: { flexDirection: "row", gap: 8 },
  photoChangeBtn: {
    flex: 1,
    backgroundColor: "#1565C022",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1565C0",
  },
  photoChangeBtnText: { color: "#64B5F6", fontSize: 12, fontWeight: "bold" },
  photoDeleteBtn: {
    flex: 1,
    backgroundColor: "#E5393522",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E53935",
  },
  photoDeleteBtnText: { color: "#E53935", fontSize: 12, fontWeight: "bold" },
  pickBtn: {
    borderWidth: 2,
    borderColor: "#2A3F5F",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  pickBtnIcon: { fontSize: 32 },
  pickBtnText: { color: "#888", fontSize: 13 },
  uploadingBox: {
    backgroundColor: "#0A1628",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
    gap: 10,
  },
  uploadingText: { color: "#64B5F6", fontSize: 14, fontWeight: "bold" },
  uploadingSubText: { color: "#888", fontSize: 12 },
  saveBtn: {
    backgroundColor: "#1565C0",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  cancelBtn: {
    backgroundColor: "#E5393522",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  cancelBtnText: { color: "#E53935", fontSize: 14, fontWeight: "bold" },
});
