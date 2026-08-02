'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  Users,
  Receipt,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearAuthSession } from '@/lib/auth';

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
    { href: '/dashboard/orders', label: 'Commandes', icon: ShoppingBag },
    { href: '/dashboard/orders/new', label: 'Créer', icon: PlusCircle, isMain: true },
    { href: '/dashboard/customers', label: 'Clients', icon: Users },
    { href: '/dashboard/expenses', label: 'Dépenses', icon: Receipt },
  ];

  const handleLogout = () => {
    clearAuthSession();
    router.push('/auth/login');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F172A] text-slate-400 border-t border-slate-800 shadow-2xl px-1 py-2">
      <div className="flex items-center justify-around max-w-2xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' &&
              pathname.startsWith(item.href) &&
              item.href !== '/dashboard/orders/new');

          if (item.isMain) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#16A34A] flex items-center justify-center text-white shadow-xl ring-4 ring-[#0F172A] active:scale-95 transition-transform">
                  <PlusCircle className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-bold text-white mt-1">Créer</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all',
                isActive ? 'text-[#2563EB] font-bold' : 'text-slate-400 hover:text-white'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-0.5', isActive && 'text-[#2563EB] scale-110')} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* Bouton Déconnexion mobile */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-rose-400 transition-all"
          title="Déconnexion"
        >
          <LogOut className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Sortir</span>
        </button>
      </div>
    </nav>
  );
}
