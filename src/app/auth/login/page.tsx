'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Lock, Mail, ArrowRight } from 'lucide-react';
import { setAuthSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setIsLoading(true);

    // Pose le cookie de session → le middleware autorisera l'accès au dashboard
    setAuthSession(email);

    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo & Titre */}
        <div className="text-center space-y-2">
          <img
            src="/assets/logo.jpg"
            alt="Nora Logo"
            className="w-16 h-16 rounded-2xl mx-auto shadow-xl ring-4 ring-slate-800 object-cover"
          />
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-1.5">
            Nora Pressing <Sparkles className="w-4 h-4 text-[#16A34A]" />
          </h1>
          <p className="text-sm text-slate-400">
            Gestion intelligente de pressing &amp; blanchisserie
          </p>
        </div>

        <Card className="shadow-2xl border-slate-800">
          <CardBody className="p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-900 text-center">Connexion à votre Espace</h2>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-[38px] text-slate-400 pointer-events-none" />
                <Input
                  type="email"
                  label="Adresse Email"
                  placeholder="nom@pressing.com"
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
                  label="Mot de Passe"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#2563EB]" />
                  Se souvenir de moi
                </label>
                <Link href="/auth/reset-password" className="text-[#2563EB] hover:underline font-semibold">
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="lg"
                className="w-full gap-2 font-bold shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Se Connecter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
              Vous n&apos;avez pas d&apos;espace pressing ?{' '}
              <Link href="/auth/register" className="text-[#2563EB] font-bold hover:underline">
                Créer un compte
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
