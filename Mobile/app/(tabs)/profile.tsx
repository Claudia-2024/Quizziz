import QuizHeader from '@/components/headers/header';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/global';
import { useAuth } from '@/context/AuthContext';

const Profile = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const { student, logout } = useAuth();
  const initialName = [student?.firstName, student?.lastName].filter(Boolean).join(' ') || '—';
  const initialEmail = student?.email || '—';
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('********');
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const { typography } = theme;
  return (
    <View style={styles.container}>
      <QuizHeader />

      <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Profile Card */}
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          <Image
            style={styles.avatar}
            source={require('../../assets/icons/pro.png')}
          />
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label,{fontFamily: typography.fontFamily.buttonText} ]}>Name</Text>
            <View style={styles.inputBox}>
              <Text style={[{fontFamily: typography.fontFamily.body}, styles.value]}>{name}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label,{fontFamily: typography.fontFamily.buttonText} ]}>Email</Text>
            <View style={styles.inputBox}>
              <Text style={[{fontFamily: typography.fontFamily.body}, styles.value]}>{email}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
  <Text style={[styles.label,{fontFamily: typography.fontFamily.buttonText} ]}>Password</Text>
  <View style={styles.inputBox}>
    <Text style={[{fontFamily: typography.fontFamily.body}, styles.value]}>••••••••</Text>
  </View>
</View>

        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#e74c3c' }]} onPress={logout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <ScrollView>
              <Text style={[styles.modalTitle, {fontFamily:typography.fontFamily.heading}]}>Edit Profile</Text>

              {/* Name Input */}
              <Text style={[{fontFamily:typography.fontFamily.buttonText}, styles.label]}>Name</Text>
              <TextInput
                style={[{fontFamily: typography.fontFamily.body}, styles.modalInput]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#aaa"
              />

              {/* Email Input */}
              <Text style={[{fontFamily:typography.fontFamily.buttonText}, styles.label]}>Email</Text>
              <TextInput
                style={[{fontFamily: typography.fontFamily.body}, styles.modalInput]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#aaa"
                keyboardType="email-address"
              />

              {/* Password Input with Toggle */}
              <Text style={[{fontFamily:typography.fontFamily.buttonText}, styles.label]}>Password</Text>
              <View style={{ position: 'relative', marginBottom: 15 }}>
                <TextInput
                  style={[{fontFamily: typography.fontFamily.body}, styles.modalInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={{ position: 'absolute', right: 12, top: 14 }}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>

              {/* Buttons */}
              <TouchableOpacity
                style={[styles.saveButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2e6f7',
    paddingTop: 40,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 60,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 6,
  },
  avatarContainer: { position: 'absolute', top: -50, alignItems: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  infoContainer: { width: '100%', marginTop: 10 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 16, color: '#555', marginBottom: 5 },
  inputBox: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  value: { fontSize: 16, color: '#333' },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 16,
  },
  button: {
    backgroundColor: '#4B1F3B',
    paddingVertical: 15,
    flex: 1,
    minWidth: 0,
    borderRadius: 15,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Modal
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 25, textAlign: 'center', color: '#4B1F3B' },
  modalInput: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4B1F3B',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
});
