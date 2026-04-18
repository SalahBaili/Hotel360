import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
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
import { auth, db } from "../config/firebase";
import { useApp } from "../context/AppContext";

const ROLES = [
  { key: "admin", label: "Administrateur", color: "#E53935" },
  { key: "manager", label: "Manager", color: "#F57C00" },
  { key: "receptionniste", label: "Receptionniste", color: "#1565C0" },
];

export default function ManageUsersScreen() {
  const router = useRouter();
  const { theme, lang } = useApp();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalRole, setModalRole] = useState(false);
  const [modalActions, setModalActions] = useState(false);
  const [filterStatus, setFilterStatus] = useState("tous");
  const currentUser = auth.currentUser;

  const lbl = {
    titre:
      lang === "ar" ? "المستخدمون" : lang === "en" ? "Users" : "Utilisateurs",
    retour: lang === "ar" ? "رجوع" : lang === "en" ? "Back" : "Retour",
    total: lang === "ar" ? "المجموع" : lang === "en" ? "Total" : "Total",
    actifs: lang === "ar" ? "نشطون" : lang === "en" ? "Active" : "Actifs",
    desactives:
      lang === "ar" ? "معطلون" : lang === "en" ? "Disabled" : "Desactives",
    enligne: lang === "ar" ? "متصل" : lang === "en" ? "Online" : "En ligne",
    tous: lang === "ar" ? "الكل" : lang === "en" ? "All" : "Tous",
    aucun:
      lang === "ar"
        ? "لا يوجد مستخدمون"
        : lang === "en"
          ? "No users found"
          : "Aucun utilisateur",
    changerRole:
      lang === "ar"
        ? "تغيير الدور"
        : lang === "en"
          ? "Change Role"
          : "Changer le role",
    desactiver:
      lang === "ar"
        ? "تعطيل الحساب"
        : lang === "en"
          ? "Disable account"
          : "Desactiver le compte",
    reactiver:
      lang === "ar"
        ? "تفعيل الحساب"
        : lang === "en"
          ? "Enable account"
          : "Reactiver le compte",
    supprimer:
      lang === "ar"
        ? "حذف نهائي"
        : lang === "en"
          ? "Delete permanently"
          : "Supprimer definitivement",
    fermer: lang === "ar" ? "اغلاق" : lang === "en" ? "Close" : "Fermer",
    annuler: lang === "ar" ? "الغاء" : lang === "en" ? "Cancel" : "Annuler",
    vous: lang === "ar" ? "انت" : lang === "en" ? "You" : "Vous",
    roleActuel:
      lang === "ar"
        ? "الدور الحالي"
        : lang === "en"
          ? "Current role"
          : "Role actuel",
    bloquerSans:
      lang === "ar"
        ? "حظر دون حذف"
        : lang === "en"
          ? "Block without deleting"
          : "Bloquer sans supprimer",
    permettreReconnexion:
      lang === "ar"
        ? "السماح بتسجيل الدخول"
        : lang === "en"
          ? "Allow login"
          : "Permettre la reconnexion",
    bloquerDefinitif:
      lang === "ar"
        ? "حظر وحذف الملف الشخصي"
        : lang === "en"
          ? "Block and delete profile"
          : "Bloque et supprime le profil",
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  const handleChangeRole = async (userId, newRole) => {
    try {
      await setDoc(
        doc(db, "users", userId),
        { role: newRole },
        { merge: true },
      );
      setModalRole(false);
      setModalActions(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de modifier le role");
    }
  };

  const handleDisableUser = (user) => {
    if (user.id === currentUser?.uid) {
      Alert.alert(
        "Erreur",
        "Vous ne pouvez pas desactiver votre propre compte",
      );
      return;
    }
    Alert.alert(lbl.desactiver, `${user.nom || user.email}`, [
      { text: lbl.annuler, style: "cancel" },
      {
        text: lbl.desactiver,
        style: "destructive",
        onPress: async () => {
          try {
            await setDoc(
              doc(db, "users", user.id),
              { disabled: true },
              { merge: true },
            );
            setModalActions(false);
          } catch (e) {
            Alert.alert("Erreur", "Impossible");
          }
        },
      },
    ]);
  };

  const handleEnableUser = async (user) => {
    try {
      await setDoc(
        doc(db, "users", user.id),
        { disabled: false, deletePending: false },
        { merge: true },
      );
      setModalActions(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible");
    }
  };

  const handleDeleteUser = (user) => {
    if (user.id === currentUser?.uid) {
      Alert.alert("Erreur", "Vous ne pouvez pas supprimer votre propre compte");
      return;
    }
    Alert.alert(lbl.supprimer, `${user.nom || user.email}`, [
      { text: lbl.annuler, style: "cancel" },
      {
        text: lbl.supprimer,
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "users", user.id));
            await setDoc(doc(db, "blacklist", user.id), {
              email: user.email,
              deletedAt: new Date().toISOString(),
            });
            setModalActions(false);
          } catch (e) {
            Alert.alert("Erreur", "Impossible");
          }
        },
      },
    ]);
  };

  const getRoleInfo = (role) => ROLES.find((r) => r.key === role) || ROLES[0];

  const filteredUsers = users.filter((u) => {
    if (filterStatus === "actifs") return !u.disabled;
    if (filterStatus === "desactives") return u.disabled === true;
    return true;
  });

  const activeCount = users.filter((u) => !u.disabled).length;
  const disabledCount = users.filter((u) => u.disabled === true).length;
  const onlineCount = users.filter((u) => u.online).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.accent }]}>
            ← {lbl.retour}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {lbl.titre}
        </Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          [lbl.total, users.length, theme.text],
          [lbl.actifs, activeCount, "#2E7D32"],
          [lbl.desactives, disabledCount, "#E53935"],
          [lbl.enligne, onlineCount, "#64B5F6"],
        ].map(([label, val, color], i) => (
          <View
            key={i}
            style={[styles.statBox, { backgroundColor: theme.card }]}
          >
            <Text style={[styles.statNum, { color }]}>{val}</Text>
            <Text style={[styles.statLabel, { color: theme.textSub }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {[
          ["tous", lbl.tous],
          ["actifs", lbl.actifs],
          ["desactives", lbl.desactives],
        ].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.filterBtn,
              {
                backgroundColor: theme.card,
                borderColor: filterStatus === key ? "#64B5F6" : theme.border,
              },
              filterStatus === key && { backgroundColor: "#64B5F611" },
            ]}
            onPress={() => setFilterStatus(key)}
          >
            <Text
              style={[
                styles.filterBtnText,
                { color: filterStatus === key ? "#64B5F6" : theme.textSub },
                filterStatus === key && { fontWeight: "bold" },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredUsers.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.emptyText, { color: theme.textSub }]}>
              {lbl.aucun}
            </Text>
          </View>
        ) : (
          filteredUsers.map((u) => {
            const roleInfo = getRoleInfo(u.role);
            const isCurrentUser = u.id === currentUser?.uid;
            const isDisabled = u.disabled === true;
            return (
              <View
                key={u.id}
                style={[
                  styles.userCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: isCurrentUser
                      ? "#64B5F6"
                      : isDisabled
                        ? "#E5393544"
                        : theme.border,
                  },
                  isDisabled && { opacity: 0.6 },
                ]}
              >
                <View
                  style={[
                    styles.userAvatar,
                    {
                      backgroundColor: isDisabled
                        ? "#55555533"
                        : roleInfo.color + "33",
                    },
                  ]}
                >
                  <Text style={styles.userAvatarText}>
                    {(u.nom || u.email || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text
                      style={[
                        styles.userName,
                        { color: isDisabled ? theme.textSub : theme.text },
                      ]}
                    >
                      {u.nom || "Sans nom"}
                    </Text>
                    {isCurrentUser && (
                      <Text style={styles.youBadge}>{lbl.vous}</Text>
                    )}
                    {isDisabled ? (
                      <View style={styles.disabledBadge}>
                        <Text style={styles.disabledBadgeText}>Desactive</Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.onlineDot,
                          {
                            backgroundColor: u.online
                              ? "#2E7D32"
                              : theme.border,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[styles.userEmail, { color: theme.textSub }]}
                    numberOfLines={1}
                  >
                    {u.email}
                  </Text>
                  <View
                    style={[
                      styles.rolePill,
                      {
                        backgroundColor: isDisabled
                          ? "#33333322"
                          : roleInfo.color + "22",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rolePillText,
                        { color: isDisabled ? theme.textSub : roleInfo.color },
                      ]}
                    >
                      {roleInfo.label}
                    </Text>
                  </View>
                </View>
                {!isCurrentUser && (
                  <TouchableOpacity
                    style={[styles.actionsBtn, { backgroundColor: theme.bg3 }]}
                    onPress={() => {
                      setSelectedUser(u);
                      setModalActions(true);
                    }}
                  >
                    <Text
                      style={[styles.actionsBtnText, { color: theme.text }]}
                    >
                      ⋮
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Actions */}
      <Modal visible={modalActions} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {selectedUser?.nom || "Utilisateur"}
                </Text>
                <Text style={[styles.modalSub, { color: theme.textSub }]}>
                  {selectedUser?.email}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalActions(false)}>
                <Text style={[styles.modalClose, { color: theme.textSub }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.actionItem,
                { backgroundColor: theme.bg, borderColor: theme.border },
              ]}
              onPress={() => {
                setModalActions(false);
                setTimeout(() => setModalRole(true), 300);
              }}
            >
              <Text style={styles.actionItemIcon}>✏️</Text>
              <View>
                <Text style={[styles.actionItemTitle, { color: theme.text }]}>
                  {lbl.changerRole}
                </Text>
                <Text style={[styles.actionItemSub, { color: theme.textSub }]}>
                  {lbl.roleActuel}: {getRoleInfo(selectedUser?.role).label}
                </Text>
              </View>
            </TouchableOpacity>

            {selectedUser?.disabled ? (
              <TouchableOpacity
                style={[
                  styles.actionItem,
                  { backgroundColor: theme.bg, borderColor: "#2E7D3244" },
                ]}
                onPress={() => handleEnableUser(selectedUser)}
              >
                <Text style={styles.actionItemIcon}>✅</Text>
                <View>
                  <Text style={[styles.actionItemTitle, { color: "#2E7D32" }]}>
                    {lbl.reactiver}
                  </Text>
                  <Text
                    style={[styles.actionItemSub, { color: theme.textSub }]}
                  >
                    {lbl.permettreReconnexion}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.actionItem,
                  { backgroundColor: theme.bg, borderColor: "#F57C0044" },
                ]}
                onPress={() => handleDisableUser(selectedUser)}
              >
                <Text style={styles.actionItemIcon}>🔴</Text>
                <View>
                  <Text style={[styles.actionItemTitle, { color: "#F57C00" }]}>
                    {lbl.desactiver}
                  </Text>
                  <Text
                    style={[styles.actionItemSub, { color: theme.textSub }]}
                  >
                    {lbl.bloquerSans}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.actionItem,
                { backgroundColor: theme.bg, borderColor: "#E5393544" },
              ]}
              onPress={() => handleDeleteUser(selectedUser)}
            >
              <Text style={styles.actionItemIcon}>🗑️</Text>
              <View>
                <Text style={[styles.actionItemTitle, { color: "#E53935" }]}>
                  {lbl.supprimer}
                </Text>
                <Text style={[styles.actionItemSub, { color: theme.textSub }]}>
                  {lbl.bloquerDefinitif}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: "#E5393522" }]}
              onPress={() => setModalActions(false)}
            >
              <Text style={styles.cancelBtnText}>{lbl.fermer}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Role */}
      <Modal visible={modalRole} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {lbl.changerRole}
            </Text>
            <Text
              style={[
                styles.modalSub,
                { color: theme.textSub, marginBottom: 20 },
              ]}
            >
              {selectedUser?.nom || selectedUser?.email}
            </Text>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[
                  styles.roleOption,
                  {
                    backgroundColor: theme.bg,
                    borderColor:
                      selectedUser?.role === r.key ? r.color : theme.border,
                  },
                  selectedUser?.role === r.key && { borderWidth: 2 },
                ]}
                onPress={() => handleChangeRole(selectedUser.id, r.key)}
              >
                <Text style={[styles.roleOptionText, { color: r.color }]}>
                  {r.label}
                </Text>
                {selectedUser?.role === r.key && (
                  <Text style={{ color: r.color, fontSize: 18 }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: "#E5393522" }]}
              onPress={() => setModalRole(false)}
            >
              <Text style={styles.cancelBtnText}>{lbl.annuler}</Text>
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
  backBtn: { width: 70 },
  backText: { fontSize: 16 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginVertical: 12,
    gap: 8,
  },
  statBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "bold" },
  statLabel: { fontSize: 10, marginTop: 2 },
  filterRow: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginBottom: 14,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  filterBtnText: { fontSize: 11 },
  list: { flex: 1, paddingHorizontal: 15 },
  emptyBox: { borderRadius: 14, padding: 30, alignItems: "center" },
  emptyText: { fontSize: 14 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  userInfo: { flex: 1 },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
    flexWrap: "wrap",
  },
  userName: { fontSize: 14, fontWeight: "bold" },
  youBadge: {
    fontSize: 10,
    backgroundColor: "#64B5F622",
    color: "#64B5F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  disabledBadge: {
    backgroundColor: "#E5393522",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  disabledBadgeText: { fontSize: 10, color: "#E53935", fontWeight: "bold" },
  onlineDot: { width: 8, height: 8, borderRadius: 4, marginLeft: "auto" },
  userEmail: { fontSize: 11, marginBottom: 6 },
  rolePill: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  rolePillText: { fontSize: 11, fontWeight: "bold" },
  actionsBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  actionsBtnText: { fontSize: 20, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 2 },
  modalSub: { fontSize: 13 },
  modalClose: { fontSize: 20, padding: 4 },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  actionItemIcon: { fontSize: 24 },
  actionItemTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 2 },
  actionItemSub: { fontSize: 11 },
  roleOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  roleOptionText: { fontSize: 15, fontWeight: "bold" },
  cancelBtn: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },
  cancelBtnText: { color: "#E53935", fontSize: 15, fontWeight: "bold" },
});
