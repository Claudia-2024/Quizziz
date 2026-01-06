// Mobile/app/studyTests/TestDetail.offline.tsx
/**
 * Example of offline-enabled TestDetail component
 * Shows how to integrate offline functionality
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QuizHeader from '@/components/headers/header';
import OfflineIndicator from '@/components/OfflineIndicator';
import SyncStatus from '@/components/SyncStatus';
import { useTheme } from '@/theme/global';
import { useOffline } from '@/context/OfflineContext';
import { api } from '@/lib/api';
import { apiWithOffline } from '@/lib/api-offline';
import { ENDPOINTS } from '@/lib/config';
import {
  getOfflineEvaluation,
  createOfflineAttempt,
  saveOfflineAnswer,
  getOfflineAnswers,
  markOfflineAttemptSubmitted,
} from '@/lib/offline/offlineService';

type Choice = { choiceId?: number; text?: string; order?: number; isCorrect?: boolean };
type EvalQuestion = { questionId?: number; text?: string; choices?: Choice[] };
type Evaluation = {
  id: number;
  evaluationId?: number;
  type?: string;
  courseCode?: string;
  courseName?: string;
  questions?: EvalQuestion[];
};

function pickArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

export default function TestDetailOffline() {
  const { typography, colors } = useTheme();
  const { evaluationId } = useLocalSearchParams<{ evaluationId?: string }>();
  const { isOnline, isEvaluationAvailableOffline } = useOffline();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, number>>(new Map());
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  // Fetch evaluation from online or offline
  const fetchEvaluation = useCallback(async () => {
    if (!evaluationId) return;
    setLoading(true);
    setError(null);

    try {
      let evaluation: Evaluation | null = null;

      if (isOnline) {
        // Try to fetch from server
        try {
          const raw = pickArray(await api.get<any>(ENDPOINTS.evaluations.revision));
          const normalized: Evaluation[] = raw.map((e: any, idx: number) => ({
            id: Number(e?.id ?? e?.evaluationId ?? idx),
            evaluationId: e?.id ?? e?.evaluationId,
            type: e?.type,
            courseCode: e?.courseCode,
            courseName: e?.courseName,
            questions: Array.isArray(e?.questions) ? e.questions : [],
          }));
          evaluation = normalized.find((e) => String(e.id) === String(evaluationId)) || null;
        } catch (onlineError) {
          console.warn('Failed to fetch from server, trying offline:', onlineError);
          // Fall through to offline fetch
        }
      }

      // If not found online or offline, try offline storage
      if (!evaluation) {
        const offlineEval = await getOfflineEvaluation(Number(evaluationId));
        if (offlineEval) {
          evaluation = {
            id: offlineEval.evaluationId,
            evaluationId: offlineEval.evaluationId,
            type: offlineEval.type,
            courseCode: offlineEval.courseCode,
            courseName: offlineEval.courseName,
            questions: offlineEval.questions as EvalQuestion[],
          };
        }
      }

      if (!mountedRef.current) return;

      if (evaluation) {
        setEvaluation(evaluation);
      } else {
        setError('Evaluation not found. Please download it first.');
      }
    } catch (e: any) {
      if (!mountedRef.current) return;
      setError(e?.message || 'Failed to load evaluation');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [evaluationId, isOnline]);

  useEffect(() => {
    fetchEvaluation();
  }, [fetchEvaluation]);

  const questions = useMemo(() => {
    const list = evaluation?.questions || [];
    return list
      .map((q: any, idx: number) => ({
        id: Number(q?.questionId ?? idx),
        text: String(q?.text ?? 'Question'),
        choices: Array.isArray(q?.choices)
          ? [...q.choices].sort((a: any, b: any) => Number(a?.order || 0) - Number(b?.order || 0))
          : [],
      }))
      .filter((q: any) => Number.isFinite(q.id));
  }, [evaluation]);

  // Start test session
  const handleStartTest = useCallback(async () => {
    if (!evaluation || !isOnline) {
      Alert.alert('Error', 'You need to be online to start a test.');
      return;
    }

    try {
      // Create offline attempt
      const attempt = await createOfflineAttempt(evaluation.id, 'current-matricule'); // Replace with actual matricule
      setCurrentAttemptId(attempt.attemptLocalId);
      setIsTestMode(true);
      setSelectedAnswers(new Map());
    } catch (err) {
      Alert.alert('Error', 'Failed to start test: ' + (err as Error).message);
    }
  }, [evaluation, isOnline]);

  // Submit test
  const handleSubmitTest = useCallback(async () => {
    if (!currentAttemptId) return;

    Alert.alert('Confirm', 'Are you sure you want to submit your test?', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Submit',
        onPress: async () => {
          try {
            // Save all remaining answers
            for (const [questionId, choiceId] of selectedAnswers) {
              await saveOfflineAnswer(currentAttemptId, questionId, {
                type: 'mcq',
                selectedOption: choiceId,
              });
            }

            // Mark as submitted
            await markOfflineAttemptSubmitted(currentAttemptId);

            Alert.alert('Success', 'Test submitted! Your answers will be synced when online.');
            setIsTestMode(false);
            setCurrentAttemptId(null);
            setSelectedAnswers(new Map());
            router.back();
          } catch (err) {
            Alert.alert('Error', 'Failed to submit: ' + (err as Error).message);
          }
        },
      },
    ]);
  }, [currentAttemptId, selectedAnswers]);

  // Handle answer selection
  const handleSelectAnswer = useCallback(
    async (questionId: number, choiceId: number) => {
      const newAnswers = new Map(selectedAnswers);
      newAnswers.set(questionId, choiceId);
      setSelectedAnswers(newAnswers);

      if (currentAttemptId) {
        try {
          await saveOfflineAnswer(currentAttemptId, questionId, {
            type: 'mcq',
            selectedOption: choiceId,
          });
        } catch (err) {
          console.error('Failed to save answer:', err);
        }
      }
    },
    [selectedAnswers, currentAttemptId]
  );

  const showOfflineWarning = !isOnline && isEvaluationAvailableOffline(Number(evaluationId));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <QuizHeader />

      <View style={styles.headerBar}>
        <Text style={[styles.title, { fontFamily: typography.fontFamily.heading }]}>
          {evaluation
            ? `${evaluation.type || 'Evaluation'} — ${[evaluation.courseCode || '', evaluation.courseName || '']
                .filter(Boolean)
                .join(' — ')}`
            : 'Test'}
        </Text>

        <OfflineIndicator
          isOnline={isOnline}
          isAvailableOffline={isEvaluationAvailableOffline(Number(evaluationId))}
          size="small"
        />
      </View>

      {showOfflineWarning && (
        <View style={styles.warningBox}>
          <Ionicons name="cloud-offline" size={16} color="#EA580C" />
          <Text style={styles.warningText}>You're offline. Can only use cached data.</Text>
        </View>
      )}

      <SyncStatus />

      {loading ? (
        <View style={{ alignItems: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#4B1F3B" />
          <Text style={{ marginTop: 8 }}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={{ alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#b00020', marginBottom: 12 }}>{error}</Text>
          <TouchableOpacity style={[styles.navBtn, styles.primaryBtn]} onPress={fetchEvaluation}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !evaluation ? (
        <View style={{ alignItems: 'center', padding: 24 }}>
          <Text>No evaluation found.</Text>
          <TouchableOpacity style={[styles.navBtn, styles.secondaryBtn]} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color="#331424" />
            <Text style={styles.secondaryBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      ) : isTestMode ? (
        // Test mode - show interactive questions
        <FlatList
          data={questions}
          keyExtractor={(q) => String(q.id)}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <Text style={styles.question}>{`Q${index + 1}. ${item.text}`}</Text>
              {(item.choices || []).map((c: Choice, i: number) => {
                const isSelected = selectedAnswers.get(item.id) === c.choiceId;
                return (
                  <TouchableOpacity
                    key={String(c?.choiceId ?? i)}
                    style={[styles.option, isSelected && styles.selectedOption]}
                    onPress={() => handleSelectAnswer(item.id, c.choiceId || i)}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={isSelected ? '#FD2A9B' : '#999'}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.optionText}>{String.fromCharCode(65 + i)}. {c?.text || ''}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
      ) : (
        // Review mode - show correct answers
        <FlatList
          data={questions}
          keyExtractor={(q) => String(q.id)}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <Text style={styles.question}>{`Q${index + 1}. ${item.text}`}</Text>
              {(item.choices || []).map((c: Choice, i: number) => {
                const correct = !!c?.isCorrect;
                return (
                  <View
                    key={String(c?.choiceId ?? i)}
                    style={[styles.option, correct ? styles.correct : undefined]}
                  >
                    <Text style={styles.optionText}>
                      {String.fromCharCode(65 + i)}. {c?.text || ''}
                      {correct ? '  (Correct)' : ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        />
      )}

      <View style={[styles.navRow, { marginBottom: 16 }]}>
        {isTestMode ? (
          <TouchableOpacity style={[styles.navBtn, styles.primaryBtn]} onPress={handleSubmitTest}>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Submit</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={[styles.navBtn, styles.secondaryBtn]} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={18} color="#331424" />
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
            {isOnline && (
              <TouchableOpacity style={[styles.navBtn, styles.primaryBtn]} onPress={handleStartTest}>
                <Ionicons name="play" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Start Test</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 10,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#331424', flex: 1 },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: 15,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  warningText: { fontSize: 13, color: '#92400E', fontWeight: '500' },
  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 14,
    marginHorizontal: 15,
    marginTop: 15,
    elevation: 3,
  },
  question: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  selectedOption: { backgroundColor: '#FDF2F8', borderColor: '#FD2A9B' },
  correct: { backgroundColor: '#D4F8E8', borderColor: '#1abc2dff' },
  optionText: { fontWeight: '600', flex: 1 },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginTop: 15,
    gap: 10,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    minWidth: 120,
    elevation: 3,
    flex: 1,
  },
  primaryBtn: { backgroundColor: '#FD2A9B' },
  secondaryBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#331424' },
  primaryBtnText: { color: '#fff', fontWeight: '700', marginHorizontal: 6 },
  secondaryBtnText: { color: '#331424', fontWeight: '700', marginHorizontal: 6 },
});

