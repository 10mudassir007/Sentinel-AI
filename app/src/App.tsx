import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./context/AuthContext";
import { I18nProvider } from "./context/I18nContext";
import AppNavigator from "./navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}