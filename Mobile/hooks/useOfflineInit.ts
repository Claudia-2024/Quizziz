// Mobile/hooks/useOfflineInit.ts
/**
 * Initialize offline database on app start
 */

import { useEffect, useState } from 'react';
import { initDB } from '@/lib/offline/db';

export function useOfflineInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize offline database:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        // Don't fail the app, just log the error
        setIsInitialized(true);
      }
    };

    init();
  }, []);

  return { isInitialized, error };
}

