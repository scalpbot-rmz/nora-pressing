'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { syncEngine } from '@/lib/sync-engine';
import { db } from '@/lib/db';
import { useAuth } from './AuthContext';

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  forceSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  // Monitor network status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      if (user?.id) {
        runSync();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?.id]);

  // Monitor pending count in IndexedDB
  useEffect(() => {
    const updatePendingCount = async () => {
      try {
        let count = 0;
        count += await db.pressings.where('_syncStatus').anyOf(['pending', 'deleted']).count();
        count += await db.offers.where('_syncStatus').anyOf(['pending', 'deleted']).count();
        count += await db.customers.where('_syncStatus').anyOf(['pending', 'deleted']).count();
        count += await db.orders.where('_syncStatus').anyOf(['pending', 'deleted']).count();
        count += await db.expenses.where('_syncStatus').anyOf(['pending', 'deleted']).count();
        setPendingCount(count);
      } catch (err) {
        // Silently ignore Dexie errors — does not affect app functionality
      }
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const runSync = async () => {
    if (!user?.id || typeof navigator === 'undefined' || !navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncEngine.syncAll(user.id);
      setLastSyncAt(new Date());
    } catch {
      // Silently ignore sync errors
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto sync on mount and periodically if online
  useEffect(() => {
    if (!user?.id) return;

    runSync();
    syncEngine.subscribeRealtime(user.id, () => {
      setLastSyncAt(new Date());
    });

    const periodicInterval = setInterval(() => {
      if (navigator.onLine) {
        runSync();
      }
    }, 30000); // toutes les 30 sec

    return () => {
      clearInterval(periodicInterval);
      syncEngine.unsubscribeRealtime();
    };
  }, [user?.id]);

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingCount,
        lastSyncAt,
        forceSync: runSync,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
}
