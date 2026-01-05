// studyTests/TestListScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import QuizHeader from '@/components/headers/header';
import { useTheme } from '@/theme/global';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/config';
import ResultCard from '@/components/cards/resultCard';

type Evaluation = {
  id: number;
  publishedDate?: string;
  type?: string;
  courseCode?: string;
  courseName?: string;
  status?: string; // published | completed | ...
  questions?: Array<{
    questionId?: number;
    text?: string;
    choices?: Array<{ choiceId?: number; text?: string; order?: number; isCorrect?: boolean }>;
  }>;
};

function pickArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

const TestListScreen: React.FC = () => {
  const theme = useTheme();
  const { typography } = theme;

  const [courseFilter, setCourseFilter] = useState('');
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const fetchCompleted = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = pickArray(await api.get<any>(ENDPOINTS.evaluations.revision));
      const normalized: Evaluation[] = raw.map((e: any, idx: number) => ({
        id: Number(e?.id ?? e?.evaluationId ?? idx),
        publishedDate: e?.publishedDate,
        type: e?.type,
        courseCode: e?.courseCode,
        courseName: e?.courseName,
        status: e?.status,
        questions: Array.isArray(e?.questions) ? e.questions : [],
      }));
      const completed = normalized.filter((e) => String(e.status || '').toLowerCase() === 'completed');
      const sorted = completed.sort((a, b) => {
        const da = a.publishedDate ? Date.parse(a.publishedDate) : 0;
        const db = b.publishedDate ? Date.parse(b.publishedDate) : 0;
        return db - da; // newest first
      });
      if (!mountedRef.current) return;
      setEvaluations(sorted);
    } catch (e: any) {
      if (!mountedRef.current) return;
      setError(e?.message || 'Failed to load past questions');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompleted();
  }, [fetchCompleted]);

  const filtered = useMemo(() => {
    const txt = courseFilter.trim().toLowerCase();
    if (!txt) return evaluations;
    return evaluations.filter((e) => String(e.courseCode || '').toLowerCase().includes(txt));
  }, [courseFilter, evaluations]);

  return (
    <View style={styles.container}>
      <QuizHeader />
      <Text style={[{ fontFamily: typography.fontFamily.heading }, styles.title]}>Past Questions</Text>

      {/* Filter by course code */}
      <TextInput
        style={styles.searchBar}
        placeholder="Filter by course code..."
        value={courseFilter}
        onChangeText={setCourseFilter}
        autoCapitalize="characters"
      />

      {loading ? (
        <View style={{ alignItems: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#4B1F3B" />
          <Text style={{ marginTop: 8 }}>Loading past questions…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Image source={require('../../assets/icons/process.png')} style={{ width: 80, height: 80, marginBottom: 10, opacity: 0.85 }} />
          <Text style={styles.emptyTitle}>No past questions yet</Text>
          {error ? (
            <Text style={styles.emptySubtitle}>{error}</Text>
          ) : (
            <Text style={styles.emptySubtitle}>Try another course code or retry.</Text>
          )}
          <View style={styles.emptyActions}>
            <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.primaryBtnText}>Go Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryBtn, { flex: 1, backgroundColor: '#6b2a66' }]} onPress={fetchCompleted}>
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
            const qCount = Array.isArray(item.questions) ? item.questions.length : 0;
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/studyTests/TestDetail', params: { evaluationId: String(item.id) } })}
                style={{ marginHorizontal: 15, marginBottom: 12 }}
              >
                <ResultCard
                  typeLabel={item.type || 'Evaluation'}
                  courseCode={item.courseCode || ''}
                  courseName={item.courseName || ''}
                  progress={qCount}
                  total={qCount}
                />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

export default TestListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7e6f8', paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '900', marginHorizontal: 15, marginBottom: 10 },
  searchBar: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  emptyState: { alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#555', marginBottom: 12 },
  emptyActions: { flexDirection: 'row', gap: 12, width: '100%', paddingHorizontal: 15 },
  primaryBtn: { backgroundColor: '#4B1F3B', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 6 },
  primaryBtnText: { color: '#fff', fontWeight: 'bold' },
});
