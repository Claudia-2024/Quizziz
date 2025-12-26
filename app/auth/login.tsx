import React, { useState } from "react";
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { useTheme } from "@/theme/global";
import InputField from "@/components/inputs/inputField";
import Button from "@/components/buttons/button";

const { width, height } = Dimensions.get("window");

export default function Login() {
  const router = useRouter();
  const theme = useTheme();
  const { colors, typography } = theme;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <ImageBackground
      source={require("../../assets/images/back.jpg")}
      style={styles.background}
    >
      <BlurView intensity={90} style={styles.blurOverlay} tint="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.centerContainer}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
            />

            <Text
              style={[
                styles.text,
                {
                  color: colors.secondary,
                  fontFamily: typography.fontFamily.italicHeading,
                },
              ]}
            >
              LOGIN
            </Text>

            <InputField
              placeholder="Email"
              icon={require("../../assets/icons/email.png")}
              value={email}
              onChangeText={setEmail}
            />

            <InputField
              placeholder="Password"
              icon={require("../../assets/icons/lock.png")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button
              title="Login"
              iconPosition="right"
              icon={require("../../assets/icons/Forward.png")}
              onPress={() => router.push("/(tabs)")}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  background: {
    flex: 1,
    width,
    height,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  centerContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  logo: {
    width: 154,
    height: 223,
    marginBottom: 10,
  },
  text: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 20,
  },
});
