'use client';

import { useSync } from '@/contexts/SyncContext';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react';

export function SyncStatusBar() {
  const { isOnline, isSyncing, pendingCount, forceSync } = useSync();

  if (isOnline && !isSyncing && pendingCount === 0) {
    return null; // Tout est parfaitement synchronisé
  }

  return (
    <div
      className={`px-4 py-1.5 text-xs font-medium flex items-center justify-between transition-colors ${
        !isOnline
          ? 'bg-amber-600 text-amber-50'
          : isSyncing
          ? 'bg-blue-600 text-blue-50'
          : 'bg-emerald-600 text-emerald-50'
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5" />
            <span>
              Mode Hors Ligne —{' '}
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
            <span>Synchronisation avec le cloud en cours...</span>
          </>
        ) : (
          <>
            <CloudUpload className="w-3.5 h-3.5" />
            <span>{pendingCount} modification(s) en attente de synchronisation</span>
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
