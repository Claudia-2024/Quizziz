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

const { width, height } = Dimensions.get("window");

export default function Signup() {
  const router = useRouter();
  const theme = useTheme();
  const { colors, typography } = theme;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [matricule, setMatricule] = useState("");
  const [className, setClassName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const iconColor = colors.primary;

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
              SIGN UP
            </Text>

            {/* First Name */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={24} color={iconColor} />
              <TextInput
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                style={[{fontFamily: typography.fontFamily.body}, styles.input]}
                placeholderTextColor="#888"
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-add-outline" size={24} color={iconColor} />
              <TextInput
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                style={[{fontFamily: typography.fontFamily.body}, styles.input]}
                placeholderTextColor="#888"
              />
            </View>

            {/* Matricule */}
            <View style={styles.inputContainer}>
              <Ionicons name="id-card-outline" size={24} color={iconColor} />
              <TextInput
                placeholder="Matricule"
                value={matricule}
                onChangeText={setMatricule}
                style={[{fontFamily: typography.fontFamily.body}, styles.input]}
                placeholderTextColor="#888"
              />
            </View>

            {/* Class */}
            <View style={styles.inputContainer}>
              <Ionicons name="school-outline" size={24} color={iconColor} />
              <TextInput
                placeholder="Class"
                value={className}
                onChangeText={setClassName}
                style={[{fontFamily: typography.fontFamily.body}, styles.input]}
                placeholderTextColor="#888"
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={24} color={iconColor} />
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={[{fontFamily: typography.fontFamily.body}, styles.input]}
                keyboardType="email-address"
                placeholderTextColor="#888"
              />
            </View>

            {/* Password */}
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

            {/* Signup Button */}
            <Button
              title="Sign Up"
              iconPosition="right"
              icon={require("../../assets/icons/Forward.png")}
              onPress={() => router.push("/(tabs)")}
            />

            {/* Login Link */}
            <TouchableOpacity
              onPress={() => router.push("/auth/login")}
              style={{ marginTop: 16 }}
            >
              <Text style={{ color: colors.primary, fontSize: 16, fontFamily: typography.fontFamily.buttonText }}>
                Already have an account? Login.
              </Text>
            </TouchableOpacity>
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
    gap: 12, 
  },
  logo: {
    width: 80, 
    height: 120, 
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
    marginVertical: 4, // reduced space between inputs
    height: 50,
    width: "100%",
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
});
