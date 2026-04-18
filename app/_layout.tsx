import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { auth } from "../config/firebase";
import { AppProvider } from "../context/AppContext";

function AuthGate({ children }: { children: React.ReactNode }) {
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
    const inLogin = segments[0] === "login" || segments[0] === "signup";
    if (!user && !inLogin) {
      router.replace("/login");
    } else if (user && inLogin) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0A1628",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color="#64B5F6" size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AppProvider>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ gestureEnabled: false }} />
          <Stack.Screen name="signup" options={{ gestureEnabled: true }} />
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          <Stack.Screen name="profile" options={{ gestureEnabled: true }} />
          <Stack.Screen name="settings" options={{ gestureEnabled: true }} />
          <Stack.Screen name="zone-detail" options={{ gestureEnabled: true }} />
          <Stack.Screen
            name="chambre-detail"
            options={{ gestureEnabled: true }}
          />
          <Stack.Screen
            name="manage-users"
            options={{ gestureEnabled: true }}
          />
          <Stack.Screen
            name="manage-zones"
            options={{ gestureEnabled: true }}
          />
          <Stack.Screen name="manager" options={{ gestureEnabled: true }} />
          <Stack.Screen
            name="receptionniste"
            options={{ gestureEnabled: true }}
          />
        </Stack>
      </AuthGate>
    </AppProvider>
  );
}
