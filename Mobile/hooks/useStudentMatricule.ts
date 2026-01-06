// Mobile/hooks/useStudentMatricule.ts
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMatricule } from '@/lib/student-storage';

/**
 * Hook pour accéder à la matricule de l'étudiant authentifié
 * Préfère le contexte Auth, sinon récupère du stockage
 */
export function useStudentMatricule() {
  const { student } = useAuth();
  const [matricule, setMatricule] = useState<string | null>(student?.matricule ?? null);
  const [isLoading, setIsLoading] = useState(!student);

  useEffect(() => {
    if (student?.matricule) {
      setMatricule(student.matricule);
      setIsLoading(false);
      return;
    }

    // Fallback: load from storage
    const loadMatricule = async () => {
      try {
        const stored = await getMatricule();
        setMatricule(stored);
      } catch (error) {
        console.error('Error loading matricule:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMatricule();
  }, [student?.matricule]);

  return { matricule, isLoading };
}

