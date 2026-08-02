'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <img
          src="/assets/logo.jpg"
          alt="Nora Logo"
          className="w-24 h-24 rounded-3xl mx-auto shadow-2xl ring-4 ring-slate-800 object-cover"
        />
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white">404</h1>
          <h2 className="text-xl font-bold text-slate-300">Page Introuvable</h2>
          <p className="text-slate-400 text-sm">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="accent" size="lg" className="gap-2 mx-auto mt-4">
            <Home className="w-5 h-5" />
            <span>Retour à l'accueil</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
