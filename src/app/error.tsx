'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <img
          src="/assets/logo.jpg"
          alt="Nora Logo"
          className="w-24 h-24 rounded-3xl mx-auto shadow-2xl ring-4 ring-slate-800 object-cover grayscale"
        />
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-rose-500">
            <AlertTriangle className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Oups! Une erreur est survenue</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Un problème inattendu s'est produit. Nous nous excusons pour la gêne occasionnée.
          </p>
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <Button variant="outline" onClick={() => reset()} className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            <span>Réessayer</span>
          </Button>
          <Link href="/dashboard">
            <Button variant="accent" className="gap-2">
              <span>Retour à l'accueil</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
