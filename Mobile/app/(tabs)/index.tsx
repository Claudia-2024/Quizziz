import { ImageBackground, StyleSheet, Text, View } from "react-native";
import React, { useState, useEffect } from "react";
import FlowerCard, { styles } from "@/components/cards/flowercard";
import { useTheme } from "@/theme/global";
import ResultCard from "@/components/cards/resultCard";
import QuizHeader from "@/components/headers/header";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/config";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { default as BlurView } from "expo-blur";
import React from "react";

const index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const theme = useTheme();
  const [courses, setCourses] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { student } = useAuth();
  const router = useRouter();
  const { typography } = theme;

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const coursesEndpoint = student?.classId
          ? ENDPOINTS.courses.byClass(String(student.classId))
          : ENDPOINTS.courses.list;
        if (!student?.matricule) throw new Error("Missing student matricule");
        const [coursesRes, evalsRes, notifRes] = await Promise.all([
          api.get<any[]>(coursesEndpoint),
          api.get<any[]>(
            ENDPOINTS.evaluations.listByStudent(String(student.matricule))
          ),
          api.get<any[]>(ENDPOINTS.notifications.list),
        ]);
        setCourses(Array.isArray(coursesRes) ? coursesRes : []);
        const normalized = (Array.isArray(evalsRes) ? evalsRes : []).map(
          (e: any, idx: number) => ({
            id: Number(e?.id ?? e?.evaluationId ?? idx),
            status: e?.status,
            type: e?.type,
            courseCode: e?.courseCode,
            courseName: e?.courseName,
            questions: Array.isArray(e?.questions) ? e?.questions : [],
          })
        );
        const publishedOnly = normalized.filter(
          (e: any) => String(e?.status || "").toLowerCase() === "published"
        );
        setEvaluations(publishedOnly);
        setNotifications(Array.isArray(notifRes) ? notifRes : []);
      } catch (e: any) {
        setError(e?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, [student?.classId]);

  return (
    <View style={styles.container}>
      <QuizHeader />

      <ImageBackground
        source={require("../../assets/images/leaf.png")}
        style={styles.background}
        imageStyle={{ borderRadius: 20 }}
      >
        <BlurView intensity={90} tint="dark" style={styles.blurOverlay} />

        <Text
          style={[
            { fontFamily: typography.fontFamily.heading, marginTop: 5 },
            styles.title,
          ]}
        >
          <Text
            style={[
              { fontFamily: typography.fontFamily.italicHeading, marginTop: 5 },
              styles.title,
            ]}
          >
            Hello{" "}
            {[student?.firstName, student?.lastName]
              .filter(Boolean)
              .join(" ") || "there"}
          </Text>
        </Text>
      </ImageBackground>

      <View style={{ alignSelf: "center" }}>
        <FlowerCard />
      </View>

      <Text
        style={[
          { fontFamily: typography.fontFamily.heading, marginTop: 18 },
          styles.title,
        ]}
      >
        Recent Tests
      </Text>
      <ResultCard title="Math for engineers" progress={17} total={20} />
      <ResultCard title="Math for engineers" progress={20} total={20} />
      <ResultCard title="Math for engineers" progress={15} total={20} />
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    backgroundColor: "#f2e6f7",
    flex: 1,
  },
  background: {
    width: 370,
    height: 184,
    overflow: "hidden",
    borderRadius: 20,
  },
  title: {
    marginLeft: 15,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "left",
    marginBottom: 10,
  },
});
