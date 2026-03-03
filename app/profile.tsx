import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { signOut, updatePassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../config/firebase";

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const [nom, setNom] = useState(user?.displayName || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [photoUri, setPhotoUri] = useState(user?.photoURL || null);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission refusée",
        "Autorisez l'accès à la galerie dans les paramètres",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      try {
        await updateProfile(user, { photoURL: uri });
        await setDoc(
          doc(db, "users", user.uid),
          { photoURL: uri },
          { merge: true },
        );
        Alert.alert("✅ Photo mise à jour !");
      } catch (error) {
        Alert.alert("Erreur", "Impossible de mettre à jour la photo");
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!nom.trim()) {
      Alert.alert("Erreur", "Le nom ne peut pas être vide");
      return;
    }
    setLoading(true);
    try {
      await updateProfile(user, { displayName: nom });
      await setDoc(doc(db, "users", user.uid), { nom }, { merge: true });
      Alert.alert("✅ Succès", "Profil mis à jour avec succès !");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour le profil");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Erreur", "Remplissez les deux champs");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Erreur", "Minimum 6 caractères");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(user, newPassword);
      Alert.alert("✅ Succès", "Mot de passe mis à jour !");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Reconnectez-vous avant de changer le mot de passe",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnecter",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👤 Profil</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          onPress={handlePickImage}
          style={styles.avatarWrapper}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Text style={{ fontSize: 16 }}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.photoHint}>Appuyer pour changer la photo</Text>
        <Text style={styles.userName}>
          {user?.displayName || "Utilisateur"}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>👑 Admin</Text>
        </View>
      </View>

      {/* Infos compte */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Informations du compte</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📧 Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🆔 ID</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {user?.uid?.substring(0, 16)}...
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📅 Créé le</Text>
          <Text style={styles.infoValue}>
            {user?.metadata?.creationTime
              ? new Date(user.metadata.creationTime).toLocaleDateString("fr-FR")
              : "N/A"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🕐 Dernière connexion</Text>
          <Text style={styles.infoValue}>
            {user?.metadata?.lastSignInTime
              ? new Date(user.metadata.lastSignInTime).toLocaleDateString(
                  "fr-FR",
                )
              : "N/A"}
          </Text>
        </View>
      </View>

      {/* Modifier nom */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✏️ Modifier le nom</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputIcon}>👤</Text>
          <TextInput
            style={styles.input}
            value={nom}
            onChangeText={setNom}
            placeholder="Votre nom"
            placeholderTextColor="#666"
          />
        </View>
        <TouchableOpacity
          style={[styles.btn, styles.btnBlue, loading && styles.btnDisabled]}
          onPress={handleUpdateProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>💾 Sauvegarder</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modifier mot de passe */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 Changer le mot de passe</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Nouveau mot de passe"
            placeholderTextColor="#666"
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.inputIcon}>{showPassword ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirmer mot de passe"
            placeholderTextColor="#666"
            secureTextEntry={!showPassword}
          />
        </View>
        <TouchableOpacity
          style={[styles.btn, styles.btnGreen, loading && styles.btnDisabled]}
          onPress={handleUpdatePassword}
          disabled={loading}
        >
          <Text style={styles.btnText}>🔑 Mettre à jour</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[
          styles.btn,
          {
            backgroundColor: "#1E2D45",
            marginHorizontal: 15,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: "#2A3F5F",
          },
        ]}
        onPress={() => router.push("/settings")}
      >
        <Text style={styles.btnText}>⚙️ Paramètres</Text>
      </TouchableOpacity>

      {/* Déconnexion */}
      <TouchableOpacity
        style={[
          styles.btn,
          styles.btnRed,
          { marginHorizontal: 15, marginBottom: 40 },
        ]}
        onPress={handleLogout}
      >
        <Text style={styles.btnText}>🚪 Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
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
  avatarSection: { alignItems: "center", paddingVertical: 25 },
  avatarWrapper: { position: "relative", marginBottom: 8 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1565C0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#64B5F6",
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#64B5F6",
  },
  avatarText: { fontSize: 40, fontWeight: "bold", color: "#fff" },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#1565C0",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0A1628",
  },
  photoHint: { color: "#64B5F6", fontSize: 12, marginBottom: 10 },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  userEmail: { fontSize: 14, color: "#888", marginBottom: 10 },
  roleBadge: {
    backgroundColor: "#E53935",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  roleText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  section: {
    backgroundColor: "#1E2D45",
    borderRadius: 16,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#64B5F6",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2A3F5F",
  },
  infoLabel: { color: "#888", fontSize: 13 },
  infoValue: {
    color: "#fff",
    fontSize: 13,
    maxWidth: "55%",
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A1628",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    height: 52,
    borderWidth: 1,
    borderColor: "#2A3F5F",
  },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#fff" },
  btn: {
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
  btnBlue: { backgroundColor: "#1565C0" },
  btnGreen: { backgroundColor: "#2E7D32" },
  btnRed: { backgroundColor: "#E53935" },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
