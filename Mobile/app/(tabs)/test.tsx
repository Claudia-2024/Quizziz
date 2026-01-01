// TestQuizPage.tsx
import QuizHeader from '@/components/headers/header';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  ImageBackground,
} from 'react-native';

interface Question {
  id: number;
  question: string;
  options: string[];
}

const questions: Question[] = [
  {
    id: 1,
    question: "What are the colors on the Cameroon flag ?",
    options: ["Green, Red, Yellow", "Blue, White, Red", "Green, Blue, Yellow", "Red, Yellow, Black"],
  },
  {
    id: 2,
    question: "Which is the capital of the country Cameroon ?",
    options: ["Yaoundé ", "Douala", "Bamenda", "Garoua"],
  },
];

const TestQuizPage: React.FC = () => {
  const [testReady, setTestReady] = useState(true);
  const [showNotReadyModal, setShowNotReadyModal] = useState(false);
  const [showReadyModal, setShowReadyModal] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const timePerQuestion = 30;
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);

  useEffect(() => {
    if (!testStarted) {
      testReady ? setShowReadyModal(true) : setShowNotReadyModal(true);
    }
  }, [testReady, testStarted]);

  useEffect(() => {
    if (!testStarted) return;
    setTimeLeft(timePerQuestion);
  }, [currentQuestion]);

  useEffect(() => {
    if (!testStarted) return;
    if (timeLeft === 0) {
      handleNextQuestion();
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, testStarted]);

  const handleStartTest = () => {
    setTestStarted(true);
    setShowReadyModal(false);
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(q => q + 1);
    } else {
      setShowCompletionModal(true);
    }
  };

  if (testStarted) {
    const question = questions[currentQuestion];

    return (
      <View style={styles.container}>
        {/* Progress */}
        <Text style={styles.progress}>{`${currentQuestion + 1} of ${questions.length} `}</Text>

        {/* QUESTION CARD WRAPPED IN IMAGEBACKGROUND */}
        <ImageBackground
          source={require("../../assets/images/leaf.png")}
          style={styles.background}
          imageStyle={{ borderRadius: 20 }}
        >
          <BlurView  tint="dark"  />
          <View style={styles.colorTint} />

          <View style={styles.questionCard}>

            {/* TIMER */}
            <View style={styles.timerContainer}>
              <View style={styles.timerCircle}>
                <Text style={styles.timerText}>{timeLeft}</Text>
              </View>
            </View>
            {/* QUESTION NUMBER */}
            <Text style={styles.questionLabel}>
              {`Question ${String(question.id).padStart(2, '0')}`}
            </Text>

            {/* QUESTION TEXT */}
            <Text style={styles.questionText}>{question.question}</Text>
          </View>
        </ImageBackground>

        {/* ANSWERS CARD */}
        <View style={styles.answersCard}>
          <FlatList
            data={question.options}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => {
              const letter = String.fromCharCode(65 + index);
              const selected = selectedOption === item;

              return (
                <TouchableOpacity
                  style={[styles.optionCard, selected && styles.optionSelected]}
                  onPress={() => setSelectedOption(item)}
                >
                  <Text style={styles.optionLetter}>{letter}.</Text>
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* PREVIOUS / NEXT */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton, currentQuestion === 0 && { opacity: 0.8 }]}
              disabled={currentQuestion === 0}
              onPress={() => setCurrentQuestion(q => q - 1)}
            >
              <Text style={styles.navText}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, styles.nextButton, !selectedOption && { opacity: 0.6 }]}
              disabled={!selectedOption}
              onPress={handleNextQuestion}
            >
              <Text style={styles.navText}>
                {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* COMPLETION MODAL */}
        <Modal visible={showCompletionModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Test Completed!</Text>
              <Image
                source={require("../../assets/icons/success.gif")}
                style={{ width: 90, height: 90, marginBottom: 15 }}
              />
              <Text style={styles.modalText}>You have successfully finished the test.</Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => {
                  setShowCompletionModal(false);
                  router.push('/(tabs)');
                }}
              >
                <Text style={styles.startButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  /* MODALS */
  return (
    <View style={styles.container}>
      <Modal visible={showReadyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Your Test is Ready</Text>
            <Image
              source={require("../../assets/icons/process.png")}
              style={{ width: 90, height: 90, marginBottom: 15 }}
            />
            <Text style={styles.modalText}>Your test has been uploaded click below to start!</Text>
            <TouchableOpacity style={styles.startButton} onPress={handleStartTest}>
              <Text style={styles.startButtonText}>Start Test</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showNotReadyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Test Not Ready</Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => setShowNotReadyModal(false)}
            >
              <Text style={styles.startButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TestQuizPage;

/* ================== STYLES ================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2e6f7',
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  progress: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },

  background: {
    borderRadius: 20,
    marginBottom: 20,
  },



  colorTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(43,16,46,0.9)',
    borderRadius:25
  },

  questionCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 20,
  },

  questionLabel: {
    color: '#FF2F92',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },

  timerContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },

  timerCircle: {
    width: 100,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF2F92',
    shadowColor: '#FF2F92',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 8,
  },

  timerText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },

  questionText: {
    color: '#FFF',
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },

  answersCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  optionSelected: {
    backgroundColor: '#FFE1EE',
  },

  optionLetter: {
    fontWeight: 'bold',
    marginRight: 10,
    fontSize: 16,
  },

  optionText: {
    fontSize: 16,
  },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },

  navButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 5,
  },

  prevButton: {
    backgroundColor: '#331424',
    marginRight: 10,
  },

  nextButton: {
    backgroundColor: '#FF2F92',
  },

  navText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: '#FFF',
    padding: 30,
    borderRadius: 14,
    width: '80%',
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  modalText: {
    textAlign: 'center',
    fontSize: 16,
  },

  startButton: {
    backgroundColor: '#FF2F92',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 20,
  },

  startButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
