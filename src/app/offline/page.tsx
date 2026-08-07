'use client';

import Link from 'next/link';
import { WifiOff, RefreshCw, LayoutDashboard } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-6 shadow-2xl">
        <WifiOff className="w-10 h-10" />
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight mb-2">Vous êtes hors ligne</h1>
      <p className="text-slate-400 text-sm max-w-md mb-8">
        Internet est indisponible mais Nora Pressing continue de fonctionner ! Vous pouvez accéder à vos commandes, enregistrer de nouveaux dépôts et gérer vos clients en toute autonomie.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold px-5 py-3 rounded-xl shadow-lg text-sm w-full"
        >
          <LayoutDashboard className="w-4 h-4" />
          Accéder au Tableau de Bord
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-5 py-3 rounded-xl border border-slate-700 text-sm w-full"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    </div>
  );
}
