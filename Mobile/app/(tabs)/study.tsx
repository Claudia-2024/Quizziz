import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { router } from "expo-router";
import QuizHeader from "@/components/headers/header";
import { useTheme } from "@/theme/global";

const study = () => {
  const theme = useTheme();
  const { typography } = theme;
  return (
    <View style={styles.container}>
      <QuizHeader />

      <Text
        style={[{ fontFamily: typography.fontFamily.heading }, styles.title]}
      >
        Study Time!
      </Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/studyTests/TestListScreen")}
      >
        <Image
          style={styles.image}
          source={require("../../assets/images/books.png")}
        />
        <Text
          style={[
            { fontFamily: typography.fontFamily.heading },
            styles.cardText,
          ]}
        >
          Past Questions
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default study;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, backgroundColor: "#f2e6f7" },
  title: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 20,
    marginLeft: 15,
    marginRight: 15,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 3,
    marginLeft: 15,
    marginRight: 15,
  },
  image: { height: 79, width: 79 },
  cardText: { fontSize: 18, marginLeft: 15, fontWeight: "600" },
});
