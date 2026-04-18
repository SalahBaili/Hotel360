import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { signOut, updatePassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../config/firebase";
import { useApp } from "../context/AppContext";

const { width: W, height: H } = Dimensions.get("window");

const ROLE_CONFIG = {
  admin: { label: "Administrateur", color: "#E53935", bg: "#E5393522" },
  manager: { label: "Manager", color: "#F57C00", bg: "#F57C0022" },
  receptionniste: {
    label: "Receptionniste",
    color: "#1565C0",
    bg: "#1565C022",
  },
};

async function uploadImageToImgur(originalUri: string): Promise<string> {
  const cacheUri = FileSystem.cacheDirectory + "profile_upload.jpg";
  await FileSystem.copyAsync({ from: originalUri, to: cacheUri });
  const formData = new FormData();
  formData.append("image", {
    uri: cacheUri,
    type: "image/jpeg",
    name: "profile_upload.jpg",
  } as any);
  const response = await fetch("https://api.imgur.com/3/image", {
    method: "POST",
    headers: { Authorization: "Client-ID 546c25a59c58ad7" },
    body: formData,
  });
  const data = await response.json();
  if (data.success) return data.data.link;
  throw new Error("Imgur: " + JSON.stringify(data));
}

export default function ProfileScreen() {
  const router = useRouter();
  const { t, theme, isRTL, lang, setGlobalPhotoURL } = useApp();
  const user = auth.currentUser;
  const [nom, setNom] = useState(user?.displayName || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [role, setRole] = useState("admin");
  // Viewer inline — pas de Modal
  const [viewerVisible, setViewerVisible] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.role) setRole(data.role);
          if (data.photoURL?.startsWith("http")) setPhotoUri(data.photoURL);
          else if (user.photoURL?.startsWith("http"))
            setPhotoUri(user.photoURL);
        }
      } catch (e) {}
    };
    loadProfile();
    // Pré-charger permission galerie pour éviter délai
    ImagePicker.requestMediaLibraryPermissionsAsync();
  }, []);

  const roleInfo = ROLE_CONFIG[role] || ROLE_CONFIG.admin;

  const pickFromGallery = async () => {
    // Fermer viewer d'abord si ouvert
    setViewerVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission refusee",
        "Autorisez l'acces a la galerie dans Reglages",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (result.canceled) return;
    setPhotoLoading(true);
    try {
      const uri = result.assets[0].uri;
      const downloadURL = await uploadImageToImgur(uri);
      setPhotoUri(downloadURL);
      setGlobalPhotoURL(downloadURL);
      await setDoc(
        doc(db, "users", user.uid),
        { photoURL: downloadURL },
        { merge: true },
      );
      try {
        await updateProfile(user, { photoURL: downloadURL });
      } catch (_) {}
      Alert.alert("Photo mise a jour !");
    } catch (e) {
      console.log("Photo error:", e);
      Alert.alert("Erreur", "Impossible de mettre a jour la photo");
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleAvatarPress = () => {
    if (photoUri) {
      setViewerVisible(true);
    } else {
      pickFromGallery();
    }
  };

  const handleUpdateProfile = async () => {
    if (!nom.trim()) {
      Alert.alert("Erreur", "Le nom ne peut pas etre vide");
      return;
    }
    setLoading(true);
    try {
      await updateProfile(user, { displayName: nom });
      await setDoc(doc(db, "users", user.uid), { nom }, { merge: true });
      Alert.alert("Profil mis a jour !");
    } catch (e) {
      Alert.alert("Erreur", "Impossible");
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
      Alert.alert("Erreur", "Minimum 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(user, newPassword);
      Alert.alert("Mot de passe mis a jour !");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      Alert.alert("Erreur", "Reconnectez-vous d'abord");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Deconnexion", "Voulez-vous vraiment vous deconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Deconnecter",
        style: "destructive",
        onPress: async () => {
          setGlobalPhotoURL(null);
          await signOut(auth);
          router.replace("/login");
        },
      },
    ]);
  };

  const viewerLabel =
    lang === "ar"
      ? "تغيير الصورة"
      : lang === "en"
        ? "Change photo"
        : "Modifier la photo";
  const fermerLabel =
    lang === "ar" ? "اغلاق" : lang === "en" ? "Close" : "Fermer";

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View
          style={[
            styles.header,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Text style={{ color: theme.accent, fontSize: 16 }}>
              {t("retour")}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t("profil")}
          </Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={handleAvatarPress}
            style={styles.avatarWrapper}
            disabled={photoLoading}
          >
            {photoLoading ? (
              <View style={[styles.avatar, { backgroundColor: "#1565C0" }]}>
                <ActivityIndicator color="#64B5F6" size="large" />
              </View>
            ) : photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: "#1565C0" }]}>
                <Text style={styles.avatarText}>
                  {user?.displayName?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Text style={{ fontSize: 16 }}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={{ color: theme.accent, fontSize: 12, marginBottom: 10 }}>
            {t("appuyer_photo")}
          </Text>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: theme.text,
              marginBottom: 4,
            }}
          >
            {user?.displayName || "Utilisateur"}
          </Text>
          <Text
            style={{ fontSize: 14, color: theme.textSub, marginBottom: 10 }}
          >
            {user?.email}
          </Text>
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor: roleInfo.bg,
                borderColor: roleInfo.color,
                borderWidth: 1,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "bold",
                color: roleInfo.color,
              }}
            >
              {roleInfo.label}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            {t("informations_compte")}
          </Text>
          {[
            ["Email", user?.email],
            ["Role", roleInfo.label],
            ["ID", (user?.uid?.substring(0, 16) || "") + "..."],
            [
              "Cree le",
              user?.metadata?.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString(
                    "fr-FR",
                  )
                : "N/A",
            ],
            [
              "Derniere connexion",
              user?.metadata?.lastSignInTime
                ? new Date(user.metadata.lastSignInTime).toLocaleDateString(
                    "fr-FR",
                  )
                : "N/A",
            ],
          ].map(([label, value], i) => (
            <View
              key={i}
              style={[
                styles.infoRow,
                {
                  borderBottomColor: theme.border,
                  flexDirection: isRTL ? "row-reverse" : "row",
                },
              ]}
            >
              <Text style={{ color: theme.textSub, fontSize: 13 }}>
                {label}
              </Text>
              <Text
                style={{
                  color: i === 1 ? roleInfo.color : theme.text,
                  fontSize: 13,
                  maxWidth: "55%",
                  textAlign: "right",
                }}
                numberOfLines={1}
              >
                {value}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            {t("modifier_nom")}
          </Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.inputBg, borderColor: theme.border },
            ]}
          >
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={nom}
              onChangeText={setNom}
              placeholder="Votre nom"
              placeholderTextColor={theme.textSub}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: "#1565C0" },
              loading && { opacity: 0.6 },
            ]}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{t("sauvegarder")}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            {t("changer_mdp")}
          </Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.inputBg, borderColor: theme.border },
            ]}
          >
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nouveau mot de passe"
              placeholderTextColor={theme.textSub}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={{ fontSize: 18 }}>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.inputBg, borderColor: theme.border },
            ]}
          >
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmer mot de passe"
              placeholderTextColor={theme.textSub}
              secureTextEntry={!showPassword}
            />
          </View>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#2E7D32" }]}
            onPress={handleUpdatePassword}
          >
            <Text style={styles.btnText}>{t("mettre_a_jour")}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.btn,
            {
              backgroundColor: theme.card,
              marginHorizontal: 15,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: theme.border,
            },
          ]}
          onPress={() => router.push("/settings")}
        >
          <Text style={[styles.btnText, { color: theme.text }]}>
            {t("parametres")}
          </Text>
        </TouchableOpacity>

        {role === "admin" && (
          <TouchableOpacity
            style={[
              styles.btn,
              {
                backgroundColor: "#7B1FA2",
                marginHorizontal: 15,
                marginBottom: 10,
              },
            ]}
            onPress={() => router.push("/manage-users")}
          >
            <Text style={styles.btnText}>{t("gerer_users")}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.btn,
            {
              backgroundColor: "#E53935",
              marginHorizontal: 15,
              marginBottom: 40,
            },
          ]}
          onPress={handleLogout}
        >
          <Text style={styles.btnText}>{t("deconnecter")}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ✅ VIEWER inline — pas de Modal, pas de setTimeout */}
      {viewerVisible && (
        <View style={styles.viewerOverlay}>
          {/* Fond cliquable pour fermer */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={() => setViewerVisible(false)}
          />

          {/* Photo */}
          <Image
            source={{ uri: photoUri }}
            style={styles.viewerImage}
            resizeMode="cover"
          />

          {/* Nom + email */}
          <View style={styles.viewerInfo}>
            <Text style={styles.viewerName}>
              {user?.displayName || "Profil"}
            </Text>
            <Text style={styles.viewerEmail}>{user?.email}</Text>
          </View>

          {/* Bouton fermer */}
          <TouchableOpacity
            style={styles.viewerClose}
            onPress={() => setViewerVisible(false)}
          >
            <Text style={styles.viewerCloseText}>✕</Text>
          </TouchableOpacity>

          {/* ✅ Bouton modifier — appelle pickFromGallery directement */}
          <TouchableOpacity
            style={styles.viewerChangeBtn}
            onPress={pickFromGallery}
          >
            <Text style={styles.viewerChangeBtnText}>📷 {viewerLabel}</Text>
          </TouchableOpacity>

          {/* Bouton fermer bas */}
          <TouchableOpacity
            style={styles.viewerCloseBtn}
            onPress={() => setViewerVisible(false)}
          >
            <Text style={styles.viewerCloseBtnText}>{fermerLabel}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: { width: 70 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  avatarSection: { alignItems: "center", paddingVertical: 25 },
  avatarWrapper: { position: "relative", marginBottom: 8 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  roleBadge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  section: {
    borderRadius: 16,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 15 },
  infoRow: {
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    height: 52,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15 },
  btn: {
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  // Viewer inline (pas de Modal)
  viewerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: W,
    height: H,
    backgroundColor: "rgba(0,0,0,0.93)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  viewerClose: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "#ffffff22",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  viewerCloseText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  viewerImage: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 4,
    borderColor: "#64B5F6",
  },
  viewerInfo: { marginTop: 24, alignItems: "center" },
  viewerName: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  viewerEmail: { color: "#888", fontSize: 14, marginTop: 4 },
  viewerChangeBtn: {
    marginTop: 40,
    backgroundColor: "#1565C0",
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  viewerChangeBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  viewerCloseBtn: {
    marginTop: 12,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: "#ffffff11",
  },
  viewerCloseBtnText: { color: "#888", fontSize: 15 },
});
