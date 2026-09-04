import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { colors } from "../theme";
import { useAuth } from "../context/AuthContext";
import { isFirstLaunch } from "../store/settings";

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
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isCheckingFirstLaunch, setIsCheckingFirstLaunch] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const first = await isFirstLaunch();
        if (first && !userType) {
          setShowLanguageSelect(true);
        } else if (!userType) {
          setShowLogin(true);
        }
      } catch {
        setShowLogin(true);
      } finally {
        setIsCheckingFirstLaunch(false);
      }
    })();
  }, [userType]);

  if (isLoading || isCheckingFirstLaunch) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // User is authenticated - show the appropriate navigator
  if (userType && !showLanguageSelect && !showLogin) {
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
          <UserNavigator
            onLogout={() => {
              setShowLogin(true);
            }}
          />
        ) : (
          <AdminNavigator
            onLogout={() => {
              setShowLogin(true);
            }}
          />
        )}
      </NavigationContainer>
    );
  }

  // Pre-auth flow
  if (showLanguageSelect) {
    return (
      <LanguageSelectScreen
        onComplete={() => {
          setShowLanguageSelect(false);
          setShowLogin(true);
        }}
      />
    );
  }

  if (showLogin) {
    return (
      <LoginScreen
        onLoginSuccess={() => {
          setShowLogin(false);
        }}
      />
    );
  }

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});