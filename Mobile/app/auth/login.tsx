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
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { useTheme } from "@/theme/global";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/buttons/button";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/config";
import { useAuth } from "@/context/AuthContext";
import type { LoginSuccess } from "@/context/AuthContext";

const { width, height } = Dimensions.get("window");

export default function Login() {
  const router = useRouter();
  const theme = useTheme();
  const { colors, typography } = theme;
  const { setAuthFromLogin } = useAuth();

  const [mat, setMat] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iconColor = "#331424";

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
            {/* Logo */}
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

            {/* Matricule Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="id-card-outline" size={24} color={iconColor} />
              <TextInput
                placeholder="Matricule"
                value={mat}
                onChangeText={setMat}
                style={[{fontFamily: typography.fontFamily.body}, styles.input]}
                keyboardType="email-address"
                placeholderTextColor="#888"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={24} color={iconColor} />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={[{fontFamily: typography.fontFamily.body}, styles.input]}
                placeholderTextColor="#888"
              />
              <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={iconColor}
                />
              </TouchableOpacity>
            </View>

            {error ? (
              <Text style={{ color: 'red',textAlign: 'center', width: '100%' }}>{error}</Text>
            ) : null}
            {/* Login Link */}
            <TouchableOpacity
              onPress={() => router.push("/auth/signup")}
              style={{ marginTop: 16 }}
            >
              <Text style={{ color: colors.primary, fontSize: 16, fontFamily: typography.fontFamily.buttonText }}>
                Create an account? Sign Up.
              </Text>
            </TouchableOpacity>

            <Button
              title={loading ? "Logging in..." : "Login"}
              iconPosition="right"
              icon={require("../../assets/icons/Forward.png")}
              onPress={async () => {
                if (loading) return;
                setError(null);
                setLoading(true);
                try {
                  const res = await api.post<LoginSuccess>(ENDPOINTS.auth.login, {
                    matricule: mat,
                    password,
                  });
                  if (res && res.token) {
                    await setAuthFromLogin(res);
                  }
                  router.push("/(tabs)");
                } catch (e: any) {
                  setError(e?.message || "Login failed");
                } finally {
                  setLoading(false);
                }
              }}
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginVertical: 8,
    height: 50,
    width: "100%",
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
});
