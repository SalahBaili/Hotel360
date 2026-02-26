import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { auth, db } from '../config/firebase';

export default function SignUpScreen() {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('receptionniste');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const roles = [
    { id: 'admin', label: '👑 Admin' },
    { id: 'receptionniste', label: '🛎️ Récept.' },
    { id: 'manager', label: '📊 Manager' },
  ];

  const handleSignUp = async () => {
    if (!nom || !email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Minimum 6 caractères pour le mot de passe');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: nom });
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        nom, email, role,
        createdAt: new Date().toISOString(),
      });
      router.replace('/dashboard');
    } catch (error) {
      Alert.alert('Erreur', 'Email déjà utilisé ou connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.logo}>🏨</Text>
          <Text style={styles.title}>Hotel 360°</Text>
          <Text style={styles.subtitle}>Créer un compte</Text>
        </View>

        <View style={styles.form}>
          {[
            { icon: '👤', value: nom, setter: setNom, placeholder: 'Nom complet' },
            { icon: '✉️', value: email, setter: setEmail, placeholder: 'Adresse email', keyboard: 'email-address' },
            { icon: '🔒', value: password, setter: setPassword, placeholder: 'Mot de passe', secure: true },
            { icon: '🔒', value: confirmPassword, setter: setConfirmPassword, placeholder: 'Confirmer mot de passe', secure: true },
          ].map((field, index) => (
            <View key={index} style={styles.inputContainer}>
              <Text style={styles.inputIcon}>{field.icon}</Text>
              <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                placeholderTextColor="#999"
                value={field.value}
                onChangeText={field.setter}
                keyboardType={field.keyboard || 'default'}
                autoCapitalize="none"
                secureTextEntry={field.secure || false}
              />
            </View>
          ))}

          <Text style={styles.roleTitle}>Votre rôle :</Text>
          <View style={styles.roleContainer}>
            {roles.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[styles.roleButton, role === r.id && styles.roleButtonActive]}
                onPress={() => setRole(r.id)}
              >
                <Text style={[styles.roleText, role === r.id && styles.roleTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.signupButton, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.signupButtonText}>Créer le compte</Text>
            }
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  header: { paddingTop: 55, paddingBottom: 30, alignItems: 'center' },
  backButton: { position: 'absolute', left: 20, top: 55 },
  backText: { color: '#64B5F6', fontSize: 16 },
  logo: { fontSize: 55, marginBottom: 10 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#fff', letterSpacing: 2 },
  subtitle: { fontSize: 14, color: '#64B5F6', marginTop: 5 },
  form: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 40, borderTopRightRadius: 40,
    padding: 35, paddingTop: 40, minHeight: 550,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F7F8FA', borderRadius: 14,
    paddingHorizontal: 15, marginBottom: 15, height: 58,
    borderWidth: 1, borderColor: '#EFEFEF',
  },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  roleTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, marginTop: 5 },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  roleButton: {
    flex: 1, marginHorizontal: 4, paddingVertical: 12,
    borderRadius: 12, borderWidth: 2, borderColor: '#E0E0E0', alignItems: 'center',
  },
  roleButtonActive: { borderColor: '#1565C0', backgroundColor: '#E3F2FD' },
  roleText: { fontSize: 12, color: '#999', fontWeight: '500' },
  roleTextActive: { color: '#1565C0', fontWeight: 'bold' },
  signupButton: {
    backgroundColor: '#1565C0', borderRadius: 14, height: 58,
    justifyContent: 'center', alignItems: 'center', elevation: 8,
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 10,
  },
  buttonDisabled: { opacity: 0.7 },
  signupButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { color: '#666', fontSize: 15 },
  loginLink: { color: '#1565C0', fontSize: 15, fontWeight: 'bold' },
});