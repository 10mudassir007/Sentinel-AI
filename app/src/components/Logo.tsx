import React from "react";
import { Image, StyleSheet, View } from "react-native";

interface LogoProps {
  size?: number;
}

export function Logo({ size = 80 }: LogoProps) {
  const borderRadius = size * 0.28;

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius },
      ]}
    >
      <Image
        source={require("../../assets/logo.png")}
        style={{ width: size, height: size, borderRadius }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});