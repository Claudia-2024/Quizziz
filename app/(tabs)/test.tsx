// TestQuizPage.tsx
import { router } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, FlatList, Image } from 'react-native';

interface Question {
  id: number;
  question: string;
  options: string[];
}

const questions: Question[] = [
  {
    id: 1,
    question: "What are the colors on the Cameroon flag?",
    options: ["Green, Red, Yellow", "Blue, White, Red", "Green, Blue, Yellow", "Red, Yellow, Black"],
  },
  {
    id: 2,
    question: "Which is the capital of Cameroon?",
    options: ["Yaoundé", "Douala", "Bamenda", "Garoua"],
  },
];

const TestQuizPage: React.FC = () => {
  const [testReady, setTestReady] = useState<boolean>(true);
  const [showNotReadyModal, setShowNotReadyModal] = useState<boolean>(false);
  const [showReadyModal, setShowReadyModal] = useState<boolean>(false);
  const [testStarted, setTestStarted] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // ----- TIMER -----
  const timePerQuestion = 60; // seconds
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);

  useEffect(() => {
    if (!testStarted) {
      if (testReady) setShowReadyModal(true);
      else setShowNotReadyModal(true);
    }
  }, [testReady, testStarted]);

  // Reset timer on question change
  useEffect(() => {
    if (!testStarted) return;
    setTimeLeft(timePerQuestion);
  }, [currentQuestion, testStarted]);

  // Countdown timer
  useEffect(() => {
    if (!testStarted) return;
    if (timeLeft === 0) {
      handleNextQuestion();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, testStarted]);

  const handleStartTest = () => {
    setTestStarted(true);
    setShowReadyModal(false);
  };

  const handleNextQuestion = () => {
    setSelectedOption(null); // Reset selected option
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowCompletionModal(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  if (testStarted) {
    const question = questions[currentQuestion];

    return (
      <View style={styles.container}>
        {/* TIMER */}
        <Text style={styles.timer}>⏱ {timeLeft}s</Text>

        <Text style={styles.progress}>{`${currentQuestion + 1} of ${questions.length}`}</Text>

        <View style={styles.questionCard}>
          <Text style={styles.questionTitle}>{`Question ${question.id}`}</Text>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>

        <FlatList
          data={question.options}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.option,
                selectedOption === item && { backgroundColor: '#FF0080' },
              ]}
              onPress={() => setSelectedOption(item)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedOption === item && { color: '#fff', fontWeight: 'bold' },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          style={{ width: '100%', marginTop: 20 }}
        />

        {/* PREVIOUS / NEXT BUTTONS */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.navButton, currentQuestion === 0 && { opacity: 0.5 }]}
            onPress={handlePreviousQuestion}
            disabled={currentQuestion === 0}
          >
            <Text style={styles.nextButtonText}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              currentQuestion === questions.length - 1 && styles.submitButton,
              !selectedOption && { opacity: 0.5 },
            ]}
            onPress={handleNextQuestion}
            disabled={!selectedOption}
          >
            <Text style={styles.nextButtonText}>
              {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Completion Modal */}
        <Modal
          visible={showCompletionModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCompletionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Test Completed!</Text>
              <Image style={{ height: 100, width: 100 }} source={require("../../assets/icons/success.gif")} />
              <Text style={styles.modalText}>You have successfully finished the test.</Text>
              <TouchableOpacity
                style={[styles.startButton, { marginTop: 20 }]}
                onPress={() => { setShowCompletionModal(false); router.push('/(tabs)') }}
              >
                <Text style={styles.startButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Start/test not ready modals
  return (
    <View style={styles.container}>
      {/* Ready Modal */}
      <Modal visible={showReadyModal} transparent={true} animationType="slide" onRequestClose={() => setShowReadyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Your Test is Ready</Text>
            <Image source={require("../../assets/icons/process.png")} style={{ width: 80, height: 80, marginBottom: 15 }} />
            <Text style={styles.modalText}>Your test has been uploaded. Click below to start.</Text>
            <TouchableOpacity style={[styles.startButton, { marginTop: 20 }]} onPress={handleStartTest}>
              <Text style={styles.startButtonText}>Start Test</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Not Ready Modal */}
      <Modal visible={showNotReadyModal} transparent={true} animationType="slide" onRequestClose={() => setShowNotReadyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Test Not Ready</Text>
            <Text style={styles.modalText}>The test has not been uploaded yet. Please try again later.</Text>
            <TouchableOpacity style={[styles.startButton, { marginTop: 20 }]} onPress={() => setShowNotReadyModal(false)}>
              <Text style={styles.startButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TestQuizPage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E2DDD1', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20 },
  progress: { alignSelf: 'flex-start', fontSize: 16, marginBottom: 20 },
  timer: { alignSelf: 'flex-end', fontSize: 16, marginBottom: 10, color: '#FF0080', fontWeight: 'bold' },
  questionCard: { backgroundColor: '#2D1B3F', width: '100%', padding: 20, borderRadius: 12 },
  questionTitle: { color: '#FF0080', fontWeight: 'bold', marginBottom: 5 },
  questionText: { color: '#fff', fontSize: 16 },
  option: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10 },
  optionText: { fontSize: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 20 },
  navButton: { backgroundColor: '#2D1B3F', paddingVertical: 15, width: '48%', borderRadius: 8, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  submitButton: { backgroundColor: '#FF0080' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', padding: 30, borderRadius: 12, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalText: { fontSize: 16, textAlign: 'center' },
  startButton: { backgroundColor: '#FF0080', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
  startButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
