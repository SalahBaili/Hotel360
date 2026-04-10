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

const ZONES_DATA = {
  gym: {
    nom: "Salle de Sport",
    icone: "🏋️",
    couleur: "#E53935",
    description:
      "Salle de sport entièrement équipée avec machines cardio, musculation et espace fitness. Disponible 7j/7 pour tous les résidents.",
    horaires: "06:00 — 22:00",
    photos: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80",
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80",
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80",
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
        jour: "Lun",
        heure: "10:00",
        cours: "Yoga Matinal",
        entraineur: "Sonia M.",
        places: 10,
        restantes: 7,
      },
      {
        jour: "Mar",
        heure: "09:00",
        cours: "Danse Orientale",
        entraineur: "Leila K.",
        places: 15,
        restantes: 3,
      },
      {
        jour: "Mar",
        heure: "17:00",
        cours: "HIIT Training",
        entraineur: "Ahmed B.",
        places: 10,
        restantes: 2,
      },
      {
        jour: "Mer",
        heure: "08:00",
        cours: "Pilates",
        entraineur: "Sonia M.",
        places: 12,
        restantes: 8,
      },
      {
        jour: "Jeu",
        heure: "10:00",
        cours: "Zumba",
        entraineur: "Leila K.",
        places: 20,
        restantes: 5,
      },
      {
        jour: "Ven",
        heure: "09:00",
        cours: "Cardio Dance",
        entraineur: "Ahmed B.",
        places: 15,
        restantes: 6,
      },
      {
        jour: "Sam",
        heure: "10:00",
        cours: "Stretching",
        entraineur: "Sonia M.",
        places: 10,
        restantes: 9,
      },
    ],
    equipements: [
      "🏃 Tapis de course ×4",
      "🚴 Vélos ×6",
      "🏋️ Haltères",
      "💪 Machines musculation",
      "🧘 Espace yoga",
    ],
  },
  lobby: {
    nom: "Lobby & Réception",
    icone: "🏨",
    couleur: "#1565C0",
    description:
      "Espace d'accueil luxueux avec service de conciergerie, espace lounge et Wi-Fi haut débit.",
    horaires: "24h/24 — 7j/7",
    photos: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80",
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&q=80",
      "https://images.unsplash.com/photo-1596701062351-8ac031a0a977?w=600&q=80",
    ],
    calendrier: [],
    services: [
      "🛎️ Conciergerie 24/7",
      "📶 Wi-Fi gratuit",
      "🧳 Consigne bagages",
      "🚕 Service taxi",
      "💱 Change devise",
    ],
    equipements: [
      "☕ Bar lounge",
      "📰 Espace lecture",
      "🖥️ Business corner",
      "🛋️ Salon VIP",
    ],
  },
  piscine: {
    nom: "Piscine",
    icone: "🏊",
    couleur: "#0288D1",
    description:
      "Piscine extérieure chauffée avec vue sur la Méditerranée. Bar piscine et service de serviettes inclus.",
    horaires: "08:00 — 20:00",
    photos: [
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80",
      "https://images.unsplash.com/photo-1540541338537-1220e02b4db3?w=600&q=80",
      "https://images.unsplash.com/photo-1568572933382-74d440642117?w=600&q=80",
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
      {
        jour: "Mer/Sam",
        heure: "16:00",
        cours: "Natation enfants",
        entraineur: "Rim B.",
        places: 10,
        restantes: 3,
      },
    ],
    equipements: [
      "🏊 Piscine 25m",
      "🌡️ Eau chauffée",
      "🍹 Bar piscine",
      "🪑 Transats",
      "🏖️ Zone bronzage",
    ],
  },
  restaurant: {
    nom: "Restaurant",
    icone: "🍽️",
    couleur: "#C9A96E",
    description:
      "Restaurant gastronomique proposant une cuisine tunisienne et méditerranéenne raffinée.",
    horaires: "07:00 — 23:00",
    photos: [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80",
    ],
    menuJour: [
      {
        repas: "🌅 Petit déjeuner",
        items: [
          "Buffet continental",
          "Œufs & omelettes",
          "Fruits frais",
          "Pâtisseries maison",
        ],
      },
      {
        repas: "☀️ Déjeuner",
        items: [
          "Salade niçoise",
          "Couscous royal",
          "Poisson grillé",
          "Dessert du jour",
        ],
      },
      {
        repas: "🌙 Dîner",
        items: [
          "Entrée froide variée",
          "Tajine d'agneau",
          "Pâtes fraîches",
          "Crème brûlée",
        ],
      },
    ],
    equipements: [
      "🍷 Cave à vins",
      "🌿 Menu végétarien",
      "👨‍🍳 Chef étoilé",
      "🎵 Ambiance musicale",
    ],
  },
  "salle-reunion": {
    nom: "Salle de Réunion",
    icone: "📊",
    couleur: "#5C6BC0",
    description:
      "Salle de réunion équipée pour vos événements professionnels. Capacité jusqu'à 30 personnes.",
    horaires: "08:00 — 20:00",
    photos: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
      "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=600&q=80",
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80",
    ],
    calendrier: [
      {
        jour: "Lun",
        heure: "09:00",
        cours: "Réunion direction",
        entraineur: "Réservé",
        places: 30,
        restantes: 20,
      },
      {
        jour: "Mar",
        heure: "14:00",
        cours: "Formation RH",
        entraineur: "Réservé",
        places: 20,
        restantes: 8,
      },
      {
        jour: "Jeu",
        heure: "10:00",
        cours: "Disponible",
        entraineur: "—",
        places: 30,
        restantes: 30,
      },
    ],
    equipements: [
      "📽️ Projecteur HD",
      "📡 Visioconférence",
      "📶 Wi-Fi fibre",
      "🖊️ Tableau blanc",
      "☕ Service café",
    ],
  },
  spa: {
    nom: "Spa & Bien-être",
    icone: "💆",
    couleur: "#7B1FA2",
    description:
      "Espace spa premium proposant massages, soins du visage, hammam et jacuzzi.",
    horaires: "09:00 — 21:00",
    photos: [
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80",
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
      {
        jour: "Tous",
        heure: "14:00",
        cours: "Soin visage",
        entraineur: "Amira L.",
        places: 3,
        restantes: 1,
      },
      {
        jour: "Mer/Sam",
        heure: "16:00",
        cours: "Hammam rituel",
        entraineur: "Nadia S.",
        places: 6,
        restantes: 4,
      },
    ],
    equipements: [
      "🛁 Jacuzzi privé",
      "🧖 Hammam",
      "💅 Soins beauté",
      "🌺 Aromathérapie",
      "🧘 Espace détente",
    ],
  },
};

const getNomKey = (nom) => {
  if (!nom) return "";
  const normalized = nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
  const map = {
    gym: "gym",
    "salle-de-sport": "gym",
    sport: "gym",
    lobby: "lobby",
    reception: "lobby",
    accueil: "lobby",
    piscine: "piscine",
    pool: "piscine",
    restaurant: "restaurant",
    resto: "restaurant",
    "salle-de-reunion": "salle-reunion",
    "salle-reunion": "salle-reunion",
    reunion: "salle-reunion",
    meeting: "salle-reunion",
    salle: "salle-reunion",
    spa: "spa",
    "bien-etre": "spa",
    hammam: "spa",
  };
  return map[normalized] || map[nom.toLowerCase()] || normalized;
};

export default function ZoneDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const zoneId = params.id as string;
  const zoneKey = getNomKey(zoneId);
  const zoneDataStatic = ZONES_DATA[zoneKey];

  const [zoneFirebase, setZoneFirebase] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("info");

  // ✅ Ces états se mettent à jour automatiquement depuis Firebase
  const [photos, setPhotos] = useState(zoneDataStatic?.photos || []);
  const [description, setDescription] = useState(
    zoneDataStatic?.description || "",
  );
  const [horaires, setHoraires] = useState(zoneDataStatic?.horaires || "");
  const [nom, setNom] = useState(zoneDataStatic?.nom || "");
  const [icone, setIcone] = useState(zoneDataStatic?.icone || "");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "zones"), (snapshot) => {
      const zones = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const found = zones.find(
        (z) => getNomKey(z.nom) === zoneKey || getNomKey(z.id) === zoneKey,
      );
      if (found) {
        setZoneFirebase(found);
        // ✅ Priorité aux données Firebase
        if (found.photos && found.photos.length > 0) {
          setPhotos(found.photos);
          setPhotoIndex(0);
        }
        if (found.description) setDescription(found.description);
        if (found.horaires) setHoraires(found.horaires);
        if (found.nom) setNom(found.nom);
        if (found.icone) setIcone(found.icone);
      }
    });
    return unsubscribe;
  }, [zoneKey]);

  if (!zoneDataStatic) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Zone introuvable</Text>
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
  const tabs = [
    "info",
    "photos",
    ...(zoneDataStatic.calendrier?.length > 0 ? ["calendrier"] : []),
    ...(zoneDataStatic.menuJour ? ["menu"] : []),
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.hero, { backgroundColor: couleur + "22" }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.heroIcon}>{icone}</Text>
        <Text style={styles.heroTitle}>{nom}</Text>
        <Text style={styles.heroHoraires}>🕐 {horaires}</Text>
        <View style={styles.occupationBox}>
          <View style={styles.occupationRow}>
            <Text style={styles.occupationLabel}>Occupation actuelle</Text>
            <Text
              style={[
                styles.occupationVal,
                { color: tauxOccupation > 70 ? "#E53935" : "#2E7D32" },
              ]}
            >
              {occupees}/{maxPersonnes} pers.
            </Text>
          </View>
          <View style={styles.progressBar}>
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
          <Text style={styles.occupationPct}>{tauxOccupation}% occupé</Text>
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
            {zoneFirebase?.occupee ? "🔴 Occupé" : "🟢 Disponible"}
          </Text>
        </View>
      </View>

      <View style={styles.tabBar}>
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
              style={[styles.tabText, activeTab === tab && { color: couleur }]}
            >
              {tab === "info"
                ? "ℹ️ Info"
                : tab === "photos"
                  ? "📸 Photos"
                  : tab === "calendrier"
                    ? "📅 Calendrier"
                    : "🍽️ Menu"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "info" && (
          <View>
            <Text style={styles.description}>{description}</Text>
            <Text style={styles.sectionLabel}>Équipements & Services</Text>
            <View style={styles.equipGrid}>
              {(
                zoneDataStatic.equipements ||
                zoneDataStatic.services ||
                []
              ).map((eq, i) => (
                <View key={i} style={styles.equipItem}>
                  <Text style={styles.equipText}>{eq}</Text>
                </View>
              ))}
            </View>
            {photos.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Aperçu</Text>
                <Image source={{ uri: photos[0] }} style={styles.mainPhoto} />
              </>
            )}
          </View>
        )}

        {/* ✅ TAB PHOTOS — affiche les photos Firebase uploadées par l'admin */}
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
                <Text style={styles.photoCaption}>
                  {nom} — Photo {Math.min(photoIndex, photos.length - 1) + 1}/
                  {photos.length}
                </Text>
                {zoneFirebase?.photos?.length > 0 && (
                  <View style={styles.firebaseBadge}>
                    <Text style={styles.firebaseBadgeText}>
                      ☁️ Photos ajoutées par l'administrateur
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noPhotosBox}>
                <Text style={styles.noPhotosText}>
                  📷 Aucune photo disponible
                </Text>
                <Text style={styles.noPhotosHint}>
                  L'admin peut ajouter des photos depuis "Gérer les zones"
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "calendrier" &&
          zoneDataStatic.calendrier?.length > 0 && (
            <View>
              <Text style={styles.sectionLabel}>Programme des activités</Text>
              {zoneDataStatic.calendrier.map((cours, i) => (
                <View key={i} style={styles.coursCard}>
                  <View
                    style={[styles.coursJour, { backgroundColor: couleur }]}
                  >
                    <Text style={styles.coursJourText}>{cours.jour}</Text>
                    <Text style={styles.coursHeureText}>{cours.heure}</Text>
                  </View>
                  <View style={styles.coursInfo}>
                    <Text style={styles.coursNom}>{cours.cours}</Text>
                    <Text style={styles.coursEntraineur}>
                      👤 {cours.entraineur}
                    </Text>
                    <View style={styles.coursPlaces}>
                      <Text style={styles.coursPlacesText}>
                        🪑 {cours.restantes}/{cours.places} places
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
                            ? "Complet"
                            : cours.restantes <= 3
                              ? "Presque plein"
                              : "Disponible"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

        {activeTab === "menu" && zoneDataStatic.menuJour && (
          <View>
            <Text style={styles.sectionLabel}>Menu du jour</Text>
            {zoneDataStatic.menuJour.map((repas, i) => (
              <View key={i} style={styles.repasCard}>
                <Text style={styles.repasTitle}>{repas.repas}</Text>
                {repas.items.map((item, j) => (
                  <View key={j} style={styles.menuItem}>
                    <Text style={styles.menuDot}>•</Text>
                    <Text style={styles.menuItemText}>{item}</Text>
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
  container: { flex: 1, backgroundColor: "#0A1628" },
  backBtn: { position: "absolute", top: 16, left: 16, zIndex: 10, padding: 8 },
  backBtnText: { color: "#64B5F6", fontSize: 16 },
  hero: { padding: 20, paddingTop: 60, alignItems: "center" },
  heroIcon: { fontSize: 50, marginBottom: 8 },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  heroHoraires: { fontSize: 13, color: "#888", marginBottom: 16 },
  occupationBox: {
    width: "100%",
    backgroundColor: "#1E2D45",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  occupationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  occupationLabel: { color: "#ccc", fontSize: 13 },
  occupationVal: { fontSize: 13, fontWeight: "bold" },
  progressBar: {
    height: 8,
    backgroundColor: "#2A3F5F",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: { height: "100%", borderRadius: 4 },
  occupationPct: { fontSize: 11, color: "#888", textAlign: "right" },
  statusBadge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  statusText: { fontSize: 14, fontWeight: "bold" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#1E2D45",
    borderBottomWidth: 1,
    borderBottomColor: "#2A3F5F",
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabText: { fontSize: 12, color: "#888" },
  content: { flex: 1, padding: 16 },
  description: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 22,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#64B5F6",
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
    backgroundColor: "#1E2D45",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  equipText: { color: "#ccc", fontSize: 12 },
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
  photoCaption: {
    textAlign: "center",
    color: "#888",
    fontSize: 12,
    marginBottom: 8,
  },
  firebaseBadge: {
    backgroundColor: "#1565C022",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#64B5F6",
    marginTop: 4,
  },
  firebaseBadgeText: { color: "#64B5F6", fontSize: 11 },
  noPhotosBox: {
    backgroundColor: "#1E2D45",
    borderRadius: 14,
    padding: 40,
    alignItems: "center",
    gap: 8,
  },
  noPhotosText: { color: "#888", fontSize: 16 },
  noPhotosHint: { color: "#555", fontSize: 12, textAlign: "center" },
  coursCard: {
    flexDirection: "row",
    backgroundColor: "#1E2D45",
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
  coursNom: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  coursEntraineur: { color: "#888", fontSize: 12, marginBottom: 6 },
  coursPlaces: { flexDirection: "row", alignItems: "center", gap: 8 },
  coursPlacesText: { color: "#ccc", fontSize: 12 },
  placesBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  placesBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  repasCard: {
    backgroundColor: "#1E2D45",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  repasTitle: {
    color: "#C9A96E",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  menuItem: { flexDirection: "row", gap: 8, marginBottom: 6 },
  menuDot: { color: "#64B5F6", fontSize: 14 },
  menuItemText: { color: "#ccc", fontSize: 13 },
  errorBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#888", fontSize: 16 },
});
