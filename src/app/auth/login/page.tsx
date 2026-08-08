'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await loginUser({ email, password });
      setLoading(false);

      if (res.success) {
        router.push('/dashboard');
      } else {
        setError(res.error || 'Adresse e-mail ou mot de passe incorrect.');
      }
    } catch (err: any) {
      setLoading(false);
      setError('Impossible de se connecter. Veuillez vérifier vos identifiants.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 space-y-6 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#16A34A] flex items-center justify-center text-white font-black text-xl mx-auto shadow-lg mb-3">
            N
          </div>
          <h1 className="text-2xl font-extrabold text-white">Se connecter</h1>
          <p className="text-sm text-slate-400">
            Accédez à votre tableau de bord Nora Pressing
          </p>
        </div>

        {/* Erreurs & Notifications */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl px-4 py-3 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Champs */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Adresse e-mail
            </label>
            <Input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Mot de passe
              </label>
              <Link
                href="/auth/reset-password"
                className="text-[11px] text-[#2563EB] font-semibold hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </div>

        <Button type="submit" variant="secondary" className="w-full font-bold py-3" disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </Button>

        <p className="text-center text-xs text-slate-400">
          Pas encore de compte ?{' '}
          <Link href="/auth/register" className="text-[#2563EB] font-semibold hover:underline">
            Créer un compte
          </Link>
        </p>
      </form>
    </div>
  );
}
