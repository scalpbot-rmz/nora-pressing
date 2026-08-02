'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Smartphone, Bell, Store, PhoneCall, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  pressingName?: string;
  phonePrimary?: string;
}

export function Header({ pressingName = 'Pressing Éclat Plus', phonePrimary = '+237 6 99 88 77 66' }: HeaderProps) {
  const [showNotifBanner, setShowNotifBanner] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200/80 px-4 py-3 sticky top-0 z-40 shadow-sm flex items-center justify-between">
        {/* Brand Info */}
        <div className="flex items-center gap-3">
          <img src="/assets/logo.jpg" alt="Nora" className="w-8 h-8 rounded-lg object-cover shadow" />
          <div>
            <h2 className="font-bold text-slate-900 text-sm lg:text-base leading-tight flex items-center gap-1.5">
              <Store className="w-4 h-4 text-[#2563EB] hidden sm:inline-block" />
              {pressingName}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <PhoneCall className="w-3 h-3 text-[#16A34A]" />
              <span>{phonePrimary}</span>
            </p>
          </div>
        </div>

        {/* Action Right */}
        <div className="flex items-center gap-2">
          <Link href="/install">
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5 text-xs">
              <Smartphone className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>PWA Mobile</span>
            </Button>
          </Link>

          {/* Settings button */}
          <Link href="/dashboard/settings" className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors" title="Paramètres">
            <Settings className="w-5 h-5" />
          </Link>

          {/* Notifications — bientôt disponible */}
          <div className="relative">
            <button
              onClick={() => setShowNotifBanner((v) => !v)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-slate-300 rounded-full ring-2 ring-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Bandeau notifications bientôt disponible */}
      {showNotifBanner && (
        <div className="sticky top-[57px] z-30 bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs font-semibold text-amber-800">
              🔔 Les notifications seront disponibles dans une prochaine mise à jour. Restez à l&apos;écoute !
            </p>
          </div>
          <button
            onClick={() => setShowNotifBanner(false)}
            className="p-1 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors shrink-0"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
