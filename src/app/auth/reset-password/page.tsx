'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#16A34A] flex items-center justify-center font-black text-white text-2xl mx-auto shadow-xl ring-4 ring-slate-800">
            N
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-1.5">
            Réinitialisation du Mot de Passe
          </h1>
        </div>

        <Card className="shadow-2xl border-slate-800">
          <CardBody className="p-6 space-y-6">
            {isSent ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="w-12 h-12 text-[#16A34A] mx-auto" />
                <h2 className="text-lg font-bold text-slate-900">Email envoyé !</h2>
                <p className="text-xs text-slate-600">
                  Un lien de réinitialisation a été envoyé à <strong>{email}</strong>. Veuillez consulter votre boîte de réception.
                </p>
                <Link href="/auth/login">
                  <Button variant="outline" className="mt-4 gap-2 w-full">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour à la connexion</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-slate-600">
                  Saisissez l'adresse email associée à votre compte pressing pour recevoir les instructions de réinitialisation.
                </p>

                <Input
                  type="email"
                  label="Adresse Email"
                  placeholder="gerant@pressing.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Button type="submit" variant="secondary" size="lg" className="w-full font-bold shadow-lg">
                  Envoyer le Lien de Récupération
                </Button>

                <div className="pt-4 border-t border-slate-100 text-center">
                  <Link href="/auth/login" className="text-xs text-slate-500 hover:text-slate-900 flex items-center justify-center gap-1.5 font-medium">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour à la connexion</span>
                  </Link>
                </div>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
