import { useRouter } from "expo-router";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../config/firebase";

const SHIFTS = [
  {
    key: "matin",
    label: "🌅 Équipe Matin",
    heure: "06:00 — 14:00",
    color: "#F57C00",
  },
  {
    key: "soir",
    label: "🌙 Équipe Soir",
    heure: "14:00 — 22:00",
    color: "#5C6BC0",
  },
  {
    key: "nuit",
    label: "🌃 Équipe Nuit",
    heure: "22:00 — 06:00",
    color: "#0288D1",
  },
];

const POSTES = [
  "Femme de ménage",
  "Réceptionniste",
  "Cuisinier",
  "Serveur",
  "Sécurité",
  "Maintenance",
];

export default function ManagerScreen() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [pointages, setPointages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalShift, setModalShift] = useState(false);
  const [modalPoste, setModalPoste] = useState(false);
  const [activeTab, setActiveTab] = useState("employes");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.role !== "admin");
      setUsers(data);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const unsubscribe = onSnapshot(collection(db, "pointages"), (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.date === today);
      setPointages(data);
    });
    return unsubscribe;
  }, []);

  const getPointage = (uid) => pointages.find((p) => p.uid === uid);

  const handleAssignShift = async (uid, shift) => {
    try {
      await setDoc(doc(db, "users", uid), { shift }, { merge: true });
      Alert.alert("✅ Horaire assigné !", `${shift} assigné avec succès`);
      setModalShift(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'assigner l'horaire");
    }
  };

  const handleAssignPoste = async (uid, poste) => {
    try {
      await setDoc(doc(db, "users", uid), { poste }, { merge: true });
      Alert.alert("✅ Poste assigné !", `${poste} assigné avec succès`);
      setModalPoste(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'assigner le poste");
    }
  };

  const getShiftInfo = (shift) => SHIFTS.find((s) => s.key === shift);

  const presentCount = pointages.filter(
    (p) => p.heureEntree && !p.heureSortie,
  ).length;
  const absentCount = users.length - presentCount;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Manager</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderColor: "#2E7D32" }]}>
          <Text style={[styles.statNum, { color: "#2E7D32" }]}>
            {presentCount}
          </Text>
          <Text style={styles.statLabel}>✅ Présents</Text>
        </View>
        <View style={[styles.statBox, { borderColor: "#E53935" }]}>
          <Text style={[styles.statNum, { color: "#E53935" }]}>
            {absentCount}
          </Text>
          <Text style={styles.statLabel}>❌ Absents</Text>
        </View>
        <View style={[styles.statBox, { borderColor: "#64B5F6" }]}>
          <Text style={[styles.statNum, { color: "#64B5F6" }]}>
            {users.length}
          </Text>
          <Text style={styles.statLabel}>👥 Total</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {["employes", "planning", "pointages"].map((tab) => (
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
              {tab === "employes"
                ? "👥 Employés"
                : tab === "planning"
                  ? "📅 Planning"
                  : "⏱️ Pointages"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── TAB EMPLOYÉS ── */}
        {activeTab === "employes" && (
          <View>
            {users.map((u) => {
              const ptg = getPointage(u.id);
              const isPresent = ptg?.heureEntree && !ptg?.heureSortie;
              const shiftInfo = getShiftInfo(u.shift);
              return (
                <View key={u.id} style={styles.employeCard}>
                  <View style={styles.employeLeft}>
                    <View
                      style={[
                        styles.employeAvatar,
                        {
                          backgroundColor: isPresent
                            ? "#2E7D3233"
                            : "#E5393533",
                        },
                      ]}
                    >
                      <Text style={styles.employeAvatarText}>
                        {(u.nom || "?").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.employeNom}>
                        {u.nom || "Sans nom"}
                      </Text>
                      <Text style={styles.employePoste}>
                        {u.poste || "Poste non assigné"}
                      </Text>
                      {shiftInfo && (
                        <Text
                          style={[
                            styles.employeShift,
                            { color: shiftInfo.color },
                          ]}
                        >
                          {shiftInfo.label}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.employeRight}>
                    <View
                      style={[
                        styles.presentBadge,
                        {
                          backgroundColor: isPresent
                            ? "#2E7D3222"
                            : "#E5393522",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.presentText,
                          { color: isPresent ? "#2E7D32" : "#E53935" },
                        ]}
                      >
                        {isPresent ? "✅ Présent" : "❌ Absent"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        setSelectedUser(u);
                        setModalPoste(true);
                      }}
                    >
                      <Text style={styles.actionBtnText}>🏷️ Poste</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        setSelectedUser(u);
                        setModalShift(true);
                      }}
                    >
                      <Text style={styles.actionBtnText}>⏰ Horaire</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── TAB PLANNING ── */}
        {activeTab === "planning" && (
          <View>
            {SHIFTS.map((shift) => {
              const employes = users.filter((u) => u.shift === shift.key);
              return (
                <View
                  key={shift.key}
                  style={[styles.shiftCard, { borderLeftColor: shift.color }]}
                >
                  <View style={styles.shiftHeader}>
                    <Text style={[styles.shiftTitle, { color: shift.color }]}>
                      {shift.label}
                    </Text>
                    <Text style={styles.shiftHeure}>{shift.heure}</Text>
                    <View
                      style={[
                        styles.shiftCount,
                        { backgroundColor: shift.color + "22" },
                      ]}
                    >
                      <Text
                        style={[styles.shiftCountText, { color: shift.color }]}
                      >
                        {employes.length} pers.
                      </Text>
                    </View>
                  </View>
                  {employes.length === 0 ? (
                    <Text style={styles.shiftEmpty}>Aucun employé assigné</Text>
                  ) : (
                    employes.map((e) => (
                      <View key={e.id} style={styles.shiftEmploye}>
                        <Text style={styles.shiftEmployeNom}>
                          {e.nom || "Sans nom"}
                        </Text>
                        <Text style={styles.shiftEmployePoste}>
                          {e.poste || "—"}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ── TAB POINTAGES ── */}
        {activeTab === "pointages" && (
          <View>
            <Text style={styles.sectionLabel}>Pointages du jour</Text>
            {pointages.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Aucun pointage aujourd'hui</Text>
              </View>
            ) : (
              pointages.map((p) => {
                const entree = p.heureEntree
                  ? new Date(p.heureEntree).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—";
                const sortie = p.heureSortie
                  ? new Date(p.heureSortie).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "En cours...";
                const isActive = p.heureEntree && !p.heureSortie;
                return (
                  <View
                    key={p.id}
                    style={[
                      styles.pointageCard,
                      { borderLeftColor: isActive ? "#2E7D32" : "#64B5F6" },
                    ]}
                  >
                    <View style={styles.pointageTop}>
                      <Text style={styles.pointageNom}>
                        {p.nom || "Inconnu"}
                      </Text>
                      <View
                        style={[
                          styles.pointageStatus,
                          {
                            backgroundColor: isActive
                              ? "#2E7D3222"
                              : "#64B5F622",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pointageStatusText,
                            { color: isActive ? "#2E7D32" : "#64B5F6" },
                          ]}
                        >
                          {isActive ? "🟢 Présent" : "✅ Terminé"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.pointageRow}>
                      <Text style={styles.pointageLabel}>
                        🟢 Entrée:{" "}
                        <Text style={styles.pointageVal}>{entree}</Text>
                      </Text>
                      <Text style={styles.pointageLabel}>
                        🔴 Sortie:{" "}
                        <Text style={styles.pointageVal}>{sortie}</Text>
                      </Text>
                    </View>
                    {p.duree && (
                      <Text style={styles.pointageDuree}>
                        ⏱️ Durée: {p.duree}
                      </Text>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Shift */}
      <Modal visible={modalShift} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>⏰ Assigner un horaire</Text>
            <Text style={styles.modalSub}>{selectedUser?.nom}</Text>
            {SHIFTS.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[
                  styles.modalOption,
                  selectedUser?.shift === s.key && {
                    borderColor: s.color,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => handleAssignShift(selectedUser.id, s.key)}
              >
                <View>
                  <Text style={[styles.modalOptionTitle, { color: s.color }]}>
                    {s.label}
                  </Text>
                  <Text style={styles.modalOptionSub}>{s.heure}</Text>
                </View>
                {selectedUser?.shift === s.key && (
                  <Text style={{ color: s.color, fontSize: 18 }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalShift(false)}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Poste */}
      <Modal visible={modalPoste} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🏷️ Assigner un poste</Text>
            <Text style={styles.modalSub}>{selectedUser?.nom}</Text>
            {POSTES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.modalOption,
                  selectedUser?.poste === p && {
                    borderColor: "#64B5F6",
                    borderWidth: 2,
                  },
                ]}
                onPress={() => handleAssignPoste(selectedUser.id, p)}
              >
                <Text
                  style={[
                    styles.modalOptionTitle,
                    { color: selectedUser?.poste === p ? "#64B5F6" : "#fff" },
                  ]}
                >
                  {p}
                </Text>
                {selectedUser?.poste === p && (
                  <Text style={{ color: "#64B5F6", fontSize: 18 }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalPoste(false)}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
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
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 15,
    gap: 10,
    marginBottom: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#1E2D45",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  statNum: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 2 },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: "#1E2D45",
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#0A1628" },
  tabText: { fontSize: 12, color: "#888" },
  tabTextActive: { color: "#64B5F6", fontWeight: "bold" },
  content: { flex: 1, padding: 15 },
  employeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1E2D45",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  employeLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  employeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  employeAvatarText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  employeNom: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  employePoste: { fontSize: 11, color: "#888", marginBottom: 2 },
  employeShift: { fontSize: 11, fontWeight: "bold" },
  employeRight: { alignItems: "flex-end", gap: 4 },
  presentBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  presentText: { fontSize: 11, fontWeight: "bold" },
  actionBtn: {
    backgroundColor: "#0A1628",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  actionBtnText: { fontSize: 11, color: "#64B5F6" },
  shiftCard: {
    backgroundColor: "#1E2D45",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  shiftHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  shiftTitle: { fontSize: 15, fontWeight: "bold", flex: 1 },
  shiftHeure: { fontSize: 11, color: "#888" },
  shiftCount: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  shiftCountText: { fontSize: 11, fontWeight: "bold" },
  shiftEmpty: { color: "#555", fontSize: 12, fontStyle: "italic" },
  shiftEmploye: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#2A3F5F",
  },
  shiftEmployeNom: { color: "#fff", fontSize: 13 },
  shiftEmployePoste: { color: "#888", fontSize: 12 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#64B5F6",
    marginBottom: 12,
  },
  emptyBox: {
    backgroundColor: "#1E2D45",
    borderRadius: 14,
    padding: 30,
    alignItems: "center",
  },
  emptyText: { color: "#888", fontSize: 14 },
  pointageCard: {
    backgroundColor: "#1E2D45",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
  },
  pointageTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pointageNom: { fontSize: 14, fontWeight: "bold", color: "#fff" },
  pointageStatus: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pointageStatusText: { fontSize: 11, fontWeight: "bold" },
  pointageRow: { flexDirection: "row", justifyContent: "space-between" },
  pointageLabel: { fontSize: 12, color: "#888" },
  pointageVal: { color: "#fff", fontWeight: "bold" },
  pointageDuree: { fontSize: 12, color: "#64B5F6", marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#1E2D45",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0A1628",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  modalOptionTitle: { fontSize: 14, fontWeight: "bold" },
  modalOptionSub: { fontSize: 11, color: "#888", marginTop: 2 },
  cancelBtn: {
    backgroundColor: "#E5393522",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },
  cancelText: { color: "#E53935", fontSize: 15, fontWeight: "bold" },
});
