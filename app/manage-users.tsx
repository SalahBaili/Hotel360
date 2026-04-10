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

const ROLES = [
  { key: "admin", label: "👑 Administrateur", color: "#E53935" },
  { key: "manager", label: "📊 Manager", color: "#F57C00" },
  { key: "receptionniste", label: "🛎️ Réceptionniste", color: "#1565C0" },
];

export default function ManageUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(data);
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
      Alert.alert("✅ Rôle mis à jour !");
      setModalVisible(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de modifier le rôle");
    }
  };

  const handleDeleteUser = (userId, userName) => {
    if (userId === currentUser?.uid) {
      Alert.alert("Erreur", "Vous ne pouvez pas supprimer votre propre compte");
      return;
    }
    Alert.alert("Supprimer l'utilisateur", `Supprimer ${userName} ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "users", userId));
            Alert.alert("✅ Utilisateur supprimé");
          } catch (e) {
            Alert.alert("Erreur", "Impossible de supprimer");
          }
        },
      },
    ]);
  };

  const getRoleInfo = (role) => ROLES.find((r) => r.key === role) || ROLES[0];

  const onlineCount = users.filter((u) => u.online).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👥 Utilisateurs</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{users.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: "#2E7D32" }]}>
            {onlineCount}
          </Text>
          <Text style={styles.statLabel}>En ligne</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: "#888" }]}>
            {users.length - onlineCount}
          </Text>
          <Text style={styles.statLabel}>Hors ligne</Text>
        </View>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {users.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
          </View>
        ) : (
          users.map((u) => {
            const roleInfo = getRoleInfo(u.role);
            const isCurrentUser = u.id === currentUser?.uid;
            return (
              <View
                key={u.id}
                style={[styles.userCard, isCurrentUser && styles.userCardSelf]}
              >
                {/* Avatar */}
                <View
                  style={[
                    styles.userAvatar,
                    { backgroundColor: roleInfo.color + "33" },
                  ]}
                >
                  <Text style={styles.userAvatarText}>
                    {(u.nom || u.email || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Infos */}
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>{u.nom || "Sans nom"}</Text>
                    {isCurrentUser && <Text style={styles.youBadge}>Vous</Text>}
                    <View
                      style={[
                        styles.onlineDot,
                        { backgroundColor: u.online ? "#2E7D32" : "#555" },
                      ]}
                    />
                  </View>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {u.email}
                  </Text>
                  <View
                    style={[
                      styles.rolePill,
                      { backgroundColor: roleInfo.color + "22" },
                    ]}
                  >
                    <Text
                      style={[styles.rolePillText, { color: roleInfo.color }]}
                    >
                      {roleInfo.label}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                {!isCurrentUser && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => {
                        setSelectedUser(u);
                        setModalVisible(true);
                      }}
                    >
                      <Text style={styles.editBtnText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteUser(u.id, u.nom || u.email)}
                    >
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal changement de rôle */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Changer le rôle</Text>
            <Text style={styles.modalSub}>
              {selectedUser?.nom || selectedUser?.email}
            </Text>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[
                  styles.roleOption,
                  selectedUser?.role === r.key && {
                    borderColor: r.color,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => handleChangeRole(selectedUser.id, r.key)}
              >
                <Text style={[styles.roleOptionText, { color: r.color }]}>
                  {r.label}
                </Text>
                {selectedUser?.role === r.key && (
                  <Text style={{ color: r.color }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Annuler</Text>
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
  backBtn: { width: 70 },
  backText: { color: "#64B5F6", fontSize: 16 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginBottom: 16,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#1E2D45",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  statNum: { fontSize: 26, fontWeight: "bold", color: "#fff" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 2 },
  list: { flex: 1, paddingHorizontal: 15 },
  emptyBox: {
    backgroundColor: "#1E2D45",
    borderRadius: 14,
    padding: 30,
    alignItems: "center",
  },
  emptyText: { color: "#888", fontSize: 14 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E2D45",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2A3F5F",
    gap: 12,
  },
  userCardSelf: { borderColor: "#64B5F6" },
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
  },
  userName: { fontSize: 14, fontWeight: "bold", color: "#fff" },
  youBadge: {
    fontSize: 10,
    backgroundColor: "#64B5F622",
    color: "#64B5F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, marginLeft: "auto" },
  userEmail: { fontSize: 11, color: "#888", marginBottom: 6 },
  rolePill: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  rolePillText: { fontSize: 11, fontWeight: "bold" },
  actions: { flexDirection: "column", gap: 6 },
  editBtn: {
    backgroundColor: "#1565C022",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  editBtnText: { fontSize: 16 },
  deleteBtn: {
    backgroundColor: "#E5393522",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  deleteBtnText: { fontSize: 16 },
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
    marginBottom: 4,
    textAlign: "center",
  },
  modalSub: {
    fontSize: 13,
    color: "#888",
    marginBottom: 20,
    textAlign: "center",
  },
  roleOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0A1628",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  roleOptionText: { fontSize: 15, fontWeight: "bold" },
  cancelBtn: {
    backgroundColor: "#E5393522",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },
  cancelBtnText: { color: "#E53935", fontSize: 15, fontWeight: "bold" },
});
