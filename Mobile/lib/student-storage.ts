// Mobile/lib/student-storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const STUDENT_KEY = 'quizzy_student_data';

export interface StudentData {
  matricule: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Sauvegarder les données de l'étudiant authentifié
 */
export async function saveStudentData(student: StudentData): Promise<void> {
  try {
    await AsyncStorage.setItem(STUDENT_KEY, JSON.stringify(student));
  } catch (error) {
    console.error('Error saving student data:', error);
  }
}

/**
 * Récupérer les données de l'étudiant sauvegardées
 */
export async function getStudentData(): Promise<StudentData | null> {
  try {
    const data = await AsyncStorage.getItem(STUDENT_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading student data:', error);
    return null;
  }
}

/**
 * Récupérer uniquement la matricule
 */
export async function getMatricule(): Promise<string | null> {
  try {
    const data = await getStudentData();
    return data?.matricule ?? null;
  } catch (error) {
    console.error('Error getting matricule:', error);
    return null;
  }
}

/**
 * Effacer les données de l'étudiant
 */
export async function clearStudentData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STUDENT_KEY);
  } catch (error) {
    console.error('Error clearing student data:', error);
  }
}

