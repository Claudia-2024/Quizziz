// app/get-started-minimal.tsx
import React from "react";
import { View, Text, Image, StyleSheet, useColorScheme, Dimensions, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { BlurView } from 'expo-blur';
import { useTheme } from "@/theme/global";
import Button from "@/components/buttons/button";

const { width, height } = Dimensions.get("window");

export default function GetStartedMinimal() {
  const scheme = useColorScheme();
  const router = useRouter();
  const theme = useTheme();
  const { colors, typography } = theme;

  return (
    <ImageBackground
      source={require('../assets/images/back.jpg')}
      style={styles.background}
    >
      <BlurView intensity={90} style={styles.blurOverlay} tint="light" />

      <View style={styles.container}>
        <View style={styles.topContainer}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.hero}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.primary, fontFamily: typography.fontFamily.italicHeading }]}>
            Welcome to QUIZZIZ!
          </Text>
          <Text style={[styles.subtitle, { color: colors.primary, fontFamily: typography.fontFamily.buttonText }]}>
            Your trusted quiz app.
          </Text>
        </View>

        <View style={styles.bottomContainer}>
          <Button
            title="Get Started"
            onPress={() => router.push("/auth/signup")}
            iconPosition="right"
            icon={require('../assets/icons/Forward.png')}
          />
        </View>
      </View>
    </ImageBackground>
  );
}

export const styles = StyleSheet.create({
  background: {
    flex: 1,
    width,
    height,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  topContainer: {
    alignItems: "center",
  },
  hero: {
    width: width * 0.75,
    height: 300,
    marginBottom: 30,
    borderRadius: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
  },
  bottomContainer: {
    alignItems: "center",
  },
});
