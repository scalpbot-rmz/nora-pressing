'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNoraStore } from '@/lib/store';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Store, Phone, MapPin, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { updatePressing, isLoaded } = useNoraStore();

  const [name, setName] = useState('Pressing Éclat Plus');
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1545173168-9f1947eebb7f?q=80&w=300&auto=format&fit=crop');
  const [phonePrimary, setPhonePrimary] = useState('+237 6 99 88 77 66');
  const [phoneSecondary, setPhoneSecondary] = useState('+237 6 77 11 22 33');
  const [address, setAddress] = useState('Rue Joffre, Akwa');
  const [city, setCity] = useState('Douala');
  const [email, setEmail] = useState('contact@pressing-eclat.cm');
  const [currency, setCurrency] = useState('FCFA');
  const [isLoading, setIsLoading] = useState(false);

  if (!isLoaded) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    updatePressing({
      name,
      logo_url: logoUrl,
      phone_primary: phonePrimary,
      phone_secondary: phoneSecondary,
      address: `${address}, ${city}`,
      city,
      currency,
    });

    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 py-8">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/assets/logo.jpg"
            alt="Nora Logo"
            className="w-16 h-16 rounded-2xl mx-auto shadow-xl ring-4 ring-slate-800 object-cover"
          />
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-1.5">
            Bienvenue sur Nora <Sparkles className="w-4 h-4 text-[#16A34A]" />
          </h1>
          <p className="text-sm text-slate-400">
            Configurez votre pressing en quelques secondes pour démarrer votre activité
          </p>
        </div>

        <Card className="shadow-2xl border-slate-800">
          <CardBody className="p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Création de l'Espace Pressing
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nom du pressing*"
                  placeholder="ex: Pressing Phénix Akwa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <Input
                  type="email"
                  label="Email professionnel"
                  placeholder="contact@pressing.cm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Input
                  label="Téléphone principal*"
                  placeholder="+237 6 XX XX XX XX"
                  value={phonePrimary}
                  onChange={(e) => setPhonePrimary(e.target.value)}
                  required
                />

                <Input
                  label="Téléphone service client (WhatsApp)"
                  placeholder="+237 6 XX XX XX XX"
                  value={phoneSecondary}
                  onChange={(e) => setPhoneSecondary(e.target.value)}
                />

                <Input
                  label="Adresse physique"
                  placeholder="ex: Rue Joffre, Face Pharmacie"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />

                <Input
                  label="Ville"
                  placeholder="ex: Douala, Yaoundé..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div>
                <Input
                  label="Logo du pressing (URL Supabase Storage)"
                  placeholder="https://..."
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Devise monétaire
                </label>
                <input
                  type="text"
                  id="onboarding-currency"
                  list="onboarding-currency-list"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="ex: FCFA, XAF, €, $"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
                />
                <datalist id="onboarding-currency-list">
                  <option value="FCFA" />
                  <option value="XAF" />
                  <option value="XOF" />
                  <option value="CFA" />
                  <option value="MAD" />
                  <option value="NGN" />
                  <option value="GHS" />
                  <option value="KES" />
                  <option value="DZD" />
                  <option value="TND" />
                  <option value="EGP" />
                  <option value="EUR" />
                  <option value="€" />
                  <option value="USD" />
                  <option value="$" />
                  <option value="GBP" />
                  <option value="£" />
                  <option value="CAD" />
                </datalist>
                <p className="text-[11px] text-slate-400 mt-1">Vous pourrez modifier la devise à tout moment dans les paramètres.</p>
              </div>

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full gap-2 font-bold shadow-lg mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>Initialisation de votre tableau de bord...</span>
                ) : (
                  <>
                    <span>Accéder à mon Tableau de Bord Nora</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
