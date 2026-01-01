import { router } from "expo-router";
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";

export default function QuizHeader() {
  return (
    <View style={styles.container}>
      {/* Left Side */}
      <View style={styles.left}>
        <Image
          source={require("../../assets/images/logo.png")} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Quizziz</Text>
      </View>

      {/* Right Side */}
      <View style={styles.right}>
        <Image
          source={require("../../assets/icons/pro.png")} // user image
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.bellButton} onPress={() => router.push("/notifications/page")}>
          <Image
            source={require("../../assets/icons/notification.png")}
            style={styles.bellIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  logo: {
    width: 40,
    height: 40,
  },

  title: {
    fontSize: 20,
    fontWeight: "600",
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#431F3D",
    justifyContent: "center",
    alignItems: "center",
  },

  bellIcon: {
    width: 30,
    height: 30,
    tintColor: "white",
  },
});
