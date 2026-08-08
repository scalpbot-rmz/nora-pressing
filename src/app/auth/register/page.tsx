'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (fullName.trim().length < 2) {
      setError('Le nom du pressing doit contenir au moins 2 caractères.');
      setLoading(false);
      return;
    }

    try {
      const res = await registerUser({
        fullName: fullName.trim(),
        email,
        password,
      });

      setLoading(false);
      if (res.success) {
        // Redirection directe vers le tableau de bord
        router.push('/dashboard');
      } else {
        setError(res.error || 'Erreur lors de l’inscription.');
      }
    } catch (err: any) {
      setLoading(false);
      setError('Erreur lors de l’inscription. Veuillez réessayer.');
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
          <h1 className="text-2xl font-extrabold text-white">
            Créer un compte
          </h1>
          <p className="text-sm text-slate-400">
            Inscrivez votre pressing sur Nora
          </p>
        </div>

        {/* Erreurs */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl px-4 py-3 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Champs */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Nom du pressing
            </label>
            <Input
              type="text"
              placeholder="Pressing Excellence"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
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
            <label className="text-xs font-semibold text-slate-300">
              Mot de passe
            </label>
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

        <Button
          type="submit"
          variant="secondary"
          className="w-full font-bold py-3"
          disabled={loading}
        >
          {loading ? 'Création en cours…' : 'Créer un compte'}
        </Button>

        <p className="text-center text-xs text-slate-400">
          Déjà un compte ?{' '}
          <Link
            href="/auth/login"
            className="text-[#2563EB] font-semibold hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
