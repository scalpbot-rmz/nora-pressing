'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, Users, Tag, Receipt,
  Settings, PlusCircle, Smartphone, LogOut, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearAuthSession } from '@/lib/auth';

interface SidebarProps {
  pressingName?: string;
  logoUrl?: string;
}

const NAV = [
  { href: '/dashboard',            label: 'Tableau de bord',      icon: LayoutDashboard },
  { href: '/dashboard/orders',     label: 'Commandes',            icon: ShoppingBag },
  { href: '/dashboard/customers',  label: 'Clients',              icon: Users },
  { href: '/dashboard/offers',     label: 'Offres & Tarifs',      icon: Tag },
  { href: '/dashboard/expenses',   label: 'Dépenses',             icon: Receipt },
  { href: '/dashboard/settings',   label: 'Paramètres',           icon: Settings },
  { href: '/install',              label: "Installer l'appli",    icon: Smartphone },
];

export function Sidebar({ pressingName = 'Nora Pressing', logoUrl }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = () => {
    clearAuthSession();
    router.push('/auth/login');
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#0F172A] text-slate-300 min-h-screen border-r border-white/5 p-4 sticky top-0 h-screen shadow-xl">

      {/* ─── Brand ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-2 py-4 mb-4 border-b border-white/10">
        <img
          src={logoUrl || "/assets/logo.jpg"}
          alt="Logo"
          className="w-10 h-10 rounded-xl object-cover ring-2 ring-[#2563EB]/60 shadow-lg shrink-0"
        />
        <div className="overflow-hidden flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <img src="/assets/logo.jpg" alt="Nora" className="w-4 h-4 rounded-sm object-cover" />
            <span className="font-extrabold text-white text-base tracking-tight">Nora</span>
            <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
          </div>
          <p className="text-xs text-slate-400 truncate">{pressingName}</p>
        </div>
      </div>

      {/* ─── Bouton action rapide ───────────────────────────── */}
      <div className="mb-5 px-1">
        <Link
          href="/dashboard/orders/new"
          className="flex items-center justify-center gap-2 w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1e40af] text-white py-2.5 px-4 rounded-xl text-sm font-semibold shadow-lg transition-all active:scale-[0.97]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nouvelle commande</span>
        </Link>
      </div>

      {/* ─── Navigation ────────────────────────────────────── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                active
                  ? 'bg-[#2563EB] text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className={cn('w-4.5 h-4.5 shrink-0', active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300')} />
              <span className="truncate">{label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
            </Link>
          );
        })}
      </nav>

      {/* ─── Déconnexion ───────────────────────────────────── */}
      <div className="pt-4 border-t border-white/10 mt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all group"
        >
          <LogOut className="w-4.5 h-4.5 shrink-0 group-hover:scale-110 transition-transform" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
