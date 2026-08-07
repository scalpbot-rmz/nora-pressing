'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNoraStore } from '@/lib/store';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Header } from '@/components/layout/header';
import { SyncStatusBar } from '@/components/ui/sync-status-bar';
import { ToastProvider } from '@/components/ui/toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { pressing, isLoaded } = useNoraStore();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
          <div className="absolute inset-0 rounded-full border-4 border-[#2563EB] border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-400 text-sm font-medium tracking-wide">Chargement de Nora...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#f8fafc] flex flex-col">
        <SyncStatusBar />
        <Header pressingName={pressing.name} phonePrimary={pressing.phone_primary} />

        <div className="flex-1 flex min-w-0 pb-20">
          <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-up">
            {children}
          </main>
        </div>

        <BottomNav />
      </div>
    </ToastProvider>
  );
}
