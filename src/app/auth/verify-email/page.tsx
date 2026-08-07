'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resendVerificationEmail } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setMsg(null);

    const res = await resendVerificationEmail(email);
    setLoading(false);

    if (res.success) {
      setMsg('Un e-mail de confirmation vient de vous être renvoyé !');
    } else {
      setMsg(res.error || 'Erreur lors du renvoi de l’e-mail.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4 py-8">
      <div className="w-full max-w-md bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 space-y-6 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30">
          <Mail className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white">Vérification de l’adresse e-mail</h1>
          <p className="text-sm text-slate-400">
            La vérification de votre e-mail est obligatoire pour utiliser pleinement Nora Pressing.
          </p>
        </div>

        {msg && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-semibold">
            {msg}
          </div>
        )}

        <form onSubmit={handleResend} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Votre adresse e-mail</label>
            <Input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" variant="secondary" className="w-full font-bold py-3" disabled={loading}>
            {loading ? 'Envoi...' : 'Renvoyer le lien de vérification'}
          </Button>
        </form>

        <div className="pt-2">
          <Link href="/auth/login" className="text-xs text-[#2563EB] font-bold hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
