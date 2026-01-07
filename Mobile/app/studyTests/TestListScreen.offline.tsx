// Mobile/app/studyTests/TestListScreen.offline.tsx
/**
 * TestListScreen with offline support
 * Shows evaluations from online or offline storage
 * Allows downloading evaluations for offline use
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import QuizHeader from "@/components/headers/header";
import OfflineIndicator from "@/components/OfflineIndicator";
import SyncStatus from "@/components/SyncStatus";
import { useTheme } from "@/theme/global";
import { useOffline } from "@/context/OfflineContext";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/config";
import ResultCard from "@/components/cards/resultCard";
import { getToken } from "@/lib/storage";

type Evaluation = {
  id: number;
  publishedDate?: string;
  type?: string;
  courseCode?: string;
  courseName?: string;
  status?: string;
  isOffline?: boolean;
  questions?: Array<{
    questionId?: number;
    text?: string;
    choices?: Array<{
      choiceId?: number;
      text?: string;
      order?: number;
      isCorrect?: boolean;
    }>;
  }>;
};

function pickArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

const TestListScreenOffline: React.FC = () => {
  const theme = useTheme();
  const { typography } = theme;
  const {
    isOnline,
    isDownloading,
    downloadEvaluations,
    offlineEvaluations,
    isEvaluationAvailableOffline,
  } = useOffline();

  const [courseFilter, setCourseFilter] = useState("");
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matricule, setMatricule] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  // Load current matricule from token/storage
  useEffect(() => {
    const loadMatricule = async () => {
      try {
        // You may need to decode the JWT or store matricule separately
        // This is a placeholder - adjust based on your auth implementation
        const token = await getToken();
        if (token) {
          // Decode JWT to get matricule, or get from storage
          // setMatricule(decodedMatricule);
        }
      } catch (err) {
        console.error("Error loading matricule:", err);
      }
    };
    loadMatricule();
  }, []);

  const fetchCompleted = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isOnline) {
        // Fetch from server
        const raw = pickArray(
          await api.get<any>(ENDPOINTS.evaluations.revision)
        );
        const normalized: Evaluation[] = raw.map((e: any, idx: number) => ({
          id: Number(e?.id ?? e?.evaluationId ?? idx),
          publishedDate: e?.publishedDate,
          type: e?.type,
          courseCode: e?.courseCode,
          courseName: e?.courseName,
          status: e?.status,
          isOffline: false,
          questions: Array.isArray(e?.questions) ? e.questions : [],
        }));

        const completed = normalized.filter(
          (e) => String(e.status || "").toLowerCase() === "completed"
        );
        const sorted = completed.sort((a, b) => {
          const da = a.publishedDate ? Date.parse(a.publishedDate) : 0;
          const db = b.publishedDate ? Date.parse(b.publishedDate) : 0;
          return db - da;
        });

        if (!mountedRef.current) return;
        setEvaluations(sorted);
      } else {
        // Use offline evaluations
        const offlineEvals: Evaluation[] = offlineEvaluations.map((e) => ({
          id: e.evaluationId,
          publishedDate: e.publishedDate,
          type: e.type,
          courseCode: e.courseCode,
          courseName: e.courseName,
          status: e.status,
          isOffline: true,
          questions: e.questions,
        }));

        if (!mountedRef.current) return;
        setEvaluations(offlineEvals);
      }
    } catch (e: any) {
      if (!mountedRef.current) return;
      setError(e?.message || "Failed to load evaluations");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [isOnline, offlineEvaluations]);

  useEffect(() => {
    fetchCompleted();
  }, [fetchCompleted]);

  const filtered = useMemo(() => {
    const txt = courseFilter.trim().toLowerCase();
    if (!txt) return evaluations;
    return evaluations.filter((e) =>
      String(e.courseCode || "")
        .toLowerCase()
        .includes(txt)
    );
  }, [courseFilter, evaluations]);

  const handleDownloadEvaluations = useCallback(async () => {
    if (!isOnline) {
      Alert.alert("Offline", "You must be online to download evaluations");
      return;
    }

    if (!matricule) {
      Alert.alert("Error", "Unable to determine student ID");
      return;
    }

    try {
      await downloadEvaluations(matricule);
      Alert.alert("Success", "Evaluations downloaded successfully");
      await fetchCompleted();
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to download evaluations: " + (err as Error).message
      );
    }
  }, [isOnline, matricule, downloadEvaluations, fetchCompleted]);

  return (
    <View style={styles.container}>
      <QuizHeader />

      <View style={styles.headerRow}>
        <Text
          style={[
            { fontFamily: theme.typography.fontFamily.heading },
            styles.title,
          ]}
        >
          Past Questions
        </Text>
        <OfflineIndicator isOnline={isOnline} size="small" />
      </View>

      <SyncStatus showDetails={false} />

      {/* Filter by course code */}
      <TextInput
        style={styles.searchBar}
        placeholder="Filter by course code..."
        value={courseFilter}
        onChangeText={setCourseFilter}
        autoCapitalize="characters"
      />

      {/* Download button (when online) */}
      {isOnline && (
        <TouchableOpacity
          style={[
            styles.downloadBtn,
            isDownloading && styles.downloadBtnDisabled,
          ]}
          onPress={handleDownloadEvaluations}
          disabled={isDownloading}
        >
          <Ionicons
            name={isDownloading ? "sync" : "cloud-download"}
            size={16}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.downloadBtnText}>
            {isDownloading ? "Downloading..." : "Download Evaluations"}
          </Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={{ alignItems: "center", padding: 24 }}>
          <ActivityIndicator size="large" color="#4B1F3B" />
          <Text style={{ marginTop: 8 }}>Loading evaluations…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Image
            source={require("../../assets/icons/cancel.png")}
            style={{
              width: 80,
              height: 80,
              marginBottom: 10,
              opacity: 0.85,
            }}
          />
          <Text style={styles.emptyTitle}>
            {isOnline ? "No past questions yet" : "No offline evaluations"}
          </Text>
          {error ? (
            <Text style={styles.emptySubtitle}>{error}</Text>
          ) : (
            <Text style={styles.emptySubtitle}>
              {isOnline
                ? "Download evaluations to get started"
                : "Go online to download evaluations"}
            </Text>
          )}
          <View style={styles.emptyActions}>
            <TouchableOpacity
              style={[styles.primaryBtn, { flex: 1 }]}
              onPress={() => router.push("/(tabs)")}
            >
              <Text style={styles.primaryBtnText}>Go Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { flex: 1, backgroundColor: "#6b2a66" },
              ]}
              onPress={fetchCompleted}
            >
              <Text style={styles.primaryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, idx) => String(item.id ?? idx)}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
            const qCount = Array.isArray(item.questions)
              ? item.questions.length
              : 0;
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/studyTests/TestDetail",
                    params: { evaluationId: String(item.id) },
                  })
                }
                style={{ marginHorizontal: 15, marginBottom: 12 }}
              >
                <ResultCard
                  typeLabel={item.type || "Evaluation"}
                  courseCode={item.courseCode || ""}
                  courseName={item.courseName || ""}
                  progress={qCount}
                  total={qCount}
                />
                {item.isOffline && (
                  <View style={styles.offlineBadge}>
                    <Ionicons name="download-done" size={12} color="#fff" />
                    <Text style={styles.offlineBadgeText}>Offline</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

export default TestListScreenOffline;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7e6f8", paddingTop: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 15,
    marginBottom: 10,
    gap: 10,
  },
  title: { fontSize: 24, fontWeight: "900", flex: 1 },
  searchBar: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    marginHorizontal: 15,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    elevation: 2,
  },
  downloadBtnDisabled: {
    opacity: 0.6,
  },
  downloadBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  offlineBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  offlineBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  emptyState: { alignItems: "center", padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: "#555", marginBottom: 12 },
  emptyActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    paddingHorizontal: 15,
  },
  primaryBtn: {
    backgroundColor: "#FD2A9B",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 6,
  },
  primaryBtnText: { color: "#fff", fontWeight: "bold" },
});
