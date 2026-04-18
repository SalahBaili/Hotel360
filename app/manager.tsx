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
import { useApp } from "../context/AppContext";

const SHIFTS = [
  {
    key: "matin",
    label: "Equipe Matin",
    heure: "06:00 — 14:00",
    color: "#F57C00",
  },
  {
    key: "soir",
    label: "Equipe Soir",
    heure: "14:00 — 22:00",
    color: "#5C6BC0",
  },
  {
    key: "nuit",
    label: "Equipe Nuit",
    heure: "22:00 — 06:00",
    color: "#0288D1",
  },
];

const POSTES = [
  "Femme de menage",
  "Receptionniste",
  "Cuisinier",
  "Serveur",
  "Securite",
  "Maintenance",
];

export default function ManagerScreen() {
  const router = useRouter();
  const { theme, lang } = useApp();
  const [users, setUsers] = useState([]);
  const [pointages, setPointages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalShift, setModalShift] = useState(false);
  const [modalPoste, setModalPoste] = useState(false);
  const [activeTab, setActiveTab] = useState("employes");

  const lbl = {
    titre: lang === "ar" ? "المدير" : lang === "en" ? "Manager" : "Manager",
    retour: lang === "ar" ? "رجوع" : lang === "en" ? "Back" : "Retour",
    presents: lang === "ar" ? "حاضرون" : lang === "en" ? "Present" : "Presents",
    absents: lang === "ar" ? "غائبون" : lang === "en" ? "Absent" : "Absents",
    total: lang === "ar" ? "المجموع" : lang === "en" ? "Total" : "Total",
    employes:
      lang === "ar" ? "الموظفون" : lang === "en" ? "Employees" : "Employes",
    planning:
      lang === "ar" ? "الجدول" : lang === "en" ? "Planning" : "Planning",
    pointages:
      lang === "ar" ? "التوقيت" : lang === "en" ? "Timesheets" : "Pointages",
    present: lang === "ar" ? "حاضر" : lang === "en" ? "Present" : "Present",
    absent: lang === "ar" ? "غائب" : lang === "en" ? "Absent" : "Absent",
    poste: lang === "ar" ? "المنصب" : lang === "en" ? "Position" : "Poste",
    horaire: lang === "ar" ? "التوقيت" : lang === "en" ? "Schedule" : "Horaire",
    assignerHoraire:
      lang === "ar"
        ? "تعيين التوقيت"
        : lang === "en"
          ? "Assign Schedule"
          : "Assigner un horaire",
    assignerPoste:
      lang === "ar"
        ? "تعيين المنصب"
        : lang === "en"
          ? "Assign Position"
          : "Assigner un poste",
    annuler: lang === "ar" ? "الغاء" : lang === "en" ? "Cancel" : "Annuler",
    aucunEmploye:
      lang === "ar"
        ? "لا يوجد موظف"
        : lang === "en"
          ? "No employee assigned"
          : "Aucun employe assigne",
    pointagesJour:
      lang === "ar"
        ? "توقيتات اليوم"
        : lang === "en"
          ? "Today's timesheets"
          : "Pointages du jour",
    aucunPointage:
      lang === "ar"
        ? "لا توجد توقيتات"
        : lang === "en"
          ? "No timesheets today"
          : "Aucun pointage aujourd'hui",
    entree: lang === "ar" ? "دخول" : lang === "en" ? "Entry" : "Entree",
    sortie: lang === "ar" ? "خروج" : lang === "en" ? "Exit" : "Sortie",
    encours:
      lang === "ar" ? "جاري" : lang === "en" ? "In progress" : "En cours...",
    termine: lang === "ar" ? "منتهي" : lang === "en" ? "Done" : "Termine",
    duree: lang === "ar" ? "المدة" : lang === "en" ? "Duration" : "Duree",
    posteNonAssigne:
      lang === "ar"
        ? "منصب غير معين"
        : lang === "en"
          ? "Position not assigned"
          : "Poste non assigne",
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.role !== "admin"),
      );
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const unsubscribe = onSnapshot(collection(db, "pointages"), (snap) => {
      setPointages(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => p.date === today),
      );
    });
    return unsubscribe;
  }, []);

  const getPointage = (uid) => pointages.find((p) => p.uid === uid);
  const getShiftInfo = (shift) => SHIFTS.find((s) => s.key === shift);
  const presentCount = pointages.filter(
    (p) => p.heureEntree && !p.heureSortie,
  ).length;
  const absentCount = users.length - presentCount;

  const handleAssignShift = async (uid, shift) => {
    try {
      await setDoc(doc(db, "users", uid), { shift }, { merge: true });
      setModalShift(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'assigner l'horaire");
    }
  };

  const handleAssignPoste = async (uid, poste) => {
    try {
      await setDoc(doc(db, "users", uid), { poste }, { merge: true });
      setModalPoste(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'assigner le poste");
    }
  };

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

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          [lbl.presents, presentCount, "#2E7D32"],
          [lbl.absents, absentCount, "#E53935"],
          [lbl.total, users.length, "#64B5F6"],
        ].map(([label, val, color], i) => (
          <View
            key={i}
            style={[
              styles.statBox,
              { backgroundColor: theme.card, borderColor: color },
            ]}
          >
            <Text style={[styles.statNum, { color }]}>{val}</Text>
            <Text style={[styles.statLabel, { color: theme.textSub }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: theme.card }]}>
        {["employes", "planning", "pointages"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { backgroundColor: theme.bg },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? theme.accent : theme.textSub },
              ]}
            >
              {tab === "employes"
                ? lbl.employes
                : tab === "planning"
                  ? lbl.planning
                  : lbl.pointages}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* EMPLOYES */}
        {activeTab === "employes" &&
          users.map((u) => {
            const ptg = getPointage(u.id);
            const isPresent = ptg?.heureEntree && !ptg?.heureSortie;
            const shiftInfo = getShiftInfo(u.shift);
            return (
              <View
                key={u.id}
                style={[
                  styles.employeCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <View style={styles.employeLeft}>
                  <View
                    style={[
                      styles.employeAvatar,
                      {
                        backgroundColor: isPresent ? "#2E7D3233" : "#E5393533",
                      },
                    ]}
                  >
                    <Text style={styles.employeAvatarText}>
                      {(u.nom || "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.employeNom, { color: theme.text }]}>
                      {u.nom || "Sans nom"}
                    </Text>
                    <Text
                      style={[styles.employePoste, { color: theme.textSub }]}
                    >
                      {u.poste || lbl.posteNonAssigne}
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
                        backgroundColor: isPresent ? "#2E7D3222" : "#E5393522",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presentText,
                        { color: isPresent ? "#2E7D32" : "#E53935" },
                      ]}
                    >
                      {isPresent ? lbl.present : lbl.absent}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: theme.bg, borderColor: theme.border },
                    ]}
                    onPress={() => {
                      setSelectedUser(u);
                      setModalPoste(true);
                    }}
                  >
                    <Text
                      style={[styles.actionBtnText, { color: theme.accent }]}
                    >
                      {lbl.poste}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: theme.bg, borderColor: theme.border },
                    ]}
                    onPress={() => {
                      setSelectedUser(u);
                      setModalShift(true);
                    }}
                  >
                    <Text
                      style={[styles.actionBtnText, { color: theme.accent }]}
                    >
                      {lbl.horaire}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

        {/* PLANNING */}
        {activeTab === "planning" &&
          SHIFTS.map((shift) => {
            const employes = users.filter((u) => u.shift === shift.key);
            return (
              <View
                key={shift.key}
                style={[
                  styles.shiftCard,
                  { backgroundColor: theme.card, borderLeftColor: shift.color },
                ]}
              >
                <View style={styles.shiftHeader}>
                  <Text style={[styles.shiftTitle, { color: shift.color }]}>
                    {shift.label}
                  </Text>
                  <Text style={[styles.shiftHeure, { color: theme.textSub }]}>
                    {shift.heure}
                  </Text>
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
                  <Text style={[styles.shiftEmpty, { color: theme.textSub }]}>
                    {lbl.aucunEmploye}
                  </Text>
                ) : (
                  employes.map((e) => (
                    <View
                      key={e.id}
                      style={[
                        styles.shiftEmploye,
                        { borderTopColor: theme.border },
                      ]}
                    >
                      <Text
                        style={[styles.shiftEmployeNom, { color: theme.text }]}
                      >
                        {e.nom || "Sans nom"}
                      </Text>
                      <Text
                        style={[
                          styles.shiftEmployePoste,
                          { color: theme.textSub },
                        ]}
                      >
                        {e.poste || "—"}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            );
          })}

        {/* POINTAGES */}
        {activeTab === "pointages" && (
          <View>
            <Text style={[styles.sectionLabel, { color: theme.accent }]}>
              {lbl.pointagesJour}
            </Text>
            {pointages.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: theme.card }]}>
                <Text style={[styles.emptyText, { color: theme.textSub }]}>
                  {lbl.aucunPointage}
                </Text>
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
                  : lbl.encours;
                const isActive = p.heureEntree && !p.heureSortie;
                return (
                  <View
                    key={p.id}
                    style={[
                      styles.pointageCard,
                      {
                        backgroundColor: theme.card,
                        borderLeftColor: isActive ? "#2E7D32" : "#64B5F6",
                      },
                    ]}
                  >
                    <View style={styles.pointageTop}>
                      <Text style={[styles.pointageNom, { color: theme.text }]}>
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
                          {isActive ? lbl.present : lbl.termine}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.pointageRow}>
                      <Text
                        style={[styles.pointageLabel, { color: theme.textSub }]}
                      >
                        {lbl.entree}:{" "}
                        <Text
                          style={[styles.pointageVal, { color: theme.text }]}
                        >
                          {entree}
                        </Text>
                      </Text>
                      <Text
                        style={[styles.pointageLabel, { color: theme.textSub }]}
                      >
                        {lbl.sortie}:{" "}
                        <Text
                          style={[styles.pointageVal, { color: theme.text }]}
                        >
                          {sortie}
                        </Text>
                      </Text>
                    </View>
                    {p.duree && (
                      <Text
                        style={[styles.pointageDuree, { color: theme.accent }]}
                      >
                        {lbl.duree}: {p.duree}
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
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {lbl.assignerHoraire}
            </Text>
            <Text style={[styles.modalSub, { color: theme.textSub }]}>
              {selectedUser?.nom}
            </Text>
            {SHIFTS.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[
                  styles.modalOption,
                  {
                    backgroundColor: theme.bg,
                    borderColor:
                      selectedUser?.shift === s.key ? s.color : theme.border,
                  },
                  selectedUser?.shift === s.key && { borderWidth: 2 },
                ]}
                onPress={() => handleAssignShift(selectedUser.id, s.key)}
              >
                <View>
                  <Text style={[styles.modalOptionTitle, { color: s.color }]}>
                    {s.label}
                  </Text>
                  <Text
                    style={[styles.modalOptionSub, { color: theme.textSub }]}
                  >
                    {s.heure}
                  </Text>
                </View>
                {selectedUser?.shift === s.key && (
                  <Text style={{ color: s.color, fontSize: 18 }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: "#E5393522" }]}
              onPress={() => setModalShift(false)}
            >
              <Text style={styles.cancelText}>{lbl.annuler}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Poste */}
      <Modal visible={modalPoste} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {lbl.assignerPoste}
            </Text>
            <Text style={[styles.modalSub, { color: theme.textSub }]}>
              {selectedUser?.nom}
            </Text>
            {POSTES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.modalOption,
                  {
                    backgroundColor: theme.bg,
                    borderColor:
                      selectedUser?.poste === p ? "#64B5F6" : theme.border,
                  },
                  selectedUser?.poste === p && { borderWidth: 2 },
                ]}
                onPress={() => handleAssignPoste(selectedUser.id, p)}
              >
                <Text
                  style={[
                    styles.modalOptionTitle,
                    {
                      color: selectedUser?.poste === p ? "#64B5F6" : theme.text,
                    },
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
              style={[styles.cancelBtn, { backgroundColor: "#E5393522" }]}
              onPress={() => setModalPoste(false)}
            >
              <Text style={styles.cancelText}>{lbl.annuler}</Text>
            </TouchableOpacity>
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
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 15,
    gap: 10,
    marginTop: 16,
    marginBottom: 4,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  statNum: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 11, marginTop: 2 },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  tabText: { fontSize: 12 },
  content: { flex: 1, padding: 15 },
  employeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
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
  employeNom: { fontSize: 14, fontWeight: "bold", marginBottom: 2 },
  employePoste: { fontSize: 11, marginBottom: 2 },
  employeShift: { fontSize: 11, fontWeight: "bold" },
  employeRight: { alignItems: "flex-end", gap: 4 },
  presentBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  presentText: { fontSize: 11, fontWeight: "bold" },
  actionBtn: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 11 },
  shiftCard: {
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
  shiftHeure: { fontSize: 11 },
  shiftCount: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  shiftCountText: { fontSize: 11, fontWeight: "bold" },
  shiftEmpty: { fontSize: 12, fontStyle: "italic" },
  shiftEmploye: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
  },
  shiftEmployeNom: { fontSize: 13 },
  shiftEmployePoste: { fontSize: 12 },
  sectionLabel: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  emptyBox: { borderRadius: 14, padding: 30, alignItems: "center" },
  emptyText: { fontSize: 14 },
  pointageCard: {
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
  pointageNom: { fontSize: 14, fontWeight: "bold" },
  pointageStatus: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pointageStatusText: { fontSize: 11, fontWeight: "bold" },
  pointageRow: { flexDirection: "row", justifyContent: "space-between" },
  pointageLabel: { fontSize: 12 },
  pointageVal: { fontWeight: "bold" },
  pointageDuree: { fontSize: 12, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  modalSub: { fontSize: 13, textAlign: "center", marginBottom: 20 },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  modalOptionTitle: { fontSize: 14, fontWeight: "bold" },
  modalOptionSub: { fontSize: 11, marginTop: 2 },
  cancelBtn: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },
  cancelText: { color: "#E53935", fontSize: 15, fontWeight: "bold" },
});
