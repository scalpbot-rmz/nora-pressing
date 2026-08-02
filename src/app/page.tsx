import Link from 'next/link';
import {
  Sparkles, Users, ShoppingBag, FileText, TrendingUp,
  CreditCard, Smartphone, CheckCircle2, ArrowRight, Store,
  ShieldCheck, Zap, Layers, ChevronRight, Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans selection:bg-[#2563EB] selection:text-white">
      
      {/* ─── BARRE DE NAVIGATION (HEADER) ─────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/assets/logo.jpg"
            alt="Nora Logo"
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-[#2563EB]/40 shadow-lg"
          />
          <div>
            <span className="font-extrabold text-white text-lg tracking-tight flex items-center gap-1.5">
              Nora Pressing <Sparkles className="w-4 h-4 text-[#16A34A]" />
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:block">Logiciel SaaS de Gestion de Pressing</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold px-3 py-2">
              Se connecter
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs font-bold shadow-lg shadow-blue-500/20 px-4 py-2">
              <span>Commencer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* ─── HERO SECTION ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 lg:px-8 max-w-7xl mx-auto w-full text-center">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#2563EB]/30 to-[#16A34A]/20 blur-[120px] pointer-events-none rounded-full" />

        {/* Badge Slogan */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium mb-6 animate-fade-up">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          <span>La solution moderne de gestion pour blanchisseries et pressings</span>
        </div>

        {/* Grand Titre */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl mx-auto animate-fade-up">
          Pilotez votre pressing avec <span className="bg-gradient-to-r from-[#2563EB] via-blue-400 to-[#16A34A] bg-clip-text text-transparent">simplicité &amp; efficacité</span>
        </h1>

        {/* Description */}
        <p className="mt-5 text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
          Gérez vos clients, vos commandes, votre suivi en atelier et générez vos factures PDF professionnelles. Fonctionne sur ordinateur et smartphone, même sans connexion.
        </p>

        {/* Boutons d'action principaux (CTAs) */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <Link href="/auth/register" className="w-full sm:w-auto flex-1">
            <Button variant="secondary" size="lg" className="w-full gap-2.5 font-extrabold text-sm py-3.5 shadow-xl shadow-blue-600/30 hover:scale-[1.02] transition-transform">
              <span>Commencer Gratuitement</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Link href="/auth/login" className="w-full sm:w-auto flex-1">
            <Button variant="outline" size="lg" className="w-full gap-2 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white font-bold text-sm py-3.5">
              <span>Se Connecter</span>
            </Button>
          </Link>
        </div>

        {/* Garanties clés */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#16A34A]" /> Sécurisé &amp; Fiable</span>
          <span className="flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-[#2563EB]" /> Compatible PWA Mobile &amp; Desktop</span>
          <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-400" /> Prise en main instantanée</span>
        </div>

        {/* AROBO / PRODUCT PREVIEW MOCKUP */}
        <div className="mt-14 relative max-w-5xl mx-auto rounded-3xl p-3 bg-slate-800/50 border border-slate-700/60 shadow-2xl backdrop-blur-xl">
          <div className="bg-[#0F172A] rounded-2xl p-4 sm:p-6 text-left space-y-4 overflow-hidden border border-slate-800">
            {/* Header Mockup */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-400 ml-2 font-mono">dashboard.nora-pressing.app</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ● En ligne
              </span>
            </div>

            {/* Simulated Dashboard Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Chiffre d&apos;Affaires</p>
                <p className="text-lg font-black text-white mt-1">245 000 FCFA</p>
                <span className="text-[9px] font-bold text-emerald-400">+12% ce mois</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Commandes</p>
                <p className="text-lg font-black text-blue-400 mt-1">48 réceptions</p>
                <span className="text-[9px] font-bold text-slate-400">Atelier actif</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Clients Enregistrés</p>
                <p className="text-lg font-black text-emerald-400 mt-1">112 fiches</p>
                <span className="text-[9px] font-bold text-slate-400">Base propre</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Factures PDF</p>
                <p className="text-lg font-black text-purple-400 mt-1">Automatique</p>
                <span className="text-[9px] font-bold text-slate-400">QR Code inclus</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FONCTIONNALITÉS PRINCIPALES ─────────────────────────────── */}
      <section className="py-16 px-4 lg:px-8 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Tout ce dont votre pressing a besoin
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Découvrez les fonctionnalités clés conçues pour simplifier votre quotidien et booster la rentabilité de votre établissement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Carte 1 : Clients */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-3 card-lift hover:border-[#2563EB]">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-[#2563EB] flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Gestion des Clients</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Centralisez les coordonnées de vos clients, suivez leur historique de dépôts, leur fidélité et leurs préférences de nettoyage.
              </p>
            </div>

            {/* Carte 2 : Commandes */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-3 card-lift hover:border-[#16A34A]">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-[#16A34A] flex items-center justify-center font-bold">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Suivi des Commandes</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Suivez les étapes de traitement en temps réel dans votre atelier : Reçu ➔ Lavage ➔ Repassage ➔ Prêt ➔ Livré.
              </p>
            </div>

            {/* Carte 3 : Factures PDF */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-3 card-lift hover:border-purple-500">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Facturation PDF Automatique</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Générez et imprimez des factures professionnelles avec le logo de votre pressing, le détail des articles et un QR Code.
              </p>
            </div>

            {/* Carte 4 : Tableau de bord */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-3 card-lift hover:border-amber-500">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Tableau de Bord &amp; Stats</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Analysez votre chiffre d&apos;affaires, suivez vos charges opérationnelles et calculez automatiquement votre bénéfice net.
              </p>
            </div>

            {/* Carte 5 : Paiements */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-3 card-lift hover:border-rose-500">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Gestion des Paiements</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Gérez les acomptes versés lors du dépôt, suivez les solde restants et identifiez rapidement les montants impayés.
              </p>
            </div>

            {/* Carte 6 : PWA */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-3 card-lift hover:border-cyan-500">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Application PWA Installable</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Installez l&apos;application directement sur votre ordinateur ou votre téléphone Android/iOS pour un accès rapide.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── BANNIERE D'APPEL A L'ACTION (CTA FINAL) ─────────────────── */}
      <section className="py-16 px-4 lg:px-8 max-w-5xl mx-auto w-full text-center">
        <div className="bg-gradient-to-r from-[#2563EB]/20 via-blue-600/20 to-[#16A34A]/20 border border-blue-500/30 rounded-3xl p-8 sm:p-12 space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Prêt à moderniser votre pressing dès aujourd&apos;hui ?
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto">
            Rejoignez Nora Pressing et bénéficiez d&apos;un outil de gestion complet, rapide et intuitif pour développer votre activité.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto pt-2">
            <Link href="/auth/register" className="w-full sm:w-auto flex-1">
              <Button variant="secondary" size="lg" className="w-full gap-2 font-extrabold text-sm shadow-xl">
                <span>Commencer</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/auth/login" className="w-full sm:w-auto flex-1">
              <Button variant="outline" size="lg" className="w-full text-slate-300 border-slate-700 hover:bg-slate-800 font-bold text-sm">
                <span>Se connecter</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── PIED DE PAGE (FOOTER) ───────────────────────────────────── */}
      <footer className="mt-auto border-t border-slate-800 bg-[#0F172A] py-8 px-4 lg:px-8 text-center text-xs text-slate-400 space-y-4">
        <div className="flex items-center justify-center gap-2">
          <img src="/assets/logo.jpg" alt="Nora" className="w-6 h-6 rounded-md object-cover" />
          <span className="font-bold text-slate-300">Nora Pressing</span>
        </div>
        <p>© {new Date().getFullYear()} Nora Pressing — Tous droits réservés.</p>
        <div className="flex items-center justify-center gap-4 text-slate-400">
          <Link href="/install" className="hover:text-white transition-colors">Installer l&apos;application PWA</Link>
          <span>•</span>
          <Link href="/auth/login" className="hover:text-white transition-colors">Espace Gérant</Link>
          <span>•</span>
          <Link href="/auth/register" className="hover:text-white transition-colors">Créer un Compte</Link>
        </div>
      </footer>

    </div>
  );
}
