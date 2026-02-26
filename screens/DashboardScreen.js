import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function DashboardScreen({ navigation }) {
  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🏨</Text>
      <Text style={styles.title}>Hotel 360°</Text>
      <Text style={styles.subtitle}>Dashboard — Bientôt disponible</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628', justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 70, marginBottom: 15 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: 2 },
  subtitle: { fontSize: 14, color: '#64B5F6', marginTop: 8, marginBottom: 40 },
  logoutButton: { backgroundColor: '#E53935', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 12 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});