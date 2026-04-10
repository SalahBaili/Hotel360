import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { auth } from "../config/firebase";

export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(tabs)";
    const inLogin = segments[0] === "login" || segments[0] === "signup";

    if (!user && !inLogin) {
      // ✅ Pas connecté → aller au login sans possibilité de retour
      router.replace("/login");
    } else if (user && inLogin) {
      // ✅ Connecté → aller au dashboard sans possibilité de retour
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A1628", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#64B5F6" size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ gestureEnabled: false }} />
      <Stack.Screen name="signup" options={{ gestureEnabled: true }} />
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
      <Stack.Screen name="profile" options={{ gestureEnabled: true }} />
      <Stack.Screen name="settings" options={{ gestureEnabled: true }} />
      <Stack.Screen name="zone-detail" options={{ gestureEnabled: true }} />
      <Stack.Screen name="chambre-detail" options={{ gestureEnabled: true }} />
      <Stack.Screen name="manage-users" options={{ gestureEnabled: true }} />
      <Stack.Screen name="manage-zones" options={{ gestureEnabled: true }} />
      <Stack.Screen name="manager" options={{ gestureEnabled: true }} />
      <Stack.Screen name="receptionniste" options={{ gestureEnabled: true }} />
    </Stack>
  );
}
