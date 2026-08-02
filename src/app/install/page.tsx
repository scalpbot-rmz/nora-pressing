'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Download, CheckCircle2, Share2, Sparkles, ArrowLeft } from 'lucide-react';

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        "Pour installer Nora sur Android :\n1. Appuyez sur le menu Chrome (3 points en haut à droite)\n2. Sélectionnez 'Ajouter à l'écran d'accueil' ou 'Installer l'application'."
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <button className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Installer Nora sur Téléphone
            <Smartphone className="w-6 h-6 text-[#2563EB]" />
          </h1>
          <p className="text-sm text-slate-500">
            Application mobile Progressive Web App (PWA) native Android & iOS
          </p>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-[#0F172A] to-slate-800 text-white shadow-xl border-none">
        <CardBody className="p-6 text-center space-y-6">
          <img
            src="/assets/logo.jpg"
            alt="Nora Logo"
            className="w-20 h-20 rounded-3xl mx-auto shadow-2xl ring-4 ring-slate-700 object-cover"
          />

          <div className="space-y-2">
            <h2 className="text-xl font-bold">Nora Pressing PWA</h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Profitez d'une expérience mobile ultrarapide, installable sans passer par le Play Store, avec accès instantané à votre comptoir pressing.
            </p>
          </div>

          {isInstalled ? (
            <div className="p-4 bg-emerald-900/60 border border-emerald-500 rounded-xl text-emerald-300 text-sm font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Nora est déjà installée sur cet appareil !</span>
            </div>
          ) : (
            <Button
              onClick={handleInstallClick}
              variant="accent"
              size="lg"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold shadow-2xl gap-2"
            >
              <Download className="w-5 h-5" />
              <span>Installer Nora sur mon téléphone</span>
            </Button>
          )}
        </CardBody>
      </Card>

      {/* Guide d'installation étape par étape */}
      <Card>
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 font-bold text-slate-900">
          Instructions d'Installation Mobile (Android & iOS)
        </CardHeader>
        <CardBody className="p-6 space-y-4 text-sm text-slate-700">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <div>
              <p className="font-bold text-slate-900">Sur Navigateur Android (Google Chrome / Brave)</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Cliquez sur le bouton vert ci-dessus ou sur les <strong>3 petits points</strong> en haut à droite de votre navigateur Chrome et choisissez <strong>"Ajouter à l'écran d'accueil"</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-slate-100 pt-3">
            <div className="w-7 h-7 rounded-full bg-[#16A34A] text-white flex items-center justify-center font-bold text-xs shrink-0">
              2
            </div>
            <div>
              <p className="font-bold text-slate-900">Sur iPhone / iPad (Safari)</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Appuyez sur le bouton de <strong>Partage (carré avec flèche vers le haut)</strong> en bas de l'écran Safari et sélectionnez <strong>"Sur l'écran d'accueil"</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-slate-100 pt-3">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              3
            </div>
            <div>
              <p className="font-bold text-slate-900">Avantages PWA Nora</p>
              <ul className="text-xs text-slate-500 mt-1 space-y-1 list-disc list-inside">
                <li>Lancement instantané depuis votre écran d'accueil sans navigateur visible</li>
                <li>Génération de factures PDF instantanée au comptoir</li>
                <li>Partage WhatsApp direct des reçus clients</li>
                <li>Fonctionnement fluide même avec connexion réseau instable</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
