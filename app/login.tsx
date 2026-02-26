import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth } from '../config/firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/dashboard');
    } catch (error) {
      Alert.alert('Erreur', 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>🏨</Text>
        <Text style={styles.title}>Hotel 360°</Text>
        <Text style={styles.subtitle}>Système de Gestion Intelligent</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Connexion</Text>
        <Text style={styles.formSubtitle}>Bienvenue, connectez-vous pour continuer</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputIcon}>✉️</Text>
          <TextInput
            style={styles.input}
            placeholder="Adresse email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.inputIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.loginButtonText}>Se connecter</Text>
          }
        </TouchableOpacity>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Pas encore de compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.signupLink}>S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  header: { flex: 0.38, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  logo: { fontSize: 65, marginBottom: 12 },
  title: { fontSize: 34, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 3 },
  subtitle: { fontSize: 13, color: '#64B5F6', marginTop: 6, letterSpacing: 1 },
  form: {
    flex: 0.62, backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40, borderTopRightRadius: 40,
    padding: 35, paddingTop: 40,
  },
  formTitle: { fontSize: 26, fontWeight: 'bold', color: '#0A1628', marginBottom: 6 },
  formSubtitle: { fontSize: 14, color: '#999', marginBottom: 30 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F7F8FA', borderRadius: 14,
    paddingHorizontal: 15, marginBottom: 15, height: 58,
    borderWidth: 1, borderColor: '#EFEFEF',
  },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 25 },
  forgotText: { color: '#1565C0', fontSize: 14, fontWeight: '500' },
  loginButton: {
    backgroundColor: '#1565C0', borderRadius: 14, height: 58,
    justifyContent: 'center', alignItems: 'center', elevation: 8,
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 10,
  },
  buttonDisabled: { opacity: 0.7 },
  loginButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  signupText: { color: '#666', fontSize: 15 },
  signupLink: { color: '#1565C0', fontSize: 15, fontWeight: 'bold' },
});