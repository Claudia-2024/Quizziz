import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import QuizHeader from "@/components/headers/header";
import { useTheme } from "@/theme/global";
import { Ionicons } from "@expo/vector-icons";

// Sample data
const STATS_DATA = {
  midterms: {
    message: "You're doing well. Focus on weak areas.",
    average: "60%",
    subjects: [
      { name: "Algebra", score: "12/20" },
      { name: "Trigonometry", score: "10/20" },
      { name: "Geometry", score: "15/20" },
      { name: "Physics", score: "13/20" },
    ],
  },
  normal: {
    message: "Great work! Keep practicing.",
    average: "17.854/20",
    subjects: [
      { name: "Algebra", score: "14/20" },
      { name: "Trigonometry", score: "12/20" },
      { name: "Geometry", score: "16/20" },
      { name: "Physics", score: "15/20" },
    ],
  },
};

// Reusable Modal Component
const CustomModal = ({ visible, onClose, title, children }: any) => {
  const theme = useTheme();
  const { typography } = theme;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <Text style={[styles.modalTitle, { fontFamily: typography.fontFamily.heading }]}>
            {title}
          </Text>
          {children}
          <TouchableOpacity style={styles.modalBtn} onPress={onClose}>
            <Text style={styles.modalBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Reusable Tag Button
const TagButton = ({ title, active, onPress }: any) => {
  const theme = useTheme();
  const { typography, colors } = theme;
  return (
    <TouchableOpacity style={[styles.tag, active && { backgroundColor: colors.secondary }]} onPress={onPress}>
      <Text
        style={{
          fontFamily: typography.fontFamily.body,
          color: active ? "#fff" : colors.primary,
          fontSize: 13,
          fontWeight: "800",
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default function Stats() {
  const theme = useTheme();
  const { colors, typography } = theme;

  const [active, setActive] = useState<"midterms" | "normal">("normal");
  const [avgModal, setAvgModal] = useState(false);
  const [scoresModal, setScoresModal] = useState(false);

  const data = STATS_DATA[active];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <QuizHeader />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* TITLE */}
        <Text style={[styles.pageTitle, { fontFamily: typography.fontFamily.heading }]}>
          Test Statistics
        </Text>

        {/* TOGGLE TAGS */}
        <View style={styles.tagsRow}>
          <TagButton title="Mid Terms" active={active === "midterms"} onPress={() => setActive("midterms")} />
          <TagButton title="Normal Session" active={active === "normal"} onPress={() => setActive("normal")} />
        </View>

        {/* SCORE CARD */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontFamily: typography.fontFamily.heading }]}>
            Average Overall Score
          </Text>

          <View style={styles.scoreRow}>
            <View style={styles.circle}>
              <Text style={[styles.score, { fontFamily: typography.fontFamily.heading }]}>
                {data.subjects.reduce((acc, sub) => acc + parseInt(sub.score.split("/")[0]), 0)}/
                {data.subjects.reduce((acc, sub) => acc + parseInt(sub.score.split("/")[1]), 0)}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.goodJob, { fontFamily: typography.fontFamily.heading }]}>
                {active === "normal" ? "Good Job!" : "Keep Going!"}
              </Text>
              <Text style={[styles.subText, { fontFamily: typography.fontFamily.body }]}>
                {data.message}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.recommendRow} onPress={() => setScoresModal(true)}>
            <Ionicons name="play-circle" size={22} color={colors.secondary} />
            <Text style={[styles.recommendText, { fontFamily: typography.fontFamily.body }]}>
              View All Scores
            </Text>
          </TouchableOpacity>
        </View>

        {/* GRADE SUMMARY */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontFamily: typography.fontFamily.heading }]}>
            Grade Summary
          </Text>

          <View style={styles.chartPlaceholder}>
            <Text style={[styles.chartText, { fontFamily: typography.fontFamily.body }]}>
              📊 {active === "midterms" ? "Midterm" : "Normal"} Performance
            </Text>
          </View>

          <TouchableOpacity style={styles.calculateBtn} onPress={() => setAvgModal(true)}>
            <Text style={[styles.calculateText, { fontFamily: typography.fontFamily.heading }]}>
              Calculate Average
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Average Modal */}
      <CustomModal visible={avgModal} onClose={() => setAvgModal(false)} title="Average Score">
        <Text style={{ fontFamily: typography.fontFamily.body, fontSize: 15, color: "#555", marginBottom: 20 }}>
          Your average score is {data.average}
        </Text>
      </CustomModal>

      {/* All Scores Modal */}
      <CustomModal visible={scoresModal} onClose={() => setScoresModal(false)} title="All Scores">
        <ScrollView style={{ maxHeight: 300, marginBottom: 20 }}>
          {data.subjects.map((sub, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 8,
                borderBottomWidth: 0.5,
                borderBottomColor: "#ccc",
              }}
            >
              <Text style={{ fontFamily: typography.fontFamily.body, fontSize: 15 }}>{sub.name}</Text>
              <Text style={{ fontFamily: typography.fontFamily.body, fontWeight: "700", fontSize: 15 }}>{sub.score}</Text>
            </View>
          ))}
        </ScrollView>
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  pageTitle: { fontSize: 24, fontWeight: "900", marginHorizontal: 15, marginBottom: 10 },
  tagsRow: { flexDirection: "row", gap: 10, marginHorizontal: 15, marginBottom: 15 },
  tag: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: "#eee" },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 18, marginHorizontal: 15, marginBottom: 15, elevation: 4 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 15 },
  circle: { width: 90, height: 90, borderRadius: 45, borderWidth: 8, borderColor: "#7A6CFF", alignItems: "center", justifyContent: "center" },
  score: { fontSize: 16, fontWeight: "800" },
  goodJob: { fontSize: 16, fontWeight: "700", color: "#00A86B" },
  subText: { fontSize: 13, color: "#777", marginTop: 4 },
  recommendRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 15 },
  recommendText: { fontSize: 14, fontWeight: "600", color: "#FF2DA1" },
  chartPlaceholder: { height: 150, backgroundColor: "#F5F5F5", borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 15 },
  chartText: { color: "#999" },
  calculateBtn: { backgroundColor: "#4B1F3B", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  calculateText: { color: "#fff", fontWeight: "700" },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalCard: { width: "85%", backgroundColor: "#fff", borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 10 },
  modalBtn: { backgroundColor: "#4B1F3B", padding: 14, borderRadius: 14, alignItems: "center", marginTop: 10 },
  modalBtnText: { color: "#fff", fontWeight: "700" },
});
