import React, { useEffect, useState } from "react";
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
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { useTheme } from "@/theme/global";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/buttons/button";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/config";

const { width, height } = Dimensions.get("window");

export default function Signup() {
  type ClassItem = { classId: number; level: string; department: string };

  const router = useRouter();
  const theme = useTheme();
  const { colors, typography } = theme;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [matricule, setMatricule] = useState("");
  const [className, setClassName] = useState("");
  const [classId, setClassId] = useState<number | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classesLoading, setClassesLoading] = useState<boolean>(false);
  const [classModalVisible, setClassModalVisible] = useState<boolean>(false);
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iconColor = colors.primary;

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setClassesLoading(true);
        const data = await api.get<any>(ENDPOINTS.classes.list);
        const classes: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.rows)
          ? data.rows
          : [];

        setClasses(classes);
      } catch (e) {
        // silently ignore here; user will still be able to type, and submit will validate
      } finally {
        setClassesLoading(false);
      }
    };
    fetchClasses();
  }, []);

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
                style={[
                  { fontFamily: typography.fontFamily.body },
                  styles.input,
                ]}
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
                style={[
                  { fontFamily: typography.fontFamily.body },
                  styles.input,
                ]}
                placeholderTextColor="#888"
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={24} color={iconColor} />
              <TextInput
                placeholder="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={[
                  { fontFamily: typography.fontFamily.body },
                  styles.input,
                ]}
                keyboardType="phone-pad"
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
                style={[
                  { fontFamily: typography.fontFamily.body },
                  styles.input,
                ]}
                placeholderTextColor="#888"
              />
            </View>

                        {/* Class selector */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="school-outline" size={24} color={iconColor}/>
                            <TouchableOpacity
                                onPress={() => setClassModalVisible(true)}
                                style={[styles.input, {justifyContent: 'center'}]}
                                activeOpacity={0.8}
                            >
                                <Text style={{
                                    color: colors.primary,
                                    fontFamily: typography.fontFamily.body
                                }}>
                                    {classesLoading ? 'Loading classes...' : (className || 'Select Class')}
                                </Text>
                            </TouchableOpacity>
                            <Ionicons name="chevron-down-outline" size={20} color={iconColor}/>
                        </View>

            <Modal
              visible={classModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setClassModalVisible(false)}
            >
              <View style={styles.modalBackdrop}>
                <View
                  style={[styles.modalCard, { backgroundColor: colors.card }]}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      marginBottom: 12,
                      color: colors.text,
                      fontFamily: typography.fontFamily.heading,
                    }}
                  >
                    Select Class
                  </Text>
                  <ScrollView style={{ maxHeight: 300, width: "100%" }}>
                    {classes.map((c, idx) => (
                      <TouchableOpacity
                        key={
                          Number.isFinite(c.classId)
                            ? String(c.classId)
                            : `cls-${idx}`
                        }
                        onPress={() => {
                          setClassId(c.classId);
                          setClassName(`${c.level} ${c.department}`);
                          setClassModalVisible(false);
                        }}
                        style={styles.modalItem}
                      >
                        <Text
                          style={{
                            color: colors.text,
                            fontSize: 16,
                            fontFamily: typography.fontFamily.body,
                          }}
                        >{`${c.level} ${c.department}`}</Text>
                      </TouchableOpacity>
                    ))}
                    {(!classes || classes.length === 0) && (
                      <Text
                        style={{
                          color: "#888",
                          paddingVertical: 8,
                          fontFamily: typography.fontFamily.body,
                        }}
                      >
                        No classes available
                      </Text>
                    )}
                  </ScrollView>
                  <TouchableOpacity
                    onPress={() => setClassModalVisible(false)}
                    style={[styles.modalCloseBtn]}
                  >
                    <Text
                      style={{
                        color: colors.primary,
                        fontFamily: typography.fontFamily.buttonText,
                      }}
                    >
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={24} color={iconColor} />
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={[
                  { fontFamily: typography.fontFamily.body },
                  styles.input,
                ]}
                keyboardType="email-address"
                placeholderTextColor="#888"
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={24}
                color={iconColor}
              />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={[
                  { fontFamily: typography.fontFamily.body },
                  styles.input,
                ]}
                placeholderTextColor="#888"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={iconColor}
                />
              </TouchableOpacity>
            </View>

            {/* Error */}
            {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
            {/* Signup Button */}
            <Button
              title={loading ? "Creating account..." : "Sign Up"}
              iconPosition="right"
              icon={require("../../assets/icons/Forward.png")}
              onPress={async () => {
                if (loading) return;
                setError(null);
                setLoading(true);
                try {
                  // Temporary defaults for fields required by backend
                  if (!classId) {
                    throw new Error("Please select your class");
                  }
                  const payload = {
                    matricule: matricule,
                    email,
                    firstName,
                    lastName,
                    phoneNumber: phoneNumber?.trim() || 0,
                    password,
                    classId: classId,
                    studentCardId:
                      matricule ||
                      "CARD-" + Math.random().toString(36).slice(2, 8),
                  };
                  await api.post(ENDPOINTS.auth.register, payload);
                  // Navigate to login after successful registration
                  router.push("/auth/login");
                } catch (e: any) {
                  setError(e?.message || "Failed to create account");
                } finally {
                  setLoading(false);
                }
              }}
            />

            {/* Login Link */}
            <TouchableOpacity
              onPress={() => router.push("/auth/login")}
              style={{ marginTop: 16 }}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 16,
                  fontFamily: typography.fontFamily.buttonText,
                }}
              >
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
  },
  modalCloseBtn: {
    marginTop: 12,
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
