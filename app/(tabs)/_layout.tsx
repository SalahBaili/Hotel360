import { Tabs } from "expo-router";
import React from "react";
import { Text } from "react-native";
import { useApp } from "../../context/AppContext";

export default function TabLayout() {
  const { theme } = useApp();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#64B5F6",
        tabBarInactiveTintColor: theme.textSub,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? "🏨" : "🏩"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alertes",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? "🚨" : "🔔"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historique",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? "📊" : "📈"}</Text>
          ),
        }}
      />
    </Tabs>
  );
}
