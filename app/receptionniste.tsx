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

export default function ReceptionnisteScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const [chambres, setChambres] = useState([]);
  const [pointage, setPointage] = useState(null);
  const [heuresTravail, setHeuresTravail] = useState("00:00");
  const [isPointed, setIsPointed] = useState(false);
  const [timer, setTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  // Chambres temps réel
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "chambres"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.id.localeCompare(b.id));
      setChambres(data);
    });
    return unsubscribe;
  }, []);

  // Charger pointage du jour
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

  // Timer
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
        // Pointage entrée
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
        Alert.alert("✅ Pointage entrée", `Arrivée enregistrée à ${heure}`);
      } else {
        // Pointage sortie
        const entreeSnap = await getDoc(
          doc(db, "pointages", `${user.uid}_${today}`),
        );
        const entreeData = entreeSnap.data();
        const debut = new Date(entreeData.heureEntree).getTime();
        const dureeMin = Math.floor((Date.now() - debut) / 60000);
        const dureeStr = `${Math.floor(dureeMin / 60)}h${dureeMin % 60}min`;

        await setDoc(
          doc(db, "pointages", `${user.uid}_${today}`),
          {
            ...entreeData,
            heureSortie: now.toISOString(),
            duree: dureeStr,
          },
          { merge: true },
        );

        setIsPointed(false);
        Alert.alert(
          "✅ Pointage sortie",
          `Départ enregistré à ${heure}\nDurée: ${dureeStr}`,
        );
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
        message: `Chambre ${chambreId} marquée ${!propre ? "propre ✅" : "sale 🧹"}`,
        heure: new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: "Aujourd'hui",
        icone: !propre ? "✅" : "🧹",
        uid: user?.uid,
      });
    } catch (e) {
      Alert.alert("Erreur", "Impossible de modifier l'état");
    }
  };

  const propresCount = chambres.filter((c) => c.propre).length;
  const salesCount = chambres.filter((c) => !c.propre).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛎️ Réceptionniste</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── POINTAGE ── */}
        <View style={styles.pointageCard}>
          <Text style={styles.pointageTitle}>⏱️ Mon Pointage</Text>
          <Text style={styles.pointageDate}>
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>

          {isPointed && (
            <View style={styles.timerBox}>
              <Text style={styles.timerLabel}>Temps de travail</Text>
              <Text style={styles.timerValue}>{formatTime(elapsed)}</Text>
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
              {isPointed ? "🔴 Pointer la sortie" : "🟢 Pointer l'entrée"}
            </Text>
          </TouchableOpacity>

          {pointage?.heureEntree && (
            <View style={styles.pointageInfoRow}>
              <Text style={styles.pointageInfoLabel}>🟢 Entrée:</Text>
              <Text style={styles.pointageInfoVal}>
                {new Date(pointage.heureEntree).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          )}
          {pointage?.heureSortie && (
            <>
              <View style={styles.pointageInfoRow}>
                <Text style={styles.pointageInfoLabel}>🔴 Sortie:</Text>
                <Text style={styles.pointageInfoVal}>
                  {new Date(pointage.heureSortie).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <View style={styles.pointageInfoRow}>
                <Text style={styles.pointageInfoLabel}>⏱️ Durée:</Text>
                <Text style={[styles.pointageInfoVal, { color: "#2E7D32" }]}>
                  {pointage.duree}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* ── STATS CHAMBRES ── */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statBox,
              { backgroundColor: "#2E7D3222", borderColor: "#2E7D32" },
            ]}
          >
            <Text style={styles.statNum}>✅ {propresCount}</Text>
            <Text style={styles.statLabel}>Propres</Text>
          </View>
          <View
            style={[
              styles.statBox,
              { backgroundColor: "#E5393522", borderColor: "#E53935" },
            ]}
          >
            <Text style={styles.statNum}>🧹 {salesCount}</Text>
            <Text style={styles.statLabel}>À nettoyer</Text>
          </View>
        </View>

        {/* ── ÉTAT CHAMBRES ── */}
        <Text style={styles.sectionTitle}>🛏️ État des Chambres</Text>
        <View style={styles.chambresGrid}>
          {chambres.map((chambre) => (
            <View
              key={chambre.id}
              style={[
                styles.chambreCard,
                !chambre.propre && styles.chambreSale,
              ]}
            >
              <View style={styles.chambreTop}>
                <Text style={styles.chambreNum}>#{chambre.id}</Text>
                <Text
                  style={[
                    styles.chambreOccup,
                    { color: chambre.presence ? "#E53935" : "#888" },
                  ]}
                >
                  {chambre.presence ? "👤 Occupée" : "🔓 Libre"}
                </Text>
              </View>

              {/* État propreté */}
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
                  {chambre.propre ? "✅ Propre" : "🧹 À nettoyer"}
                </Text>
              </View>

              {/* Bouton toggle */}
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: chambre.propre ? "#E5393511" : "#2E7D3211",
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
                  {chambre.propre ? "Marquer sale" : "Marquer propre"}
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
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },

  pointageCard: {
    backgroundColor: "#1E2D45",
    borderRadius: 16,
    marginHorizontal: 15,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  pointageTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  pointageDate: { fontSize: 12, color: "#888", marginBottom: 16 },
  timerBox: {
    backgroundColor: "#0A1628",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  timerLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
  timerValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#64B5F6",
    fontVariant: ["tabular-nums"],
  },
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
    borderTopColor: "#2A3F5F",
  },
  pointageInfoLabel: { color: "#888", fontSize: 13 },
  pointageInfoVal: { color: "#fff", fontSize: 13, fontWeight: "bold" },

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
  statNum: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#888" },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    paddingHorizontal: 20,
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
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  chambreSale: { borderColor: "#E53935" },
  chambreTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  chambreNum: { fontSize: 16, fontWeight: "bold", color: "#fff" },
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
    borderColor: "#2A3F5F",
  },
  toggleBtnText: { fontSize: 11, fontWeight: "bold" },
});
