import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../config/firebase";
import { useApp } from "../context/AppContext";

const ZONES_DATA = {
  gym: {
    nom: "Salle de Sport",
    icone: "🏋️",
    couleur: "#E53935",
    description:
      "Salle de sport entierement equipee avec machines cardio, musculation et espace fitness.",
    horaires: "06:00 — 22:00",
    photos: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80",
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80",
    ],
    calendrier: [
      {
        jour: "Lun",
        heure: "08:00",
        cours: "Cardio Intense",
        entraineur: "Ahmed B.",
        places: 12,
        restantes: 4,
      },
      {
        jour: "Mar",
        heure: "09:00",
        cours: "Danse Orientale",
        entraineur: "Leila K.",
        places: 15,
        restantes: 3,
      },
    ],
    equipements: [
      "Tapis de course x4",
      "Velos x6",
      "Halteres",
      "Machines musculation",
      "Espace yoga",
    ],
  },
  lobby: {
    nom: "Lobby & Reception",
    icone: "🏨",
    couleur: "#1565C0",
    description:
      "Espace d'accueil luxueux avec service de conciergerie, espace lounge et Wi-Fi haut debit.",
    horaires: "24h/24 — 7j/7",
    photos: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80",
    ],
    calendrier: [],
    equipements: [
      "Bar lounge",
      "Espace lecture",
      "Business corner",
      "Salon VIP",
    ],
  },
  piscine: {
    nom: "Piscine",
    icone: "🏊",
    couleur: "#0288D1",
    description: "Piscine exterieure chauffee avec vue sur la Mediterranee.",
    horaires: "08:00 — 20:00",
    photos: [
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80",
    ],
    calendrier: [
      {
        jour: "Tous",
        heure: "09:00",
        cours: "Aquagym",
        entraineur: "Karim T.",
        places: 15,
        restantes: 6,
      },
    ],
    equipements: ["Piscine 25m", "Eau chauffee", "Bar piscine", "Transats"],
  },
  restaurant: {
    nom: "Restaurant",
    icone: "🍽️",
    couleur: "#C9A96E",
    description:
      "Restaurant gastronomique proposant une cuisine tunisienne et mediterraneenne raffinee.",
    horaires: "07:00 — 23:00",
    photos: [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
    ],
    calendrier: [],
    menuJour: [
      {
        repas: "Petit dejeuner",
        items: ["Buffet continental", "Oeufs", "Fruits frais", "Patisseries"],
      },
      {
        repas: "Dejeuner",
        items: ["Salade", "Couscous royal", "Poisson grille", "Dessert"],
      },
      {
        repas: "Diner",
        items: ["Entree froide", "Tajine", "Pates", "Creme brulee"],
      },
    ],
    equipements: [
      "Cave a vins",
      "Menu vegetarien",
      "Chef etoile",
      "Ambiance musicale",
    ],
  },
  "salle-reunion": {
    nom: "Salle de Reunion",
    icone: "📊",
    couleur: "#5C6BC0",
    description: "Salle de reunion equipee pour vos evenements professionnels.",
    horaires: "08:00 — 20:00",
    photos: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
    ],
    calendrier: [
      {
        jour: "Lun",
        heure: "09:00",
        cours: "Reunion direction",
        entraineur: "Reserve",
        places: 30,
        restantes: 20,
      },
    ],
    equipements: [
      "Projecteur HD",
      "Visioconference",
      "Wi-Fi fibre",
      "Service cafe",
    ],
  },
  spa: {
    nom: "Spa & Bien-etre",
    icone: "💆",
    couleur: "#7B1FA2",
    description:
      "Espace spa premium proposant massages, soins du visage, hammam et jacuzzi.",
    horaires: "09:00 — 21:00",
    photos: [
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80",
    ],
    calendrier: [
      {
        jour: "Tous",
        heure: "10:00",
        cours: "Massage relaxant",
        entraineur: "Nadia S.",
        places: 4,
        restantes: 2,
      },
    ],
    equipements: ["Jacuzzi prive", "Hammam", "Soins beaute", "Aromatherapie"],
  },
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
    reception: "lobby",
    piscine: "piscine",
    restaurant: "restaurant",
    "salle-de-reunion": "salle-reunion",
    "salle-reunion": "salle-reunion",
    spa: "spa",
    "bien-etre": "spa",
  };
  return map[n] || map[nom.toLowerCase()] || n;
};

export default function ZoneDetailScreen() {
  const router = useRouter();
  const { theme, lang } = useApp();
  const params = useLocalSearchParams();
  const zoneId = params.id as string;
  const zoneKey = getNomKey(zoneId);
  const zoneDataStatic = ZONES_DATA[zoneKey];

  const [zoneFirebase, setZoneFirebase] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("info");
  const [photos, setPhotos] = useState(zoneDataStatic?.photos || []);
  const [description, setDescription] = useState(
    zoneDataStatic?.description || "",
  );
  const [horaires, setHoraires] = useState(zoneDataStatic?.horaires || "");
  const [nom, setNom] = useState(zoneDataStatic?.nom || "");
  const [icone, setIcone] = useState(zoneDataStatic?.icone || "");
  const [calendrier, setCalendrier] = useState(
    zoneDataStatic?.calendrier || [],
  );
  const [menuJour, setMenuJour] = useState(
    (zoneDataStatic as any)?.menuJour || null,
  );

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "zones"), (snapshot) => {
      const zones = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const found = zones.find(
        (z) => getNomKey(z.nom) === zoneKey || getNomKey(z.id) === zoneKey,
      );
      if (found) {
        setZoneFirebase(found);
        if (found.photos?.length > 0) {
          setPhotos(found.photos);
          setPhotoIndex(0);
        }
        if (found.description) setDescription(found.description);
        if (found.horaires) setHoraires(found.horaires);
        if (found.nom) setNom(found.nom);
        if (found.icone) setIcone(found.icone);
        if (found.calendrier?.length > 0) setCalendrier(found.calendrier);
        if (found.menuJour?.length > 0) setMenuJour(found.menuJour);
      }
    });
    return unsubscribe;
  }, [zoneKey]);

  if (!zoneDataStatic) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backBtnText, { color: theme.accent }]}>
            ← {lang === "ar" ? "رجوع" : lang === "en" ? "Back" : "Retour"}
          </Text>
        </TouchableOpacity>
        <View style={styles.errorBox}>
          <Text style={{ color: theme.textSub, fontSize: 16 }}>
            Zone introuvable
          </Text>
        </View>
      </View>
    );
  }

  const couleur = zoneDataStatic.couleur;
  const occupees = zoneFirebase?.personnes || 0;
  const maxPersonnes =
    zoneFirebase?.capacite ||
    (zoneKey === "gym"
      ? 30
      : zoneKey === "piscine"
        ? 50
        : zoneKey === "restaurant"
          ? 80
          : zoneKey === "spa"
            ? 10
            : zoneKey === "salle-reunion"
              ? 30
              : 100);
  const tauxOccupation = Math.min(
    Math.round((occupees / maxPersonnes) * 100),
    100,
  );

  const lbl = {
    info: lang === "ar" ? "معلومات" : "Info",
    photos: lang === "ar" ? "الصور" : "Photos",
    calendrier: lang === "ar" ? "الجدول" : "Calendrier",
    menu: lang === "ar" ? "القائمة" : "Menu",
    occupation:
      lang === "ar"
        ? "الاشغال الحالي"
        : lang === "en"
          ? "Current Occupancy"
          : "Occupation actuelle",
    occupe: lang === "ar" ? "مشغول" : lang === "en" ? "Occupied" : "Occupe",
    dispo: lang === "ar" ? "متاح" : lang === "en" ? "Available" : "Disponible",
    equipements:
      lang === "ar"
        ? "المعدات والخدمات"
        : lang === "en"
          ? "Equipment & Services"
          : "Equipements & Services",
    apercu: lang === "ar" ? "معاينة" : lang === "en" ? "Preview" : "Apercu",
    programme:
      lang === "ar"
        ? "برنامج الانشطة"
        : lang === "en"
          ? "Activity Schedule"
          : "Programme des activites",
    menuJour:
      lang === "ar"
        ? "قائمة اليوم"
        : lang === "en"
          ? "Today's Menu"
          : "Menu du jour",
    aucune:
      lang === "ar"
        ? "لا توجد انشطة"
        : lang === "en"
          ? "No activities"
          : "Aucune activite",
    complet: lang === "ar" ? "مكتمل" : lang === "en" ? "Full" : "Complet",
    presque:
      lang === "ar"
        ? "شبه ممتلئ"
        : lang === "en"
          ? "Almost full"
          : "Presque plein",
    disponible:
      lang === "ar" ? "متاح" : lang === "en" ? "Available" : "Disponible",
    retour: lang === "ar" ? "رجوع" : lang === "en" ? "Back" : "Retour",
  };

  const tabs = [
    "info",
    "photos",
    ...(calendrier?.length > 0 ? ["calendrier"] : []),
    ...(menuJour ? ["menu"] : []),
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: couleur + "22" }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backBtnText, { color: theme.accent }]}>
            ← {lbl.retour}
          </Text>
        </TouchableOpacity>
        <Text style={styles.heroIcon}>{icone}</Text>
        <Text style={[styles.heroTitle, { color: theme.text }]}>{nom}</Text>
        <Text style={[styles.heroHoraires, { color: theme.textSub }]}>
          🕐 {horaires}
        </Text>
        <View style={[styles.occupationBox, { backgroundColor: theme.card }]}>
          <View style={styles.occupationRow}>
            <Text style={[styles.occupationLabel, { color: theme.textSub }]}>
              {lbl.occupation}
            </Text>
            <Text
              style={[
                styles.occupationVal,
                { color: tauxOccupation > 70 ? "#E53935" : "#2E7D32" },
              ]}
            >
              {occupees}/{maxPersonnes} pers.
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.bg3 }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${tauxOccupation}%`,
                  backgroundColor:
                    tauxOccupation > 70
                      ? "#E53935"
                      : tauxOccupation > 40
                        ? "#F57C00"
                        : "#2E7D32",
                },
              ]}
            />
          </View>
          <Text style={[styles.occupationPct, { color: theme.textSub }]}>
            {tauxOccupation}%
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: zoneFirebase?.occupee
                ? "#E5393522"
                : "#2E7D3222",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: zoneFirebase?.occupee ? "#E53935" : "#2E7D32" },
            ]}
          >
            {zoneFirebase?.occupee ? "🔴 " + lbl.occupe : "🟢 " + lbl.dispo}
          </Text>
        </View>
      </View>

      {/* Tab bar */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && {
                borderBottomColor: couleur,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? couleur : theme.textSub },
              ]}
            >
              {tab === "info"
                ? lbl.info
                : tab === "photos"
                  ? lbl.photos
                  : tab === "calendrier"
                    ? lbl.calendrier
                    : lbl.menu}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* INFO */}
        {activeTab === "info" && (
          <View>
            <Text style={[styles.description, { color: theme.textSub }]}>
              {description}
            </Text>
            <Text style={[styles.sectionLabel, { color: theme.accent }]}>
              {lbl.equipements}
            </Text>
            <View style={styles.equipGrid}>
              {(zoneDataStatic.equipements || []).map((eq, i) => (
                <View
                  key={i}
                  style={[
                    styles.equipItem,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.equipText, { color: theme.textSub }]}>
                    {eq}
                  </Text>
                </View>
              ))}
            </View>
            {photos.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: theme.accent }]}>
                  {lbl.apercu}
                </Text>
                <Image source={{ uri: photos[0] }} style={styles.mainPhoto} />
              </>
            )}
          </View>
        )}

        {/* PHOTOS */}
        {activeTab === "photos" && (
          <View>
            {photos.length > 0 ? (
              <>
                <Image
                  source={{
                    uri: photos[Math.min(photoIndex, photos.length - 1)],
                  }}
                  style={styles.bigPhoto}
                />
                <View style={styles.thumbnailRow}>
                  {photos.map((p, i) => (
                    <TouchableOpacity key={i} onPress={() => setPhotoIndex(i)}>
                      <Image
                        source={{ uri: p }}
                        style={[
                          styles.thumbnail,
                          photoIndex === i && {
                            borderColor: couleur,
                            borderWidth: 2,
                          },
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <View style={[styles.emptyBox, { backgroundColor: theme.card }]}>
                <Text style={[styles.emptyText, { color: theme.textSub }]}>
                  Aucune photo disponible
                </Text>
              </View>
            )}
          </View>
        )}

        {/* CALENDRIER */}
        {activeTab === "calendrier" && (
          <View>
            <Text style={[styles.sectionLabel, { color: theme.accent }]}>
              {lbl.programme}
            </Text>
            {calendrier.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: theme.card }]}>
                <Text style={[styles.emptyText, { color: theme.textSub }]}>
                  {lbl.aucune}
                </Text>
              </View>
            ) : (
              calendrier.map((cours, i) => (
                <View
                  key={i}
                  style={[styles.coursCard, { backgroundColor: theme.card }]}
                >
                  <View
                    style={[styles.coursJour, { backgroundColor: couleur }]}
                  >
                    <Text style={styles.coursJourText}>{cours.jour}</Text>
                    <Text style={styles.coursHeureText}>{cours.heure}</Text>
                  </View>
                  <View style={styles.coursInfo}>
                    <Text style={[styles.coursNom, { color: theme.text }]}>
                      {cours.cours}
                    </Text>
                    <Text
                      style={[styles.coursEntraineur, { color: theme.textSub }]}
                    >
                      👤 {cours.entraineur}
                    </Text>
                    <View style={styles.coursPlaces}>
                      <Text
                        style={[
                          styles.coursPlacesText,
                          { color: theme.textSub },
                        ]}
                      >
                        🪑 {cours.restantes}/{cours.places}
                      </Text>
                      <View
                        style={[
                          styles.placesBadge,
                          {
                            backgroundColor:
                              cours.restantes === 0
                                ? "#E53935"
                                : cours.restantes <= 3
                                  ? "#F57C00"
                                  : "#2E7D32",
                          },
                        ]}
                      >
                        <Text style={styles.placesBadgeText}>
                          {cours.restantes === 0
                            ? lbl.complet
                            : cours.restantes <= 3
                              ? lbl.presque
                              : lbl.disponible}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* MENU */}
        {activeTab === "menu" && menuJour && (
          <View>
            <Text style={[styles.sectionLabel, { color: theme.accent }]}>
              {lbl.menuJour}
            </Text>
            {menuJour.map((repas, i) => (
              <View
                key={i}
                style={[
                  styles.repasCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <Text style={styles.repasTitle}>{repas.repas}</Text>
                {(repas.items || []).filter(Boolean).map((item, j) => (
                  <View key={j} style={styles.menuItem}>
                    <Text style={{ color: theme.accent, fontSize: 14 }}>•</Text>
                    <Text
                      style={[styles.menuItemText, { color: theme.textSub }]}
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
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
  hero: { padding: 20, paddingTop: 60, alignItems: "center" },
  heroIcon: { fontSize: 50, marginBottom: 8 },
  heroTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 4 },
  heroHoraires: { fontSize: 13, marginBottom: 16 },
  occupationBox: {
    width: "100%",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  occupationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  occupationLabel: { fontSize: 13 },
  occupationVal: { fontSize: 13, fontWeight: "bold" },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: { height: "100%", borderRadius: 4 },
  occupationPct: { fontSize: 11, textAlign: "right" },
  statusBadge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  statusText: { fontSize: 14, fontWeight: "bold" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabText: { fontSize: 12 },
  content: { flex: 1, padding: 16 },
  description: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 8,
  },
  equipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  equipItem: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  equipText: { fontSize: 12 },
  mainPhoto: { width: "100%", height: 200, borderRadius: 14, marginBottom: 20 },
  bigPhoto: { width: "100%", height: 250, borderRadius: 14, marginBottom: 12 },
  thumbnailRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  thumbnail: { width: 80, height: 60, borderRadius: 8 },
  emptyBox: { borderRadius: 14, padding: 30, alignItems: "center" },
  emptyText: { fontSize: 14 },
  coursCard: {
    flexDirection: "row",
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  coursJour: {
    width: 70,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  coursJourText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  coursHeureText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  coursInfo: { flex: 1, padding: 14 },
  coursNom: { fontWeight: "bold", fontSize: 14, marginBottom: 4 },
  coursEntraineur: { fontSize: 12, marginBottom: 6 },
  coursPlaces: { flexDirection: "row", alignItems: "center", gap: 8 },
  coursPlacesText: { fontSize: 12 },
  placesBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  placesBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  repasCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  repasTitle: {
    color: "#C9A96E",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  menuItem: { flexDirection: "row", gap: 8, marginBottom: 6 },
  menuItemText: { fontSize: 13 },
  errorBox: { flex: 1, justifyContent: "center", alignItems: "center" },
});
