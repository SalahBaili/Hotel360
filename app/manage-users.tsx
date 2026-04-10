import { useRouter } from "expo-router";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
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
  const [modalRole, setModalRole] = useState(false);
  const [modalActions, setModalActions] = useState(false);
  const [filterStatus, setFilterStatus] = useState("tous");
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
      await setDoc(doc(db, "users", userId), { role: newRole }, { merge: true });
      Alert.alert("✅ Rôle mis à jour !");
      setModalRole(false);
      setModalActions(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de modifier le rôle");
    }
  };

  // ── Désactiver ──
  const handleDisableUser = (user) => {
    if (user.id === currentUser?.uid) {
      Alert.alert("Erreur", "Vous ne pouvez pas désactiver votre propre compte");
      return;
    }
    Alert.alert(
      "🔴 Désactiver le compte",
      `Désactiver ${user.nom || user.email} ?\n\nIl ne pourra plus se connecter.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Désactiver",
          style: "destructive",
          onPress: async () => {
            try {
              await setDoc(doc(db, "users", user.id), { disabled: true }, { merge: true });
              Alert.alert("✅ Compte désactivé");
              setModalActions(false);
            } catch (e) {
              Alert.alert("Erreur", "Impossible de désactiver");
            }
          },
        },
      ]
    );
  };

  // ── Réactiver ──
  const handleEnableUser = async (user) => {
    try {
      await setDoc(doc(db, "users", user.id), { disabled: false, deletePending: false }, { merge: true });
      Alert.alert("✅ Compte réactivé", `${user.nom || user.email} peut maintenant se connecter.`);
      setModalActions(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de réactiver");
    }
  };

  // ── Supprimer définitivement ──
  // On marque le compte comme "à supprimer" + désactivé
  // Au prochain login, le compte Auth se supprime lui-même
  const handleDeleteUser = (user) => {
    if (user.id === currentUser?.uid) {
      Alert.alert("Erreur", "Vous ne pouvez pas supprimer votre propre compte");
      return;
    }
    Alert.alert(
      "🗑️ Supprimer définitivement",
      `Supprimer ${user.nom || user.email} ?\n\n• Le profil sera supprimé immédiatement\n• Le compte sera bloqué\n• Il sera définitivement supprimé au prochain accès`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              // Supprimer le doc Firestore
              await deleteDoc(doc(db, "users", user.id));
              // Créer un doc "blacklist" pour bloquer ce compte même sans profil Firestore
              await setDoc(doc(db, "blacklist", user.id), {
                email: user.email,
                deletedAt: new Date().toISOString(),
                reason: "Supprimé par administrateur",
              });
              Alert.alert("✅ Utilisateur supprimé", "Le compte est bloqué définitivement.");
              setModalActions(false);
            } catch (e) {
              Alert.alert("Erreur", "Impossible de supprimer");
            }
          },
        },
      ]
    );
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👥 Utilisateurs</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{users.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: "#2E7D32" }]}>{activeCount}</Text>
          <Text style={styles.statLabel}>Actifs</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: "#E53935" }]}>{disabledCount}</Text>
          <Text style={styles.statLabel}>Désactivés</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: "#64B5F6" }]}>{onlineCount}</Text>
          <Text style={styles.statLabel}>En ligne</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {["tous", "actifs", "desactives"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filterStatus === f && styles.filterBtnActive]}
            onPress={() => setFilterStatus(f)}
          >
            <Text style={[styles.filterBtnText, filterStatus === f && styles.filterBtnTextActive]}>
              {f === "tous" ? "Tous" : f === "actifs" ? "✅ Actifs" : "🔴 Désactivés"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
          </View>
        ) : (
          filteredUsers.map((u) => {
            const roleInfo = getRoleInfo(u.role);
            const isCurrentUser = u.id === currentUser?.uid;
            const isDisabled = u.disabled === true;

            return (
              <View key={u.id} style={[styles.userCard, isCurrentUser && styles.userCardSelf, isDisabled && styles.userCardDisabled]}>
                <View style={[styles.userAvatar, { backgroundColor: isDisabled ? "#55555533" : roleInfo.color + "33" }]}>
                  <Text style={styles.userAvatarText}>{(u.nom || u.email || "?").charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={[styles.userName, isDisabled && { color: "#555" }]}>{u.nom || "Sans nom"}</Text>
                    {isCurrentUser && <Text style={styles.youBadge}>Vous</Text>}
                    {isDisabled ? (
                      <View style={styles.disabledBadge}><Text style={styles.disabledBadgeText}>🔴 Désactivé</Text></View>
                    ) : (
                      <View style={[styles.onlineDot, { backgroundColor: u.online ? "#2E7D32" : "#555" }]} />
                    )}
                  </View>
                  <Text style={styles.userEmail} numberOfLines={1}>{u.email}</Text>
                  <View style={[styles.rolePill, { backgroundColor: isDisabled ? "#33333322" : roleInfo.color + "22" }]}>
                    <Text style={[styles.rolePillText, { color: isDisabled ? "#555" : roleInfo.color }]}>{roleInfo.label}</Text>
                  </View>
                </View>
                {!isCurrentUser && (
                  <TouchableOpacity style={styles.actionsBtn} onPress={() => { setSelectedUser(u); setModalActions(true); }}>
                    <Text style={styles.actionsBtnText}>⋮</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modal Actions ── */}
      <Modal visible={modalActions} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedUser?.nom || "Utilisateur"}</Text>
                <Text style={styles.modalSub}>{selectedUser?.email}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalActions(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.actionItem} onPress={() => { setModalActions(false); setTimeout(() => setModalRole(true), 300); }}>
              <Text style={styles.actionItemIcon}>✏️</Text>
              <View>
                <Text style={styles.actionItemTitle}>Changer le rôle</Text>
                <Text style={styles.actionItemSub}>Rôle actuel : {getRoleInfo(selectedUser?.role).label}</Text>
              </View>
            </TouchableOpacity>

            {selectedUser?.disabled ? (
              <TouchableOpacity style={[styles.actionItem, { borderColor: "#2E7D3244" }]} onPress={() => handleEnableUser(selectedUser)}>
                <Text style={styles.actionItemIcon}>✅</Text>
                <View>
                  <Text style={[styles.actionItemTitle, { color: "#2E7D32" }]}>Réactiver le compte</Text>
                  <Text style={styles.actionItemSub}>Permettre la reconnexion</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.actionItem, { borderColor: "#F57C0044" }]} onPress={() => handleDisableUser(selectedUser)}>
                <Text style={styles.actionItemIcon}>🔴</Text>
                <View>
                  <Text style={[styles.actionItemTitle, { color: "#F57C00" }]}>Désactiver le compte</Text>
                  <Text style={styles.actionItemSub}>Bloquer sans supprimer</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.actionItem, { borderColor: "#E5393544" }]} onPress={() => handleDeleteUser(selectedUser)}>
              <Text style={styles.actionItemIcon}>🗑️</Text>
              <View>
                <Text style={[styles.actionItemTitle, { color: "#E53935" }]}>Supprimer définitivement</Text>
                <Text style={styles.actionItemSub}>Bloque et supprime le profil</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalActions(false)}>
              <Text style={styles.cancelBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal Rôle ── */}
      <Modal visible={modalRole} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Changer le rôle</Text>
            <Text style={[styles.modalSub, { marginBottom: 20 }]}>{selectedUser?.nom || selectedUser?.email}</Text>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.roleOption, selectedUser?.role === r.key && { borderColor: r.color, borderWidth: 2 }]}
                onPress={() => handleChangeRole(selectedUser.id, r.key)}
              >
                <Text style={[styles.roleOptionText, { color: r.color }]}>{r.label}</Text>
                {selectedUser?.role === r.key && <Text style={{ color: r.color, fontSize: 18 }}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalRole(false)}>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  backBtn: { width: 70 },
  backText: { color: "#64B5F6", fontSize: 16 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  statsRow: { flexDirection: "row", marginHorizontal: 15, marginBottom: 12, gap: 8 },
  statBox: { flex: 1, backgroundColor: "#1E2D45", borderRadius: 12, padding: 12, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  statLabel: { fontSize: 10, color: "#888", marginTop: 2 },
  filterRow: { flexDirection: "row", marginHorizontal: 15, marginBottom: 14, gap: 8 },
  filterBtn: { flex: 1, backgroundColor: "#1E2D45", borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#2A3F5F" },
  filterBtnActive: { borderColor: "#64B5F6", backgroundColor: "#64B5F611" },
  filterBtnText: { fontSize: 11, color: "#888" },
  filterBtnTextActive: { color: "#64B5F6", fontWeight: "bold" },
  list: { flex: 1, paddingHorizontal: 15 },
  emptyBox: { backgroundColor: "#1E2D45", borderRadius: 14, padding: 30, alignItems: "center" },
  emptyText: { color: "#888", fontSize: 14 },
  userCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E2D45", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#2A3F5F", gap: 12 },
  userCardSelf: { borderColor: "#64B5F6" },
  userCardDisabled: { opacity: 0.6, borderColor: "#E5393544" },
  userAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  userAvatarText: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" },
  userName: { fontSize: 14, fontWeight: "bold", color: "#fff" },
  youBadge: { fontSize: 10, backgroundColor: "#64B5F622", color: "#64B5F6", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  disabledBadge: { backgroundColor: "#E5393522", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  disabledBadgeText: { fontSize: 10, color: "#E53935", fontWeight: "bold" },
  onlineDot: { width: 8, height: 8, borderRadius: 4, marginLeft: "auto" },
  userEmail: { fontSize: 11, color: "#888", marginBottom: 6 },
  rolePill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  rolePillText: { fontSize: 11, fontWeight: "bold" },
  actionsBtn: { backgroundColor: "#2A3F5F", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  actionsBtnText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#1E2D45", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 2 },
  modalSub: { fontSize: 13, color: "#888" },
  modalClose: { fontSize: 20, color: "#888", padding: 4 },
  actionItem: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#0A1628", borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#2A3F5F" },
  actionItemIcon: { fontSize: 24 },
  actionItemTitle: { fontSize: 14, fontWeight: "bold", color: "#fff", marginBottom: 2 },
  actionItemSub: { fontSize: 11, color: "#888" },
  roleOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0A1628", borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#2A3F5F" },
  roleOptionText: { fontSize: 15, fontWeight: "bold" },
  cancelBtn: { backgroundColor: "#E5393522", borderRadius: 12, padding: 14, alignItems: "center", marginTop: 4 },
  cancelBtnText: { color: "#E53935", fontSize: 15, fontWeight: "bold" },
});
