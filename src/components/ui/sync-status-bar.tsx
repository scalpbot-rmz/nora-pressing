'use client';

import { useSyncContext } from '@/contexts/SyncContext';
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react';
import { useState, useEffect } from 'react';

export function SyncStatusBar() {
  const { isOnline, isSyncing, pendingCount, forceSync } = useSyncContext();
  const [showSyncedBadge, setShowSyncedBadge] = useState(false);

  useEffect(() => {
    if (isOnline && !isSyncing && pendingCount === 0) {
      setShowSyncedBadge(true);
      const timer = setTimeout(() => {
        setShowSyncedBadge(false);
      }, 3000); // Disparaît élégamment après 3 secondes
      return () => clearTimeout(timer);
    }
  }, [isOnline, isSyncing, pendingCount]);

  if (isOnline && !isSyncing && pendingCount === 0 && !showSyncedBadge) {
    return null; // Invisible quand tout est parfaitement synchronisé
  }

  return (
    <div
      className={`px-4 py-1.5 text-xs font-medium flex items-center justify-between transition-all duration-300 ${
        !isOnline
          ? 'bg-amber-600 text-amber-50'
          : isSyncing
          ? 'bg-blue-600 text-blue-50'
          : pendingCount > 0
          ? 'bg-indigo-600 text-indigo-50'
          : 'bg-emerald-600 text-emerald-50'
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5" />
            <span>
              🔴 Hors connexion —{' '}
              {pendingCount > 0
                ? `${pendingCount} modification${pendingCount > 1 ? 's' : ''} enregistrée${
                    pendingCount > 1 ? 's' : ''
                  } localement`
                : 'Données enregistrées localement'}
            </span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>🟡 Synchronisation avec le cloud en cours...</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <CloudUpload className="w-3.5 h-3.5" />
            <span>{pendingCount} modification(s) en attente de synchronisation</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>🟢 Synchronisé avec le cloud</span>
          </>
        )}
      </div>

      {isOnline && !isSyncing && pendingCount > 0 && (
        <button
          onClick={() => forceSync()}
          className="underline hover:no-underline font-bold text-[11px]"
        >
          Synchroniser maintenant
        </button>
      )}
    </div>
  );
}
