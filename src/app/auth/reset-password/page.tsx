'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { requestPasswordReset } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Pour le cas où l'utilisateur revient via le lien du mail de réinitialisation
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    // Détecter si on est dans un hash/session de réinitialisation
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setIsUpdateMode(true);
    }
  }, []);

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await requestPasswordReset(email);
    setLoading(false);

    if (res.success) {
      setSent(true);
    } else {
      setError(res.error || 'Erreur lors de l’envoi de l’e-mail de réinitialisation.');
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) throw updateErr;

      setUpdateSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Impossible de mettre à jour le mot de passe.');
    } finally {
      setLoading(false);
    }
  }

  if (isUpdateMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4 py-8">
        <form
          onSubmit={handleUpdatePassword}
          className="w-full max-w-md bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 space-y-6 shadow-2xl"
        >
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30 mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Nouveau mot de passe</h1>
            <p className="text-sm text-slate-400">Définissez votre nouveau mot de passe sécurisé</p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl px-4 py-2.5 text-xs font-medium text-center">
              {error}
            </div>
          )}

          {updateSuccess ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-4 text-xs font-semibold text-center flex flex-col items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <span>Mot de passe réinitialisé avec succès ! Redirection en cours...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Nouveau mot de passe</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Confirmer le mot de passe</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" variant="secondary" className="w-full font-bold py-3" disabled={loading}>
                {loading ? 'Enregistrement…' : 'Enregistrer le nouveau mot de passe'}
              </Button>
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4 py-8">
      <div className="w-full max-w-md bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 space-y-6 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30 mb-2">
          <KeyRound className="w-6 h-6" />
        </div>

        <h1 className="text-2xl font-extrabold text-white">Réinitialiser le mot de passe</h1>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl px-4 py-2.5 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {sent ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold">
              Si un compte existe avec l’adresse <strong className="text-white">{email}</strong>, un e-mail de réinitialisation sécurisé vient d’être envoyé.
            </div>
            <p className="text-xs text-slate-400">
              Vérifiez vos boîtes de réception (et vos spams) puis cliquez sur le lien.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRequestReset} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Adresse e-mail</label>
              <Input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="secondary" className="w-full font-bold py-3" disabled={loading}>
              {loading ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
            </Button>
          </form>
        )}

        <div className="pt-2">
          <Link href="/auth/login" className="text-xs text-[#2563EB] font-bold hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
