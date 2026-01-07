import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/config";
import { useAuth } from "@/context/AuthContext";

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
          <Text
            style={[
              styles.modalTitle,
              { fontFamily: typography.fontFamily.heading },
            ]}
          >
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
    <TouchableOpacity
      style={[styles.tag, active && { backgroundColor: colors.secondary }]}
      onPress={onPress}
    >
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

type Course = {
  courseCode?: string;
  courseName?: string;
  semesterId?: number | string;
  credit?: number;
};

export default function Stats() {
  const theme = useTheme();
  const { colors, typography } = theme;

  const [active, setActive] = useState<"midterms" | "normal">("normal");
  const [avgModal, setAvgModal] = useState(false);
  const [scoresModal, setScoresModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const { student } = useAuth();

  // Scores modal state
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [scoresError, setScoresError] = useState<string | null>(null);
  const [scores, setScores] = useState<
    Array<{
      evaluationId: number | string;
      courseCode?: string;
      courseName?: string;
      type?: string;
      publishedDate?: string;
      score?: number;
    }>
  >([]);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = student?.classId
        ? ENDPOINTS.courses.byClass(String(student.classId))
        : ENDPOINTS.courses.byStudent;
      const res = await api.get<any>(endpoint);
      const list: Course[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : [];
      if (!mountedRef.current) return;
      setCourses(list);
    } catch (e: any) {
      if (!mountedRef.current) return;
      setError(e?.message || "Failed to load courses");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [student?.classId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const data = STATS_DATA[active];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <QuizHeader />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* TITLE */}
        <Text
          style={[
            styles.pageTitle,
            { fontFamily: typography.fontFamily.heading },
          ]}
        >
          Performance Analytics
        </Text>

        {/* COURSES FOR CONNECTED STUDENT */}
        <View style={styles.card}>
          <Text
            style={[
              styles.cardTitle,
              { fontFamily: typography.fontFamily.heading },
            ]}
          >
            Your Courses
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Ionicons
              name="hand-left-outline"
              size={16}
              color={colors.secondary}
            />
            <Text
              style={{
                fontFamily: typography.fontFamily.body,
                color: "#666",
                fontSize: 12,
              }}
            >
              Tap a course below to view your scores
            </Text>
          </View>
          {loading ? (
            <Text style={{ fontFamily: typography.fontFamily.body }}>
              Loading courses…
            </Text>
          ) : error ? (
            <View>
              <Text style={{ color: "#b00020", marginBottom: 8 }}>{error}</Text>
              <TouchableOpacity
                style={styles.calculateBtn}
                onPress={fetchCourses}
              >
                <Text style={styles.calculateText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : courses.length === 0 ? (
            <Text
              style={{ fontFamily: typography.fontFamily.body, color: "#555" }}
            >
              No courses yet.
            </Text>
          ) : (
            <View>
              {courses.map((c, idx) => (
                <TouchableOpacity
                  key={String(c.courseCode || idx)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  onPress={async () => {
                    const code = String(c.courseCode || "");
                    if (!code) return;
                    setSelectedCourse(code);
                    setScoresModal(true);
                    setScores([]);
                    setScoresError(null);
                    setScoresLoading(true);
                    try {
                      const res = await api.get<any>(
                        ENDPOINTS.responseSheet.byCourseForStudent(code)
                      );
                      const arr = Array.isArray(res)
                        ? res
                        : Array.isArray(res?.data)
                        ? res.data
                        : [];
                      const normalized = arr.map((it: any, i: number) => ({
                        evaluationId: Number(it?.evaluationId ?? it?.id ?? i),
                        courseCode: it?.courseCode,
                        courseName: it?.courseName,
                        type: it?.type,
                        publishedDate: it?.publishedDate,
                        score:
                          typeof it?.score === "number"
                            ? it.score
                            : Number(it?.score || 0),
                      }));
                      if (!mountedRef.current) return;
                      setScores(normalized);
                    } catch (e: any) {
                      if (!mountedRef.current) return;
                      setScoresError(e?.message || "Failed to load scores");
                    } finally {
                      if (mountedRef.current) setScoresLoading(false);
                    }
                  }}
                  style={[
                    styles.courseRow,
                    {
                      borderBottomWidth:
                        idx === courses.length - 1
                          ? 0
                          : StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <View style={styles.courseTexts}>
                    <Text
                      style={[
                        styles.courseCode,
                        { fontFamily: typography.fontFamily.body },
                      ]}
                    >
                      {c.courseCode || "—"}
                    </Text>
                    <Text
                      style={[
                        styles.courseName,
                        { fontFamily: typography.fontFamily.body },
                      ]}
                    >
                      {c.courseName || ""}
                    </Text>
                    <Text
                      style={[
                        styles.courseHint,
                        { fontFamily: typography.fontFamily.body },
                      ]}
                    >
                      View scores
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.secondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* SCORE CARD */}
        <View style={styles.card}>
          <Text
            style={[
              styles.cardTitle,
              { fontFamily: typography.fontFamily.heading },
            ]}
          >
            Average Overall Score
          </Text>

          <View style={styles.scoreRow}>
            <View style={styles.circle}>
              <Text
                style={[
                  styles.score,
                  { fontFamily: typography.fontFamily.heading },
                ]}
              >
                {data.subjects.reduce(
                  (acc, sub) => acc + parseInt(sub.score.split("/")[0]),
                  0
                )}
                /
                {data.subjects.reduce(
                  (acc, sub) => acc + parseInt(sub.score.split("/")[1]),
                  0
                )}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.goodJob,
                  { fontFamily: typography.fontFamily.heading },
                ]}
              >
                {active === "normal" ? "Good Job!" : "Keep Going!"}
              </Text>
              <Text
                style={[
                  styles.subText,
                  { fontFamily: typography.fontFamily.body },
                ]}
              >
                {data.message}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.recommendRow}
            onPress={() => setScoresModal(true)}
          >
            <Ionicons name="play-circle" size={22} color={colors.secondary} />
            <Text
              style={[
                styles.recommendText,
                { fontFamily: typography.fontFamily.body },
              ]}
            >
              View All Scores
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Average Modal */}
      <CustomModal
        visible={avgModal}
        onClose={() => setAvgModal(false)}
        title="Average Score"
      >
        <Text
          style={{
            fontFamily: typography.fontFamily.body,
            fontSize: 15,
            color: "#555",
            marginBottom: 20,
          }}
        >
          Your average score is {data.average}
        </Text>
      </CustomModal>

      {/* All Scores Modal (by selected course) */}
      <CustomModal
        visible={scoresModal}
        onClose={() => {
          setScoresModal(false);
          setSelectedCourse(null);
          setScores([]);
          setScoresError(null);
          setScoresLoading(false);
        }}
        title={selectedCourse ? `All Scores — ${selectedCourse}` : "All Scores"}
      >
        <View style={{ maxHeight: 320, marginBottom: 20 }}>
          {scoresLoading ? (
            <Text style={{ fontFamily: typography.fontFamily.body }}>
              Loading…
            </Text>
          ) : scoresError ? (
            <View>
              <Text style={{ color: "#b00020", marginBottom: 8 }}>
                {scoresError}
              </Text>
              <TouchableOpacity
                style={styles.calculateBtn}
                onPress={async () => {
                  if (!selectedCourse) return;
                  setScoresLoading(true);
                  setScoresError(null);
                  try {
                    const res = await api.get<any>(
                      ENDPOINTS.responseSheet.byCourseForStudent(selectedCourse)
                    );
                    const arr = Array.isArray(res)
                      ? res
                      : Array.isArray(res?.data)
                      ? res.data
                      : [];
                    const normalized = arr.map((it: any, i: number) => ({
                      evaluationId: Number(it?.evaluationId ?? it?.id ?? i),
                      courseCode: it?.courseCode,
                      courseName: it?.courseName,
                      type: it?.type,
                      publishedDate: it?.publishedDate,
                      score:
                        typeof it?.score === "number"
                          ? it.score
                          : Number(it?.score || 0),
                    }));
                    if (!mountedRef.current) return;
                    setScores(normalized);
                  } catch (e: any) {
                    if (!mountedRef.current) return;
                    setScoresError(e?.message || "Failed to load scores");
                  } finally {
                    if (mountedRef.current) setScoresLoading(false);
                  }
                }}
              >
                <Text style={styles.calculateText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : scores.length === 0 ? (
            <Text
              style={{ fontFamily: typography.fontFamily.body, color: "#555" }}
            >
              No scores for this course yet.
            </Text>
          ) : (
            <ScrollView>
              {scores.map((sc, index) => (
                <View
                  key={String(sc.evaluationId ?? index)}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                    borderBottomWidth: 0.5,
                    borderBottomColor: "#ccc",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text
                      style={{
                        fontFamily: typography.fontFamily.body,
                        fontSize: 15,
                      }}
                    >
                      {sc.type || "Evaluation"} — {sc.publishedDate || ""}
                    </Text>
                    <Text
                      style={{
                        fontFamily: typography.fontFamily.body,
                        fontSize: 12,
                        color: "#666",
                        marginTop: 2,
                      }}
                    >
                      {(sc.courseCode || "") +
                        (sc.courseName ? ` — ${sc.courseName}` : "")}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.body,
                      fontWeight: "700",
                      fontSize: 15,
                    }}
                  >
                    {typeof sc.score === "number"
                      ? sc.score
                      : String(sc.score || "0")}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  pageTitle: {
    fontSize: 24,
    fontWeight: "900",
    marginHorizontal: 15,
    marginBottom: 1,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 15,
    marginBottom: 15,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 15 },
  circle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 8,
    borderColor: "#7A6CFF",
    alignItems: "center",
    justifyContent: "center",
  },
  score: { fontSize: 16, fontWeight: "800" },
  goodJob: { fontSize: 16, fontWeight: "700", color: "#00A86B" },
  subText: { fontSize: 13, color: "#777", marginTop: 4 },
  recommendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 15,
  },
  recommendText: { fontSize: 14, fontWeight: "600", color: "#FF2DA1" },
  chartPlaceholder: {
    height: 150,
    backgroundColor: "#F5F5F5",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  chartText: { color: "#999" },
  calculateBtn: {
    backgroundColor: "#4B1F3B",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  calculateText: { color: "#fff", fontWeight: "700" },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomColor: "#eee",
  },
  courseTexts: { flex: 1, paddingRight: 10 },
  courseCode: { fontSize: 14, fontWeight: "700", color: "#222" },
  courseName: { fontSize: 13, color: "#444", marginTop: 2 },
  courseHint: { fontSize: 11, color: "#888", marginTop: 3 },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 10 },
  modalBtn: {
    backgroundColor: "#4B1F3B",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  modalBtnText: { color: "#fff", fontWeight: "700" },
});
