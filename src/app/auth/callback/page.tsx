'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { setAuthSession } from '@/lib/auth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Validation de votre authentification...');

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session?.user) {
          setAuthSession(session.user.id, session.user.email || '');
          setMessage('Authentification réussie ! Redirection...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        } else {
          router.push('/auth/login');
        }
      } catch (err: any) {
        console.error('Erreur callback auth:', err);
        setMessage('Erreur d’authentification. Redirection vers la connexion...');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    }

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white px-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm font-semibold text-slate-300">{message}</p>
    </div>
  );
}
