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
import { useApp } from "../context/AppContext";

const ZONES_DEFAULT = [
  {
    key: "gym",
    nom: "Gym",
    icone: "🏋️",
    horaires: "06:00 — 22:00",
    description: "Salle de sport equipee avec machines cardio et musculation.",
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
    description: "Piscine exterieure chauffee avec vue sur la Mediterranee.",
    capacite: 50,
  },
  {
    key: "restaurant",
    nom: "Restaurant",
    icone: "🍽️",
    horaires: "07:00 — 23:00",
    description: "Restaurant gastronomique tunisien et mediterraneen.",
    capacite: 80,
  },
  {
    key: "salle-reunion",
    nom: "Salle de Reunion",
    icone: "📊",
    horaires: "08:00 — 20:00",
    description: "Salle equipee pour evenements professionnels.",
    capacite: 30,
  },
  {
    key: "spa",
    nom: "Spa",
    icone: "💆",
    horaires: "09:00 — 21:00",
    description: "Espace bien-etre avec massages, hammam et jacuzzi.",
    capacite: 10,
  },
];

const HAS_CALENDRIER = ["gym", "piscine", "spa", "salle-reunion"];
const HAS_MENU = ["restaurant"];

const uploadToImgur = async (uri: string): Promise<string> => {
  const formData = new FormData();
  formData.append("image", {
    uri,
    type: "image/jpeg",
    name: "photo.jpg",
  } as any);
  const response = await fetch("https://api.imgur.com/3/image", {
    method: "POST",
    headers: { Authorization: "Client-ID 546c25a59c58ad7" },
    body: formData,
  });
  const data = await response.json();
  if (data.success) return data.data.link;
  throw new Error("Upload echoue");
};

const getNomKey = (nom) => {
  if (!nom) return "";
  const n = nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
  const map = {
    gym: "gym",
    "salle-de-sport": "gym",
    lobby: "lobby",
    piscine: "piscine",
    restaurant: "restaurant",
    "salle-de-reunion": "salle-reunion",
    "salle-reunion": "salle-reunion",
    spa: "spa",
  };
  return map[n] || n;
};

export default function ManageZonesScreen() {
  const router = useRouter();
  const { theme, lang } = useApp();
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState("infos");
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
  const [editCalendrier, setEditCalendrier] = useState([]);
  const [editMenu, setEditMenu] = useState([
    { repas: "Petit dejeuner", items: ["", "", "", ""] },
    { repas: "Dejeuner", items: ["", "", "", ""] },
    { repas: "Diner", items: ["", "", "", ""] },
  ]);

  const lbl = {
    titre:
      lang === "ar"
        ? "ادارة المناطق"
        : lang === "en"
          ? "Manage Areas"
          : "Gerer les Zones",
    retour: lang === "ar" ? "رجوع" : lang === "en" ? "Back" : "Retour",
    modifier: lang === "ar" ? "تعديل" : lang === "en" ? "Edit" : "Modifier",
    occuper: lang === "ar" ? "شغّل" : lang === "en" ? "Occupy" : "Occuper",
    liberer: lang === "ar" ? "اخلِ" : lang === "en" ? "Free" : "Liberer",
    occupe: lang === "ar" ? "مشغول" : lang === "en" ? "Occupied" : "Occupe",
    libre: lang === "ar" ? "حر" : lang === "en" ? "Free" : "Libre",
    capacite: lang === "ar" ? "السعة" : lang === "en" ? "Capacity" : "Capacite",
    presents:
      lang === "ar" ? "الحاضرون" : lang === "en" ? "Present" : "Presents",
    photos: lang === "ar" ? "الصور" : lang === "en" ? "Photos" : "Photos",
    cours: lang === "ar" ? "الدروس" : lang === "en" ? "Classes" : "Cours",
    menu: lang === "ar" ? "القائمة" : lang === "en" ? "Menu" : "Menu",
    infos: lang === "ar" ? "المعلومات" : lang === "en" ? "Info" : "Infos",
    calendrier:
      lang === "ar" ? "الجدول" : lang === "en" ? "Schedule" : "Calendrier",
    icone: lang === "ar" ? "الايقونة" : lang === "en" ? "Icon" : "Icone",
    nom: lang === "ar" ? "الاسم" : lang === "en" ? "Name" : "Nom",
    horaires: lang === "ar" ? "المواعيد" : lang === "en" ? "Hours" : "Horaires",
    description:
      lang === "ar" ? "الوصف" : lang === "en" ? "Description" : "Description",
    capaciteMax:
      lang === "ar"
        ? "السعة القصوى"
        : lang === "en"
          ? "Max Capacity"
          : "Capacite maximale",
    enregistrer:
      lang === "ar"
        ? "حفظ التعديلات"
        : lang === "en"
          ? "Save all changes"
          : "Enregistrer toutes les modifications",
    annuler: lang === "ar" ? "الغاء" : lang === "en" ? "Cancel" : "Annuler",
    ajouterCours:
      lang === "ar"
        ? "+ اضافة درس"
        : lang === "en"
          ? "+ Add class"
          : "+ Ajouter un cours",
    jour: lang === "ar" ? "اليوم" : lang === "en" ? "Day" : "Jour",
    heure: lang === "ar" ? "الوقت" : lang === "en" ? "Time" : "Heure",
    nomCours:
      lang === "ar"
        ? "اسم الدرس"
        : lang === "en"
          ? "Class name"
          : "Nom du cours",
    entraineur:
      lang === "ar" ? "المدرب" : lang === "en" ? "Trainer" : "Entraineur",
    placesTotal:
      lang === "ar"
        ? "المقاعد الكلية"
        : lang === "en"
          ? "Total seats"
          : "Places total",
    placesRestantes:
      lang === "ar"
        ? "المقاعد المتبقية"
        : lang === "en"
          ? "Remaining"
          : "Places restantes",
    choisirPhoto:
      lang === "ar"
        ? "اختر من المعرض"
        : lang === "en"
          ? "Choose from gallery"
          : "Choisir depuis la galerie",
    changer: lang === "ar" ? "تغيير" : lang === "en" ? "Change" : "Changer",
    supprimer: lang === "ar" ? "حذف" : lang === "en" ? "Delete" : "Supprimer",
    sauvegardeOk:
      lang === "ar"
        ? "تم الحفظ"
        : lang === "en"
          ? "Saved!"
          : "Zone mise a jour !",
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "zones"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const merged = ZONES_DEFAULT.map((def) => {
        const found = data.find(
          (z) =>
            z.nom === def.nom ||
            z.id === def.key ||
            getNomKey(z.nom) === def.key,
        );
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
    setEditCalendrier(
      zone.calendrier?.length > 0
        ? zone.calendrier
        : [
            {
              jour: "",
              heure: "",
              cours: "",
              entraineur: "",
              places: "10",
              restantes: "10",
            },
          ],
    );
    setEditMenu(
      zone.menuJour?.length > 0
        ? zone.menuJour.map((r) => ({
            repas: r.repas,
            items: [...r.items, "", "", ""].slice(0, 4),
          }))
        : [
            { repas: "Petit dejeuner", items: ["", "", "", ""] },
            { repas: "Dejeuner", items: ["", "", "", ""] },
            { repas: "Diner", items: ["", "", "", ""] },
          ],
    );
    setActiveEditTab("infos");
    setModalVisible(true);
  };

  const pickImage = async (index: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission refusee");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    if (!result.canceled) {
      const newPhotos = [...editPhotos];
      newPhotos[index] = { uri: result.assets[0].uri, uploaded: false };
      setEditPhotos(newPhotos);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...editPhotos];
    newPhotos[index] = { uri: "", uploaded: true };
    setEditPhotos(newPhotos);
  };

  const addCours = () =>
    setEditCalendrier([
      ...editCalendrier,
      {
        jour: "",
        heure: "",
        cours: "",
        entraineur: "",
        places: "10",
        restantes: "10",
      },
    ]);
  const removeCours = (i: number) =>
    setEditCalendrier(editCalendrier.filter((_, idx) => idx !== i));
  const updateCours = (i: number, field: string, value: string) => {
    const updated = [...editCalendrier];
    updated[i] = { ...updated[i], [field]: value };
    setEditCalendrier(updated);
  };
  const updateMenuItem = (ri: number, ii: number, value: string) => {
    const updated = [...editMenu];
    updated[ri].items[ii] = value;
    setEditMenu(updated);
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
          setUploadProgress(`Upload photo ${i + 1}/3...`);
          const url = await uploadToImgur(photo.uri);
          finalPhotos.push(url);
        } else {
          finalPhotos.push(photo.uri);
        }
      }
      setUploadProgress("Sauvegarde...");
      const zoneKey2 = getNomKey(editNom) || selectedZone.key;
      const dataToSave: any = {
        nom: editNom,
        horaires: editHoraires,
        description: editDescription,
        capacite: parseInt(editCapacite) || 0,
        icone: editIcone,
        photos: finalPhotos,
        occupee: selectedZone.occupee || false,
        personnes: selectedZone.personnes || 0,
      };
      if (HAS_CALENDRIER.includes(zoneKey2)) {
        dataToSave.calendrier = editCalendrier.map((c) => ({
          jour: c.jour || "",
          heure: c.heure || "",
          cours: c.cours || "",
          entraineur: c.entraineur || "",
          places: parseInt(String(c.places)) || 10,
          restantes: parseInt(String(c.restantes)) || 10,
        }));
      }
      if (HAS_MENU.includes(zoneKey2)) {
        dataToSave.menuJour = editMenu.map((r) => ({
          repas: r.repas,
          items: r.items.filter(Boolean),
        }));
      }
      await setDoc(doc(db, "zones", zoneKey), dataToSave, { merge: true });
      Alert.alert(lbl.sauvegardeOk);
      setModalVisible(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de sauvegarder.");
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
      Alert.alert("Erreur", "Impossible de modifier");
    }
  };

  const zoneKey2 = selectedZone
    ? getNomKey(selectedZone.nom) || selectedZone.key
    : "";
  const editTabs = [
    "infos",
    "photos",
    ...(HAS_CALENDRIER.includes(zoneKey2) ? ["calendrier"] : []),
    ...(HAS_MENU.includes(zoneKey2) ? ["menu"] : []),
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: theme.accent }]}>
            ← {lbl.retour}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {lbl.titre}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
        {zones.map((zone, i) => (
          <View
            key={i}
            style={[
              styles.zoneCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.zoneTop}>
              <Text style={styles.zoneIconBig}>{zone.icone}</Text>
              <View style={styles.zoneInfo}>
                <Text style={[styles.zoneName, { color: theme.text }]}>
                  {zone.nom}
                </Text>
                <Text style={[styles.zoneHoraires, { color: theme.textSub }]}>
                  🕐 {zone.horaires}
                </Text>
                <Text
                  style={[styles.zoneDesc, { color: theme.textSub }]}
                  numberOfLines={2}
                >
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
                  {zone.occupee ? "🔴 " + lbl.occupe : "🟢 " + lbl.libre}
                </Text>
              </View>
            </View>

            <View style={[styles.zoneStats, { backgroundColor: theme.bg }]}>
              {[
                [lbl.capacite, zone.capacite || "—", theme.text],
                [lbl.presents, zone.personnes || 0, "#F57C00"],
                [
                  lbl.photos,
                  (zone.photos?.filter(Boolean).length || 0) + "/3",
                  theme.text,
                ],
              ].map(([label, val, color], j) => (
                <View key={j} style={styles.zoneStat}>
                  <Text
                    style={[styles.zoneStatLabel, { color: theme.textSub }]}
                  >
                    {label}
                  </Text>
                  <Text style={[styles.zoneStatVal, { color }]}>{val}</Text>
                </View>
              ))}
              {HAS_CALENDRIER.includes(zone.key) && (
                <View style={styles.zoneStat}>
                  <Text
                    style={[styles.zoneStatLabel, { color: theme.textSub }]}
                  >
                    {lbl.cours}
                  </Text>
                  <Text style={[styles.zoneStatVal, { color: "#64B5F6" }]}>
                    {zone.calendrier?.length || 0}
                  </Text>
                </View>
              )}
              {HAS_MENU.includes(zone.key) && (
                <View style={styles.zoneStat}>
                  <Text
                    style={[styles.zoneStatLabel, { color: theme.textSub }]}
                  >
                    {lbl.menu}
                  </Text>
                  <Text style={[styles.zoneStatVal, { color: "#C9A96E" }]}>
                    {zone.menuJour ? "✅" : "❌"}
                  </Text>
                </View>
              )}
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
                style={[
                  styles.editBtn,
                  {
                    borderColor: theme.accent,
                    backgroundColor: theme.accent + "11",
                  },
                ]}
                onPress={() => openEdit(zone)}
              >
                <Text style={[styles.editBtnText, { color: theme.accent }]}>
                  {lbl.modifier}
                </Text>
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
                  {zone.occupee ? "🔓 " + lbl.liberer : "🔒 " + lbl.occuper}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL EDITION */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {selectedZone?.nom}
              </Text>
              <TouchableOpacity
                onPress={() => !uploading && setModalVisible(false)}
              >
                <Text style={[styles.modalClose, { color: theme.textSub }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.editTabBar, { backgroundColor: theme.bg }]}>
              {editTabs.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.editTab,
                    activeEditTab === tab && { backgroundColor: theme.card },
                  ]}
                  onPress={() => setActiveEditTab(tab)}
                >
                  <Text
                    style={[
                      styles.editTabText,
                      {
                        color:
                          activeEditTab === tab ? theme.accent : theme.textSub,
                      },
                      activeEditTab === tab && { fontWeight: "bold" },
                    ]}
                  >
                    {tab === "infos"
                      ? lbl.infos
                      : tab === "photos"
                        ? lbl.photos
                        : tab === "calendrier"
                          ? lbl.calendrier
                          : lbl.menu}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* INFOS */}
              {activeEditTab === "infos" && (
                <View>
                  {[
                    [lbl.icone, "editIcone", editIcone, setEditIcone, "Ex: 🏋️"],
                    [lbl.nom, "editNom", editNom, setEditNom, "Ex: Gym"],
                    [
                      lbl.horaires,
                      "editHoraires",
                      editHoraires,
                      setEditHoraires,
                      "Ex: 06:00 — 22:00",
                    ],
                    [
                      lbl.capaciteMax,
                      "editCapacite",
                      editCapacite,
                      setEditCapacite,
                      "Ex: 30",
                      "numeric",
                    ],
                  ].map(([label, _, value, setter, placeholder, kbType], i) => (
                    <View key={i}>
                      <Text
                        style={[styles.fieldLabel, { color: theme.accent }]}
                      >
                        {label}
                      </Text>
                      <TextInput
                        style={[
                          styles.fieldInput,
                          {
                            backgroundColor: theme.bg,
                            color: theme.text,
                            borderColor: theme.border,
                          },
                        ]}
                        value={value as string}
                        onChangeText={setter as any}
                        placeholder={placeholder as string}
                        placeholderTextColor={theme.textSub}
                        keyboardType={(kbType as any) || "default"}
                      />
                    </View>
                  ))}
                  <Text style={[styles.fieldLabel, { color: theme.accent }]}>
                    {lbl.description}
                  </Text>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      styles.fieldTextarea,
                      {
                        backgroundColor: theme.bg,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder="Description..."
                    placeholderTextColor={theme.textSub}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}

              {/* PHOTOS */}
              {activeEditTab === "photos" && (
                <View>
                  {[0, 1, 2].map((index) => (
                    <View
                      key={index}
                      style={[
                        styles.photoBlock,
                        {
                          backgroundColor: theme.bg,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.photoNum, { color: theme.accent }]}>
                        Photo {index + 1}
                      </Text>
                      {editPhotos[index].uri ? (
                        <View>
                          <Image
                            source={{ uri: editPhotos[index].uri }}
                            style={styles.photoPreview}
                          />
                          <View style={styles.photoActions}>
                            <TouchableOpacity
                              style={[
                                styles.photoChangeBtn,
                                { borderColor: theme.accent },
                              ]}
                              onPress={() => pickImage(index)}
                            >
                              <Text
                                style={[
                                  styles.photoChangeBtnText,
                                  { color: theme.accent },
                                ]}
                              >
                                {lbl.changer}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.photoDeleteBtn}
                              onPress={() => removePhoto(index)}
                            >
                              <Text style={styles.photoDeleteBtnText}>
                                {lbl.supprimer}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.pickBtn,
                            { borderColor: theme.border },
                          ]}
                          onPress={() => pickImage(index)}
                        >
                          <Text style={styles.pickBtnIcon}>📷</Text>
                          <Text
                            style={[
                              styles.pickBtnText,
                              { color: theme.textSub },
                            ]}
                          >
                            {lbl.choisirPhoto}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* CALENDRIER */}
              {activeEditTab === "calendrier" && (
                <View>
                  {editCalendrier.map((cours, i) => (
                    <View
                      key={i}
                      style={[
                        styles.coursEditCard,
                        {
                          backgroundColor: theme.bg,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <View style={styles.coursEditHeader}>
                        <Text
                          style={[styles.coursEditNum, { color: theme.accent }]}
                        >
                          Cours {i + 1}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeCours(i)}
                          style={styles.removeBtn}
                        >
                          <Text style={styles.removeBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.coursEditRow}>
                        <View style={styles.coursEditHalf}>
                          <Text
                            style={[styles.fieldLabel, { color: theme.accent }]}
                          >
                            {lbl.jour}
                          </Text>
                          <TextInput
                            style={[
                              styles.fieldInput,
                              {
                                backgroundColor: theme.card,
                                color: theme.text,
                                borderColor: theme.border,
                              },
                            ]}
                            value={cours.jour}
                            onChangeText={(v) => updateCours(i, "jour", v)}
                            placeholder="Lun"
                            placeholderTextColor={theme.textSub}
                          />
                        </View>
                        <View style={styles.coursEditHalf}>
                          <Text
                            style={[styles.fieldLabel, { color: theme.accent }]}
                          >
                            {lbl.heure}
                          </Text>
                          <TextInput
                            style={[
                              styles.fieldInput,
                              {
                                backgroundColor: theme.card,
                                color: theme.text,
                                borderColor: theme.border,
                              },
                            ]}
                            value={cours.heure}
                            onChangeText={(v) => updateCours(i, "heure", v)}
                            placeholder="08:00"
                            placeholderTextColor={theme.textSub}
                          />
                        </View>
                      </View>
                      <Text
                        style={[styles.fieldLabel, { color: theme.accent }]}
                      >
                        {lbl.nomCours}
                      </Text>
                      <TextInput
                        style={[
                          styles.fieldInput,
                          {
                            backgroundColor: theme.card,
                            color: theme.text,
                            borderColor: theme.border,
                          },
                        ]}
                        value={cours.cours}
                        onChangeText={(v) => updateCours(i, "cours", v)}
                        placeholder="Cardio..."
                        placeholderTextColor={theme.textSub}
                      />
                      <Text
                        style={[styles.fieldLabel, { color: theme.accent }]}
                      >
                        {lbl.entraineur}
                      </Text>
                      <TextInput
                        style={[
                          styles.fieldInput,
                          {
                            backgroundColor: theme.card,
                            color: theme.text,
                            borderColor: theme.border,
                          },
                        ]}
                        value={cours.entraineur}
                        onChangeText={(v) => updateCours(i, "entraineur", v)}
                        placeholder="Ahmed B."
                        placeholderTextColor={theme.textSub}
                      />
                      <View style={styles.coursEditRow}>
                        <View style={styles.coursEditHalf}>
                          <Text
                            style={[styles.fieldLabel, { color: theme.accent }]}
                          >
                            {lbl.placesTotal}
                          </Text>
                          <TextInput
                            style={[
                              styles.fieldInput,
                              {
                                backgroundColor: theme.card,
                                color: theme.text,
                                borderColor: theme.border,
                              },
                            ]}
                            value={String(cours.places)}
                            onChangeText={(v) => updateCours(i, "places", v)}
                            keyboardType="numeric"
                            placeholder="10"
                            placeholderTextColor={theme.textSub}
                          />
                        </View>
                        <View style={styles.coursEditHalf}>
                          <Text
                            style={[styles.fieldLabel, { color: theme.accent }]}
                          >
                            {lbl.placesRestantes}
                          </Text>
                          <TextInput
                            style={[
                              styles.fieldInput,
                              {
                                backgroundColor: theme.card,
                                color: theme.text,
                                borderColor: theme.border,
                              },
                            ]}
                            value={String(cours.restantes)}
                            onChangeText={(v) => updateCours(i, "restantes", v)}
                            keyboardType="numeric"
                            placeholder="10"
                            placeholderTextColor={theme.textSub}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={[
                      styles.addBtn,
                      { borderColor: "#2E7D32", backgroundColor: "#2E7D3222" },
                    ]}
                    onPress={addCours}
                  >
                    <Text style={[styles.addBtnText, { color: "#2E7D32" }]}>
                      {lbl.ajouterCours}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* MENU */}
              {activeEditTab === "menu" && (
                <View>
                  {editMenu.map((repas, ri) => (
                    <View
                      key={ri}
                      style={[
                        styles.repasEditCard,
                        {
                          backgroundColor: theme.bg,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Text style={styles.repasEditTitle}>{repas.repas}</Text>
                      {repas.items.map((item, ii) => (
                        <View key={ii} style={styles.menuItemRow}>
                          <Text
                            style={[
                              styles.menuItemNum,
                              { color: theme.textSub },
                            ]}
                          >
                            {ii + 1}.
                          </Text>
                          <TextInput
                            style={[
                              styles.fieldInput,
                              {
                                flex: 1,
                                backgroundColor: theme.card,
                                color: theme.text,
                                borderColor: theme.border,
                              },
                            ]}
                            value={item}
                            onChangeText={(v) => updateMenuItem(ri, ii, v)}
                            placeholder={`Plat ${ii + 1}...`}
                            placeholderTextColor={theme.textSub}
                          />
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {uploading ? (
                <View
                  style={[styles.uploadingBox, { backgroundColor: theme.bg }]}
                >
                  <ActivityIndicator color={theme.accent} size="large" />
                  <Text style={[styles.uploadingText, { color: theme.accent }]}>
                    {uploadProgress}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: "#1565C0" }]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveBtnText}>{lbl.enregistrer}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: "#E5393522" }]}
                onPress={() => !uploading && setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>{lbl.annuler}</Text>
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
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backText: { fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  list: { flex: 1, paddingHorizontal: 15 },
  zoneCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  zoneTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  zoneIconBig: { fontSize: 36 },
  zoneInfo: { flex: 1 },
  zoneName: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  zoneHoraires: { fontSize: 11, marginBottom: 4 },
  zoneDesc: { fontSize: 12, lineHeight: 18 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "bold" },
  zoneStats: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  zoneStat: { flex: 1, alignItems: "center" },
  zoneStatLabel: { fontSize: 10, marginBottom: 2 },
  zoneStatVal: { fontSize: 13, fontWeight: "bold" },
  photosRow: { marginBottom: 10 },
  photoThumb: { width: 80, height: 60, borderRadius: 8, marginRight: 8 },
  zoneActions: { flexDirection: "row", gap: 10 },
  editBtn: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  editBtnText: { fontSize: 13, fontWeight: "bold" },
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "95%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: "bold" },
  modalClose: { fontSize: 20, padding: 4 },
  editTabBar: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  editTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  editTabText: { fontSize: 11 },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 12,
  },
  fieldInput: { borderRadius: 10, padding: 12, fontSize: 13, borderWidth: 1 },
  fieldTextarea: { height: 80, textAlignVertical: "top" },
  photoBlock: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  photoNum: { fontSize: 12, fontWeight: "bold", marginBottom: 10 },
  photoPreview: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
  },
  photoActions: { flexDirection: "row", gap: 8 },
  photoChangeBtn: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  photoChangeBtnText: { fontSize: 12, fontWeight: "bold" },
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
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  pickBtnIcon: { fontSize: 32 },
  pickBtnText: { fontSize: 13 },
  coursEditCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  coursEditHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  coursEditNum: { fontSize: 13, fontWeight: "bold" },
  removeBtn: { backgroundColor: "#E5393522", borderRadius: 8, padding: 6 },
  removeBtnText: { fontSize: 14 },
  coursEditRow: { flexDirection: "row", gap: 10 },
  coursEditHalf: { flex: 1 },
  addBtn: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    marginTop: 4,
  },
  addBtnText: { fontSize: 14, fontWeight: "bold" },
  repasEditCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  repasEditTitle: {
    color: "#C9A96E",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
  },
  menuItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  menuItemNum: { fontSize: 13, width: 20 },
  uploadingBox: {
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
    gap: 10,
  },
  uploadingText: { fontSize: 14, fontWeight: "bold" },
  saveBtn: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  cancelBtn: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  cancelBtnText: { color: "#E53935", fontSize: 14, fontWeight: "bold" },
});
