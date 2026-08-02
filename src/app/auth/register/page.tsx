'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, ArrowRight, User, Mail, Lock } from 'lucide-react';
import { setAuthSession } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Veuillez saisir votre nom complet.');
      return;
    }
    if (!email) {
      setError('Veuillez saisir une adresse email.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);

    // Pose le cookie de session → /onboarding sera accessible (route protégée)
    setAuthSession(email);

    setTimeout(() => {
      setIsLoading(false);
      router.push('/onboarding');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 py-8">
      <div className="max-w-md w-full space-y-6">
        {/* Logo & Titre */}
        <div className="text-center space-y-2">
          <img
            src="/assets/logo.jpg"
            alt="Nora Logo"
            className="w-16 h-16 rounded-2xl mx-auto shadow-xl ring-4 ring-slate-800 object-cover"
          />
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-1.5">
            Créer un Espace Nora <Sparkles className="w-4 h-4 text-[#16A34A]" />
          </h1>
          <p className="text-sm text-slate-400">
            Inscrivez votre pressing et commencez à gérer vos commandes
          </p>
        </div>

        <Card className="shadow-2xl border-slate-800">
          <CardBody className="p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-900 text-center">Inscription Administrateur</h2>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-[38px] text-slate-400 pointer-events-none" />
                <Input
                  label="Nom Complet"
                  placeholder="ex: M. Jean Dupont"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-[38px] text-slate-400 pointer-events-none" />
                <Input
                  type="email"
                  label="Adresse Email"
                  placeholder="gerant@pressing.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-[38px] text-slate-400 pointer-events-none" />
                <Input
                  type="password"
                  label="Mot de passe"
                  placeholder="••••••••  (min. 6 caractères)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-[38px] text-slate-400 pointer-events-none" />
                <Input
                  type="password"
                  label="Confirmer le mot de passe"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full gap-2 font-bold shadow-lg mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Création de votre espace...</span>
                  </>
                ) : (
                  <>
                    <span>Continuer vers l&apos;Onboarding</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
              Vous avez déjà un compte ?{' '}
              <Link href="/auth/login" className="text-[#2563EB] font-bold hover:underline">
                Se connecter
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
