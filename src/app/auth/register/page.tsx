'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser, resendVerificationEmail } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

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
        if (res.requiresVerification) {
          setIsSuccess(true);
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(res.error || 'Erreur lors de l’inscription.');
      }
    } catch (err: any) {
      setLoading(false);
      setError('Impossible de communiquer avec le serveur. Veuillez vérifier votre connexion.');
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMsg(null);
    try {
      const res = await resendVerificationEmail(email);
      setResending(false);
      if (res.success) {
        setResendMsg('Un nouvel e-mail de confirmation vient de vous être envoyé !');
      } else {
        setResendMsg(res.error || 'Erreur lors du renvoi.');
      }
    } catch {
      setResending(false);
      setResendMsg('Erreur lors du renvoi de l’e-mail.');
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4 py-8">
        <div className="w-full max-w-md bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 space-y-6 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <Mail className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white">Vérification de votre e-mail</h1>
            <p className="text-sm text-slate-300">
              Un e-mail de confirmation a été envoyé à : <br />
              <strong className="text-white">{email}</strong>
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
            <p>
              Veuillez cliquer sur le lien contenu dans l’e-mail pour activer votre compte et accéder à Nora Pressing.
            </p>
          </div>

          {resendMsg && (
            <p className="text-xs font-semibold text-emerald-400">{resendMsg}</p>
          )}

          <div className="space-y-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full text-slate-300 border-slate-700 hover:bg-slate-800"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Renvoi en cours...' : 'Renvoyer l’e-mail de vérification'}
            </Button>

            <Link href="/auth/login" className="block text-xs text-[#2563EB] font-bold hover:underline">
              Aller à la page de connexion
            </Link>
          </div>
        </div>
      </div>
    );
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
          {loading ? 'Inscription…' : 'Créer un compte'}
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
