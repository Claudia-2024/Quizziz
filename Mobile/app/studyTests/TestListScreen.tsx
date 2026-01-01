// studyTests/TestListScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { router } from 'expo-router';
import QuizHeader from '@/components/headers/header';
import { useTheme } from '@/theme/global';

interface Test {
  id: string;
  subject: string;
  session: 'Normal Session' | 'Mid Term';
  duration: string; // e.g. "50 minutes"
}

const allTests: Test[] = [
  { id: '1', subject: 'IT Architecture', session: 'Normal Session', duration: '50 minutes' },
  { id: '2', subject: 'IT Architecture', session: 'Mid Term', duration: '50 minutes' },
  { id: '3', subject: 'Software Engineering', session: 'Normal Session', duration: '45 minutes' },
  { id: '4', subject: 'Databases', session: 'Mid Term', duration: '60 minutes' },
];

const sessions = ['Normal Session', 'Mid Term'];
const durations = ['30 minutes', '45 minutes', '50 minutes', '60 minutes'];

const TestListScreen: React.FC = () => {
  const theme = useTheme();
  const { typography } = theme;

  const [searchText, setSearchText] = useState('');
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [filteredTests, setFilteredTests] = useState<Test[]>(allTests);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const handleSearch = (text: string) => {
    setSearchText(text);
    applyFilter(text, selectedSessions, selectedDurations);
  };

  const toggleSessionFilter = (session: string) => {
    const updated = selectedSessions.includes(session)
      ? selectedSessions.filter((s) => s !== session)
      : [...selectedSessions, session];
    setSelectedSessions(updated);
    applyFilter(searchText, updated, selectedDurations);
  };

  const toggleDurationFilter = (duration: string) => {
    const updated = selectedDurations.includes(duration)
      ? selectedDurations.filter((d) => d !== duration)
      : [...selectedDurations, duration];
    setSelectedDurations(updated);
    applyFilter(searchText, selectedSessions, updated);
  };

  const applyFilter = (text: string, sessions: string[], durations: string[]) => {
    let filtered = allTests;

    if (text) {
      filtered = filtered.filter((test) =>
        test.subject.toLowerCase().includes(text.toLowerCase())
      );
    }

    if (sessions.length > 0) {
      filtered = filtered.filter((test) => sessions.includes(test.session));
    }

    if (durations.length > 0) {
      filtered = filtered.filter((test) => durations.includes(test.duration));
    }

    setFilteredTests(filtered);
  };

  const resetFilter = () => {
    setSelectedSessions([]);
    setSelectedDurations([]);
    setFilteredTests(allTests);
    setShowFilterModal(false);
  };

  const renderItem = ({ item }: { item: Test }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/studyTests/TestDetail?testId=${item.id}`)}
    >
      <Text style={[{ fontFamily: typography.fontFamily.heading }, styles.cardSubject]}>
        {item.subject}
      </Text>
      <Text style={styles.cardInfo}>Session: {item.session}</Text>
      <Text style={styles.cardInfo}>Duration: {item.duration}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <QuizHeader />
      <Text style={[{ fontFamily: typography.fontFamily.heading }, styles.title]}>
        Past Tests
      </Text>

      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search tests..."
        value={searchText}
        onChangeText={handleSearch}
      />

      {/* Filter Button */}
      <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
        <Text style={styles.filterButtonText}>Filter</Text>
      </TouchableOpacity>

      <FlatList
        data={filteredTests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.noResultsText}>No tests found.</Text>
        }
      />

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Tests</Text>

            <Text style={styles.modalSubtitle}>Session</Text>
            <ScrollView>
              {sessions.map((session) => (
                <TouchableOpacity
                  key={session}
                  style={styles.checkboxContainer}
                  onPress={() => toggleSessionFilter(session)}
                >
                  <View style={[styles.checkbox, selectedSessions.includes(session) && styles.checkedBox]} />
                  <Text style={styles.checkboxLabel}>{session}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalSubtitle}>Duration</Text>
            <ScrollView>
              {durations.map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={styles.checkboxContainer}
                  onPress={() => toggleDurationFilter(duration)}
                >
                  <View style={[styles.checkbox, selectedDurations.includes(duration) && styles.checkedBox]} />
                  <Text style={styles.checkboxLabel}>{duration}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilterModal(false)}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetButton} onPress={resetFilter}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  filterButton: {
    backgroundColor: '#FF0080',
    alignSelf: 'flex-end',
    marginHorizontal: 15,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  filterButtonText: { color: '#fff', fontWeight: 'bold' },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },
  cardSubject: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  cardInfo: { fontSize: 14, color: '#555' },
  noResultsText: { textAlign: 'center', marginTop: 20, color: '#999', fontSize: 16 },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 15 },
  modalSubtitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#555',
    marginRight: 10,
  },
  checkedBox: { backgroundColor: '#FF0080', borderColor: '#FF0080' },
  checkboxLabel: { fontSize: 16 },
  applyButton: {
    backgroundColor: '#FF0080',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  applyButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resetButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FF0080',
  },
  resetButtonText: { color: '#FF0080', fontWeight: 'bold', fontSize: 16 },
});
