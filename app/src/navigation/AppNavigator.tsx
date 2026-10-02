import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { colors } from "../theme";
import { useAuth } from "../context/AuthContext";

import BackendUrlSetupScreen from "../components/BackendUrlSetupScreen";
import LanguageSelectScreen from "../components/LanguageSelectScreen";
import LoginScreen from "../components/LoginScreen";
import UserHomeScreen from "../components/UserHomeScreen";
import RecordVideoScreen from "../components/RecordVideoScreen";
import UploadVideoScreen from "../components/UploadVideoScreen";
import AnalysisResultScreen from "../components/AnalysisResultScreen";
import AdminHomeScreen from "../components/AdminHomeScreen";
import SettingsScreen from "../components/SettingsScreen";

import type { UserStackParamList, AdminStackParamList } from "../types";

const UserStack = createNativeStackNavigator<UserStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();

/**
 * Pre-auth screens, in the order they are shown on every launch: the language
 * picker first, then the backend address, then the CNIC login.
 */
type PreAuthStep = "backend" | "language" | "login";

function UserNavigator({ onLogout }: { onLogout: () => void }) {
  return (
    <UserStack.Navigator screenOptions={{ headerShown: false }}>
      <UserStack.Screen name="UserHome" component={UserHomeScreen} />
      <UserStack.Screen
        name="RecordVideo"
        component={RecordVideoScreen}
        options={{ animation: "slide_from_bottom" }}
      />
      <UserStack.Screen
        name="UploadVideo"
        component={UploadVideoScreen}
        options={{ animation: "slide_from_right" }}
      />
      <UserStack.Screen
        name="AnalysisResult"
        component={AnalysisResultScreen}
        options={{ animation: "slide_from_right", gestureEnabled: false }}
      />
      <UserStack.Screen name="Settings">
        {() => <SettingsScreen onLogout={onLogout} />}
      </UserStack.Screen>
    </UserStack.Navigator>
  );
}

function AdminNavigator({ onLogout }: { onLogout: () => void }) {
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminStack.Screen name="AdminHome" component={AdminHomeScreen} />
      <AdminStack.Screen name="Settings">
        {() => <SettingsScreen onLogout={onLogout} />}
      </AdminStack.Screen>
    </AdminStack.Navigator>
  );
}

export default function AppNavigator() {
  const { userType, isLoading } = useAuth();
  // Pre-auth order on every launch: language picker → backend address → CNIC
  // login. Both screens are answered every time; the picks are still persisted,
  // the user just confirms them on each launch.
  const [preAuthStep, setPreAuthStep] = useState<PreAuthStep>("language");

  // A restored session opens the app directly. When a session ends (logout or
  // expiry) the user drops back to the first pre-auth step, the language picker.
  useEffect(() => {
    if (!userType) {
      setPreAuthStep("language");
    }
  }, [userType]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // User is authenticated - show the appropriate navigator
  if (userType) {
    return (
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: colors.primary,
            background: colors.background,
            card: colors.card,
            text: colors.foreground,
            border: colors.cardBorder,
            notification: colors.destructive,
          },
          fonts: {
            regular: { fontFamily: "System", fontWeight: "400" },
            medium: { fontFamily: "System", fontWeight: "500" },
            bold: { fontFamily: "System", fontWeight: "600" },
            heavy: { fontFamily: "System", fontWeight: "700" },
          },
        }}
      >
        {userType === "user" ? (
          <UserNavigator onLogout={() => setPreAuthStep("language")} />
        ) : (
          <AdminNavigator onLogout={() => setPreAuthStep("language")} />
        )}
      </NavigationContainer>
    );
  }

  // Pre-auth flow — the language picker comes first, then the server address,
  // then the CNIC login screen. Both earlier steps run on every launch.
  if (preAuthStep === "language") {
    return (
      <LanguageSelectScreen onComplete={() => setPreAuthStep("backend")} />
    );
  }

  if (preAuthStep === "backend") {
    return (
      <BackendUrlSetupScreen onComplete={() => setPreAuthStep("login")} />
    );
  }

  return <LoginScreen onLoginSuccess={() => setPreAuthStep("language")} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});