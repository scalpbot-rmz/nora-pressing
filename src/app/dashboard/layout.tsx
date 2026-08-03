'use client';

import { useNoraStore } from '@/lib/store';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Header } from '@/components/layout/header';
import { ToastProvider } from '@/components/ui/toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { pressing, isLoaded } = useNoraStore();

  if (!isLoaded) {
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

  return (
    <ToastProvider>
      {/*
        Scroll naturel via le body — évite tout problème de positionnement fixed.
        Le header est sticky (reste visible en haut).
        La bottom nav est fixed (reste visible en bas).
        Le main n'a pas overflow: hidden/auto pour ne pas piéger les modaux fixed.
      */}
      <div className="min-h-screen bg-[#f8fafc]">
        <Header pressingName={pressing.name} phonePrimary={pressing.phone_primary} />

        <main className="pb-28 pt-2">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-up">
            {children}
          </div>
        </main>

        <BottomNav />
      </div>
    </ToastProvider>
  );
}
