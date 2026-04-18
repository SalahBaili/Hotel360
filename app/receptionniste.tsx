import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../config/firebase";
import { useApp } from "../context/AppContext";

export default function ReceptionnisteScreen() {
  const router = useRouter();
  const { theme, lang } = useApp();
  const user = auth.currentUser;
  const [chambres, setChambres] = useState([]);
  const [pointage, setPointage] = useState(null);
  const [isPointed, setIsPointed] = useState(false);
  const [timer, setTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const lbl = {
    titre:
      lang === "ar"
        ? "موظف الاستقبال"
        : lang === "en"
          ? "Receptionist"
          : "Receptionniste",
    retour: lang === "ar" ? "رجوع" : lang === "en" ? "Back" : "Retour",
    monPointage:
      lang === "ar"
        ? "توقيتي"
        : lang === "en"
          ? "My Timesheet"
          : "Mon Pointage",
    pointer_entree:
      lang === "ar"
        ? "تسجيل الدخول"
        : lang === "en"
          ? "Clock In"
          : "Pointer l'entree",
    pointer_sortie:
      lang === "ar"
        ? "تسجيل الخروج"
        : lang === "en"
          ? "Clock Out"
          : "Pointer la sortie",
    tempsTravail:
      lang === "ar"
        ? "وقت العمل"
        : lang === "en"
          ? "Work time"
          : "Temps de travail",
    propres: lang === "ar" ? "نظيفة" : lang === "en" ? "Clean" : "Propres",
    aNettoyer:
      lang === "ar" ? "يجب تنظيفها" : lang === "en" ? "To clean" : "A nettoyer",
    etatChambres:
      lang === "ar"
        ? "حالة الغرف"
        : lang === "en"
          ? "Room Status"
          : "Etat des Chambres",
    propre: lang === "ar" ? "نظيفة" : lang === "en" ? "Clean" : "Propre",
    sale:
      lang === "ar"
        ? "تحتاج تنظيف"
        : lang === "en"
          ? "Needs cleaning"
          : "A nettoyer",
    marquerSale:
      lang === "ar"
        ? "تحديد كمتسخة"
        : lang === "en"
          ? "Mark dirty"
          : "Marquer sale",
    marquerPropre:
      lang === "ar"
        ? "تحديد كنظيفة"
        : lang === "en"
          ? "Mark clean"
          : "Marquer propre",
    occupee: lang === "ar" ? "مشغولة" : lang === "en" ? "Occupied" : "Occupee",
    libre: lang === "ar" ? "حرة" : lang === "en" ? "Free" : "Libre",
    entree: lang === "ar" ? "دخول" : lang === "en" ? "Entry" : "Entree",
    sortie: lang === "ar" ? "خروج" : lang === "en" ? "Exit" : "Sortie",
    duree: lang === "ar" ? "المدة" : lang === "en" ? "Duration" : "Duree",
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "chambres"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.id.localeCompare(b.id));
      setChambres(data);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const loadPointage = async () => {
      if (!user) return;
      const today = new Date().toISOString().split("T")[0];
      try {
        const snap = await getDoc(doc(db, "pointages", `${user.uid}_${today}`));
        if (snap.exists()) {
          const data = snap.data();
          setPointage(data);
          if (data.heureEntree && !data.heureSortie) {
            setIsPointed(true);
            const debut = new Date(data.heureEntree).getTime();
            setElapsed(Math.floor((Date.now() - debut) / 1000));
          }
        }
      } catch (e) {}
    };
    loadPointage();
  }, [user]);

  useEffect(() => {
    if (isPointed) {
      const t = setInterval(() => setElapsed((e) => e + 1), 1000);
      setTimer(t);
      return () => clearInterval(t);
    } else {
      if (timer) clearInterval(timer);
    }
  }, [isPointed]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const handlePointer = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const heure = now.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    try {
      if (!isPointed) {
        await setDoc(doc(db, "pointages", `${user.uid}_${today}`), {
          uid: user.uid,
          nom: user.displayName || user.email,
          role: "receptionniste",
          date: today,
          heureEntree: now.toISOString(),
          heureSortie: null,
          duree: null,
        });
        setIsPointed(true);
        setElapsed(0);
        Alert.alert(lbl.entree, `${heure}`);
      } else {
        const entreeSnap = await getDoc(
          doc(db, "pointages", `${user.uid}_${today}`),
        );
        const entreeData = entreeSnap.data();
        const debut = new Date(entreeData.heureEntree).getTime();
        const dureeMin = Math.floor((Date.now() - debut) / 60000);
        const dureeStr = `${Math.floor(dureeMin / 60)}h${dureeMin % 60}min`;
        await setDoc(
          doc(db, "pointages", `${user.uid}_${today}`),
          { ...entreeData, heureSortie: now.toISOString(), duree: dureeStr },
          { merge: true },
        );
        setIsPointed(false);
        Alert.alert(lbl.sortie, `${heure} — ${lbl.duree}: ${dureeStr}`);
      }
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'enregistrer le pointage");
    }
  };

  const handleToggleProprete = async (chambreId, propre) => {
    try {
      await setDoc(
        doc(db, "chambres", chambreId),
        { propre: !propre },
        { merge: true },
      );
      await addDoc(collection(db, "historique"), {
        type: "menage",
        message: `Chambre ${chambreId} marquee ${!propre ? "propre" : "sale"}`,
        heure: new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: "Aujourd'hui",
        icone: !propre ? "✅" : "🧹",
        uid: user?.uid,
      });
    } catch (e) {
      Alert.alert("Erreur", "Impossible de modifier l'etat");
    }
  };

  const propresCount = chambres.filter((c) => c.propre).length;
  const salesCount = chambres.filter((c) => !c.propre).length;

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

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* POINTAGE */}
        <View
          style={[
            styles.pointageCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.pointageTitle, { color: theme.text }]}>
            {lbl.monPointage}
          </Text>
          <Text style={[styles.pointageDate, { color: theme.textSub }]}>
            {new Date().toLocaleDateString(
              lang === "ar" ? "ar-TN" : lang === "en" ? "en-US" : "fr-FR",
              { weekday: "long", day: "numeric", month: "long" },
            )}
          </Text>
          {isPointed && (
            <View style={[styles.timerBox, { backgroundColor: theme.bg }]}>
              <Text style={[styles.timerLabel, { color: theme.textSub }]}>
                {lbl.tempsTravail}
              </Text>
              <Text style={[styles.timerValue, { color: theme.accent }]}>
                {formatTime(elapsed)}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.pointageBtn,
              { backgroundColor: isPointed ? "#E53935" : "#2E7D32" },
            ]}
            onPress={handlePointer}
          >
            <Text style={styles.pointageBtnText}>
              {isPointed ? lbl.pointer_sortie : lbl.pointer_entree}
            </Text>
          </TouchableOpacity>
          {pointage?.heureEntree && (
            <View
              style={[styles.pointageInfoRow, { borderTopColor: theme.border }]}
            >
              <Text
                style={[styles.pointageInfoLabel, { color: theme.textSub }]}
              >
                {lbl.entree}
              </Text>
              <Text style={[styles.pointageInfoVal, { color: theme.text }]}>
                {new Date(pointage.heureEntree).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          )}
          {pointage?.heureSortie && (
            <>
              <View
                style={[
                  styles.pointageInfoRow,
                  { borderTopColor: theme.border },
                ]}
              >
                <Text
                  style={[styles.pointageInfoLabel, { color: theme.textSub }]}
                >
                  {lbl.sortie}
                </Text>
                <Text style={[styles.pointageInfoVal, { color: theme.text }]}>
                  {new Date(pointage.heureSortie).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <View
                style={[
                  styles.pointageInfoRow,
                  { borderTopColor: theme.border },
                ]}
              >
                <Text
                  style={[styles.pointageInfoLabel, { color: theme.textSub }]}
                >
                  {lbl.duree}
                </Text>
                <Text style={[styles.pointageInfoVal, { color: "#2E7D32" }]}>
                  {pointage.duree}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statBox,
              { backgroundColor: "#2E7D3222", borderColor: "#2E7D32" },
            ]}
          >
            <Text style={[styles.statNum, { color: theme.text }]}>
              ✅ {propresCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSub }]}>
              {lbl.propres}
            </Text>
          </View>
          <View
            style={[
              styles.statBox,
              { backgroundColor: "#E5393522", borderColor: "#E53935" },
            ]}
          >
            <Text style={[styles.statNum, { color: theme.text }]}>
              🧹 {salesCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSub }]}>
              {lbl.aNettoyer}
            </Text>
          </View>
        </View>

        {/* CHAMBRES */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {lbl.etatChambres}
        </Text>
        <View style={styles.chambresGrid}>
          {chambres.map((chambre) => (
            <View
              key={chambre.id}
              style={[
                styles.chambreCard,
                {
                  backgroundColor: theme.card,
                  borderColor: !chambre.propre ? "#E53935" : theme.border,
                },
              ]}
            >
              <View style={styles.chambreTop}>
                <Text style={[styles.chambreNum, { color: theme.text }]}>
                  #{chambre.id}
                </Text>
                <Text
                  style={[
                    styles.chambreOccup,
                    { color: chambre.presence ? "#E53935" : theme.textSub },
                  ]}
                >
                  {chambre.presence ? lbl.occupee : lbl.libre}
                </Text>
              </View>
              <View
                style={[
                  styles.propreteTag,
                  {
                    backgroundColor: chambre.propre ? "#2E7D3222" : "#E5393522",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.propreteText,
                    { color: chambre.propre ? "#2E7D32" : "#E53935" },
                  ]}
                >
                  {chambre.propre ? "✅ " + lbl.propre : "🧹 " + lbl.sale}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: chambre.propre ? "#E5393511" : "#2E7D3211",
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => handleToggleProprete(chambre.id, chambre.propre)}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    { color: chambre.propre ? "#E53935" : "#2E7D32" },
                  ]}
                >
                  {chambre.propre ? lbl.marquerSale : lbl.marquerPropre}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
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
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  pointageCard: {
    borderRadius: 16,
    marginHorizontal: 15,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  pointageTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  pointageDate: { fontSize: 12, marginBottom: 16 },
  timerBox: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  timerLabel: { fontSize: 12, marginBottom: 4 },
  timerValue: { fontSize: 36, fontWeight: "bold" },
  pointageBtn: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  pointageBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  pointageInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
  },
  pointageInfoLabel: { fontSize: 13 },
  pointageInfoVal: { fontSize: 13, fontWeight: "bold" },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 15,
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  statNum: { fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  statLabel: { fontSize: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  chambresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
    gap: 10,
  },
  chambreCard: { width: "47%", borderRadius: 14, padding: 14, borderWidth: 1 },
  chambreTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  chambreNum: { fontSize: 16, fontWeight: "bold" },
  chambreOccup: { fontSize: 10 },
  propreteTag: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
    marginBottom: 8,
  },
  propreteText: { fontSize: 12, fontWeight: "bold" },
  toggleBtn: {
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  toggleBtnText: { fontSize: 11, fontWeight: "bold" },
});
