import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal, Image
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QuizHeader from '@/components/headers/header';
import { useTheme } from '@/theme/global';

/* ---------------- QUESTIONS ---------------- */

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

const questions: Question[] = [
  {
    id: 1,
    question: 'What are the colors on the Cameroon flag?',
    options: [
      'Green, Red, Yellow',
      'Blue, White, Red',
      'Green, Blue, Yellow',
      'Red, Yellow, Black',
    ],
    correctAnswer: 'Green, Red, Yellow',
  },
  {
    id: 2,
    question: 'Which is the capital of Cameroon?',
    options: ['Yaoundé', 'Douala', 'Bamenda', 'Garoua'],
    correctAnswer: 'Yaoundé',
  },
];

/* ---------------- COMPONENT ---------------- */

export default function TestDetail() {
  const { typography, colors } = useTheme();
  const { title } = useLocalSearchParams();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // seconds

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  /* ---------------- TIMER ---------------- */

  useEffect(() => {
    if (showResult) return;

    if (timeLeft === 0) {
      finishTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showResult]);

  /* ---------------- LOGIC ---------------- */

  const selectAnswer = (option: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: option });
  };

  const finishTest = () => {
    setShowResult(true);
  };

  const score = questions.filter(
    (q) => answers[q.id] === q.correctAnswer
  ).length;

  /* ---------------- UI ---------------- */

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <QuizHeader />

      <Text style={[styles.title, { fontFamily: typography.fontFamily.heading }]}>
        {title || 'Test'}
      </Text>

      {/* TIMER */}
      <Text style={styles.timer}>⏱ {timeLeft}s</Text>

      {/* QUESTION CARD */}
      <View style={styles.card}>
        <Text style={styles.question}>{currentQuestion.question}</Text>

        {currentQuestion.options.map((option) => {
          const selected = answers[currentQuestion.id] === option;
          const isCorrect = option === currentQuestion.correctAnswer;
          const showCorrection =
            showResult || (selected && !isCorrect);

          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.option,
                selected && styles.optionSelected,
                showCorrection && isCorrect && styles.correct,
                showCorrection && selected && !isCorrect && styles.wrong,
              ]}
              onPress={() => selectAnswer(option)}
              disabled={showResult}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity
          disabled={currentIndex === 0}
          style={[
            styles.navBtn,
            styles.secondaryBtn,
            currentIndex === 0 && styles.disabledBtn,
          ]}
          onPress={() => setCurrentIndex(currentIndex - 1)}
        >
          <Ionicons name="chevron-back" size={18} color="#331424" />
          <Text style={styles.secondaryBtnText}>Previous</Text>
        </TouchableOpacity>

        {!showResult && (
          <TouchableOpacity
            disabled={!answers[currentQuestion.id]}
            style={[
              styles.navBtn,
              styles.primaryBtn,
              !answers[currentQuestion.id] && styles.disabledBtn,
            ]}
            onPress={() =>
              isLast ? finishTest() : setCurrentIndex(currentIndex + 1)
            }
          >
            <Text style={styles.primaryBtnText}>
              {isLast ? 'Submit' : 'Next'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )}

        {showResult && currentIndex < questions.length - 1 && (
          <TouchableOpacity
            style={[styles.navBtn, styles.primaryBtn]}
            onPress={() => setCurrentIndex(currentIndex + 1)}
          >
            <Text style={styles.primaryBtnText}>Next</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* RESULT MODAL */}
      <Modal visible={showResult} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Test Completed!</Text>
            <Image
                            source={require("../../assets/icons/confetti.gif")}
                            style={{ width: 90, height: 90, marginBottom: 15 }}
                          />
            <Text style={styles.modalScore}>
              Score: {score}  / total mark
            </Text>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => router.replace('/studyTests/TestListScreen')}
            >
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },

  title: {
    fontSize: 22,
    fontWeight: '700',
    margin: 15,
    color: '#331424',
  },

  timer: {
    alignSelf: 'flex-end',
    marginRight: 20,
    fontWeight: '700',
    color: '#FD2A9B',
  },

  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 14,
    marginHorizontal: 15,
    marginTop: 15,
    elevation: 3,
  },

  question: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 15,
  },

  option: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },

  optionSelected: {
    borderColor: '#1abc2dff',
    backgroundColor: '#b4f8bcff',
  },

  correct: {
    backgroundColor: '#D4F8E8',
    borderColor: '#1abc2dff',
  },

  wrong: {
    backgroundColor: '#FDECEA',
    borderColor: '#E74C3C',
  },

  optionText: {
    fontWeight: '600',
  },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginTop: 15,
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
  },

  primaryBtn: {
    backgroundColor: '#FD2A9B',
  },

  secondaryBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#331424',
  },

  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    marginHorizontal: 6,
  },

  secondaryBtnText: {
    color: '#331424',
    fontWeight: '700',
    marginHorizontal: 6,
  },

  disabledBtn: {
    opacity: 0.4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modal: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },

  modalScore: {
    fontSize: 16,
    marginBottom: 20,
  },

  doneBtn: {
    backgroundColor: '#FD2A9B',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },

  doneText: {
    color: '#fff',
    fontWeight: '700',
  },
});
