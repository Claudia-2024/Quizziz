// Mobile/context/OfflineContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import {
  saveEvaluationsOffline,
  getOfflineEvaluations,
  getPendingOfflineAttempts,
  markOfflineAttemptSynced,
  OfflineEvaluation,
  OfflineAttempt,
} from '@/lib/offline/offlineService';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/config';
import { getToken } from '@/lib/storage';

interface OfflineContextType {
  isOnline: boolean;
  isNetworkLoading: boolean;
  offlineEvaluations: OfflineEvaluation[];
  isEvaluationAvailableOffline: (evaluationId: number) => boolean;
  syncOfflineData: () => Promise<void>;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  downloadEvaluations: (matricule: string) => Promise<void>;
  isDownloading: boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const { isOnline, isLoading: isNetworkLoading } = useNetworkStatus();
  const [offlineEvaluations, setOfflineEvaluations] = useState<OfflineEvaluation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [appState, setAppState] = useState<AppStateStatus>('active');

  // Load offline evaluations on mount and when app comes to foreground
  const loadOfflineEvaluations = useCallback(async () => {
    try {
      const evals = await getOfflineEvaluations();
      setOfflineEvaluations(evals);
    } catch (error) {
      console.error('Error loading offline evaluations:', error);
    }
  }, []);

  // Download evaluations from the server and cache them locally
  const downloadEvaluations = useCallback(
    async (matricule: string) => {
      if (!isOnline) {
        console.warn('Cannot download evaluations while offline');
        return;
      }

      setIsDownloading(true);
      try {
        const data = await api.get<any>(ENDPOINTS.evaluations.listByStudent(matricule));
        const evaluations = Array.isArray(data) ? data : data?.data || [];

        if (evaluations.length > 0) {
          await saveEvaluationsOffline(evaluations);
          await loadOfflineEvaluations();
        }
      } catch (error) {
        console.error('Error downloading evaluations:', error);
        throw error;
      } finally {
        setIsDownloading(false);
      }
    },
    [isOnline, loadOfflineEvaluations]
  );

  // Sync offline answers to the server when coming online
  const syncOfflineData = useCallback(async () => {
    if (!isOnline || isSyncing) {
      return;
    }

    setIsSyncing(true);
    try {
      const pendingAttempts = await getPendingOfflineAttempts();

      for (const attempt of pendingAttempts) {
        try {
          // Try to submit the attempt to the server
          // This would depend on your backend implementation
          const response = await api.post(
            ENDPOINTS.evaluations.submit(attempt.serverResponseSheetId || attempt.attemptLocalId),
            { attemptLocalId: attempt.attemptLocalId }
          );

          if (response) {
            const serverResponseSheetId =
              response.responseSheetId || response.id || attempt.serverResponseSheetId;
            await markOfflineAttemptSynced(attempt.attemptLocalId, serverResponseSheetId);
          }
        } catch (error) {
          console.error(`Error syncing attempt ${attempt.attemptLocalId}:`, error);
          // Don't throw, continue with next attempt
        }
      }

      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error syncing offline data:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  // Auto-sync when network comes online
  useEffect(() => {
    if (isOnline && !isNetworkLoading) {
      // Delay slightly to ensure network is stable
      const timer = setTimeout(() => {
        syncOfflineData();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, isNetworkLoading, syncOfflineData]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (state) => {
      setAppState(state);

      if (state === 'active') {
        // App came to foreground, reload offline data and attempt sync
        await loadOfflineEvaluations();
        if (isOnline) {
          await syncOfflineData();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isOnline, loadOfflineEvaluations, syncOfflineData]);

  // Load offline evaluations on initial mount
  useEffect(() => {
    loadOfflineEvaluations();
  }, [loadOfflineEvaluations]);

  const isEvaluationAvailableOffline = useCallback(
    (evaluationId: number) => {
      return offlineEvaluations.some((e) => e.evaluationId === evaluationId);
    },
    [offlineEvaluations]
  );

  const value: OfflineContextType = {
    isOnline,
    isNetworkLoading,
    offlineEvaluations,
    isEvaluationAvailableOffline,
    syncOfflineData,
    isSyncing,
    lastSyncTime,
    downloadEvaluations,
    isDownloading,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
}

