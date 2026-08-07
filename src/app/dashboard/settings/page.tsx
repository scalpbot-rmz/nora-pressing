'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNoraStore } from '@/lib/store';
import { clearAuthSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogoUploader } from '@/components/ui/logo-uploader';
import {
  Settings,
  Store,
  Phone,
  Receipt,
  Check,
  RotateCcw,
  LogOut,
  KeyRound,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { pressing, updatePressing, isLoaded } = useNoraStore();

  const handleLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      clearAuthSession();
      router.push('/auth/login');
    }
  };

  const [name, setName] = useState(pressing.name || '');
  const [logoUrl, setLogoUrl] = useState(pressing.logo_url || '');
  const [phonePrimary, setPhonePrimary] = useState(pressing.phone_primary || '');
  const [phoneSecondary, setPhoneSecondary] = useState(pressing.phone_secondary || '');
  const [email, setEmail] = useState(pressing.email || '');
  const [address, setAddress] = useState(pressing.address || '');
  const [city, setCity] = useState(pressing.city || 'Douala');
  const [currency, setCurrency] = useState(pressing.currency || 'FCFA');
  const [invoicePrefix, setInvoicePrefix] = useState(pressing.invoice_prefix || 'NOR');
  const [thankYouMessage, setThankYouMessage] = useState(
    pressing.thank_you_message || 'Merci pour votre confiance !'
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Mot de passe state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Synchroniser les formulaires dès que `pressing` est chargé ou mis à jour
  useEffect(() => {
    if (isLoaded && pressing) {
      setName(pressing.name || '');
      setLogoUrl(pressing.logo_url || '');
      setPhonePrimary(pressing.phone_primary || '');
      setPhoneSecondary(pressing.phone_secondary || '');
      setEmail(pressing.email || '');
      setAddress(pressing.address || '');
      setCity(pressing.city || 'Douala');
      setCurrency(pressing.currency || 'FCFA');
      setInvoicePrefix(pressing.invoice_prefix || 'NOR');
      setThankYouMessage(pressing.thank_you_message || 'Merci pour votre confiance !');
    }
  }, [isLoaded, pressing]);

  if (!isLoaded) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Conserver STRICTEMENT le logo_url existant si l'utilisateur n'en a pas choisi un nouveau
    updatePressing({
      name,
      logo_url: logoUrl,
      phone_primary: phonePrimary,
      phone_secondary: phoneSecondary,
      email,
      address,
      city,
      currency,
      invoice_prefix: invoicePrefix,
      thank_you_message: thankYouMessage,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (newPassword.length < 6) {
      setPwdError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('Les mots de passe ne correspondent pas.');
      return;
    }

    setPwdLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        throw new Error('Utilisateur non identifié');
      }

      // Vérifier le mot de passe actuel en tentant une ré-authentification
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyErr) {
        setPwdError('Le mot de passe actuel est incorrect.');
        setPwdLoading(false);
        return;
      }

      // Mettre à jour le mot de passe
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) throw updateErr;

      setPwdSuccess('Mot de passe modifié avec succès !');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdError(err.message || 'Erreur lors de la modification du mot de passe.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('Réinitialiser les paramètres par défaut du pressing ? (Le logo sera conservé)')) {
      setName('Pressing Éclat Plus');
      setPhonePrimary('+237 6 99 88 77 66');
      setPhoneSecondary('+237 6 77 11 22 33');
      setEmail('contact@pressing-eclat.cm');
      setAddress('Rue Joffre, Akwa');
      setCity('Douala');
      setInvoicePrefix('NOR');
      setThankYouMessage('Merci pour votre confiance !');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          Paramètres du Pressing
          <Settings className="w-6 h-6 text-[#2563EB]" />
        </h1>
        <p className="text-sm text-slate-500">
          Configuration générale, identité visuelle, contacts, sécurité et personnalisation des factures PDF
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center gap-2 shadow-sm">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>Paramètres sauvegardés avec succès !</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: INFORMATIONS GÉNÉRALES */}
        <Card>
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 flex items-center gap-2">
            <Store className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-base font-bold text-slate-900">Informations Générales</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Nom du pressing*"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Adresse physique*"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />

            <Input
              label="Ville*"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </CardBody>
        </Card>

        {/* SECTION 2: CONTACTS */}
        <Card>
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 flex items-center gap-2">
            <Phone className="w-5 h-5 text-[#16A34A]" />
            <h2 className="text-base font-bold text-slate-900">Contacts & Service Client</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Téléphone principal*"
              value={phonePrimary}
              onChange={(e) => setPhonePrimary(e.target.value)}
              required
            />

            <Input
              label="Téléphone Service Client (WhatsApp)*"
              value={phoneSecondary}
              onChange={(e) => setPhoneSecondary(e.target.value)}
              required
            />

            <Input
              type="email"
              label="Email professionnel"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </CardBody>
        </Card>

        {/* SECTION 3: IDENTITÉ VISUELLE (UPLOAD LOGO) */}
        <Card>
          <CardHeader className="bg-slate-50/70 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Identité Visuelle</h2>
          </CardHeader>
          <CardBody>
            <LogoUploader
              value={logoUrl}
              onChange={(url) => setLogoUrl(url)}
              pressingName={name}
            />
          </CardBody>
        </Card>

        {/* SECTION 4: FACTURATION */}
        <Card>
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Personnalisation des Factures PDF</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Préfixe des factures"
                placeholder="NOR"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                helperText="Exemple: NOR donnera la facture NOR-2026-001"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Devise monétaire
                </label>
                <input
                  type="text"
                  id="currency-input"
                  list="currency-suggestions"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="ex: FCFA, XAF, €, $"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
                />
                <datalist id="currency-suggestions">
                  <option value="FCFA" />
                  <option value="XAF" />
                  <option value="XOF" />
                  <option value="CFA" />
                  <option value="MAD" />
                  <option value="NGN" />
                  <option value="GHS" />
                  <option value="EUR" />
                  <option value="USD" />
                </datalist>
                <p className="text-[11px] text-slate-400 mt-1">
                  Saisissez librement votre devise. Sera appliquée à toute l’application.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Message de remerciement au pied de page
              </label>
              <Input
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
                placeholder="Merci pour votre confiance !"
              />
            </div>
          </CardBody>
        </Card>

        {/* ACTIONS */}
        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="ghost" onClick={handleReset} className="gap-1.5 text-rose-600 hover:bg-rose-50">
            <RotateCcw className="w-4 h-4" />
            <span>Réinitialiser</span>
          </Button>

          <Button type="submit" variant="secondary" size="lg" className="shadow-lg font-bold">
            Sauvegarder les Paramètres
          </Button>
        </div>
      </form>

      {/* SECTION SÉCURITÉ DU COMPTE (MODIFICATION DE MOT DE PASSE) */}
      <Card>
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Sécurité & Mot de Passe</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            {pwdSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            {pwdError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{pwdError}</span>
              </div>
            )}

            <Input
              type="password"
              label="Mot de passe actuel*"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Nouveau mot de passe*"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />

            <Input
              type="password"
              label="Confirmer le nouveau mot de passe*"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />

            <Button type="submit" variant="outline" className="gap-2 text-slate-700 font-bold border-slate-300" disabled={pwdLoading}>
              <KeyRound className="w-4 h-4" />
              {pwdLoading ? 'Modification...' : 'Changer mon mot de passe'}
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* SECTION DÉCONNEXION */}
      <div className="border-t border-slate-200 pt-6">
        <Card className="border-rose-100 bg-rose-50/30">
          <CardHeader className="bg-rose-50/60 border-b border-rose-100 flex items-center gap-2">
            <LogOut className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-rose-700">Déconnexion</h2>
          </CardHeader>
          <CardBody className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              Fermez votre session en toute sécurité. Vos données synchronisées resteront accessibles sur tous vos appareils.
            </p>
            <Button
              type="button"
              onClick={handleLogout}
              className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
