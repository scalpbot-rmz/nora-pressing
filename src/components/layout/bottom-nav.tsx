'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  Users,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard',            label: 'Accueil',   icon: LayoutDashboard },
  { href: '/dashboard/orders',     label: 'Commandes', icon: ShoppingBag },
  { href: '/dashboard/orders/new', label: 'Créer',     icon: PlusCircle, isMain: true },
  { href: '/dashboard/customers',  label: 'Clients',   icon: Users },
  { href: '/dashboard/offers',     label: 'Offres',    icon: Tag },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    /* Barre flottante — marges latérales + bas */
    <nav className="fixed bottom-3 left-3 right-3 z-50 pointer-events-none">
      <div
        className="
          max-w-sm mx-auto
          bg-white/95 backdrop-blur-md
          rounded-[26px]
          border border-slate-200/70
          shadow-[0_8px_40px_rgba(15,23,42,0.14),0_2px_8px_rgba(15,23,42,0.06)]
          px-2 py-2
          pointer-events-auto
        "
      >
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' &&
                pathname.startsWith(item.href) &&
                item.href !== '/dashboard/orders/new');

            /* Bouton central "Créer" */
            if (item.isMain) {
              const isCurrent = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center gap-0.5 -mt-6"
                >
                  <div
                    className={cn(
                      'w-14 h-14 rounded-[20px] flex items-center justify-center text-white shadow-lg',
                      'transition-all duration-200 active:scale-95',
                      isCurrent
                        ? 'bg-gradient-to-br from-[#1d4ed8] to-[#15803d] shadow-[#2563EB]/30'
                        : 'bg-gradient-to-br from-[#2563EB] to-[#16A34A] shadow-[#2563EB]/25',
                    )}
                    style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.35)' }}
                  >
                    <PlusCircle className="w-7 h-7" strokeWidth={2.2} />
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-bold tracking-tight mt-0.5',
                      isCurrent ? 'text-[#2563EB]' : 'text-slate-500',
                    )}
                  >
                    Créer
                  </span>
                </Link>
              );
            }

            /* Onglets normaux */
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5',
                  'px-3 py-1.5 rounded-[18px]',
                  'transition-all duration-200',
                  isActive
                    ? 'text-[#2563EB]'
                    : 'text-slate-400 hover:text-slate-600',
                )}
              >
                {/* Fond de l'onglet actif */}
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-[18px] bg-[#EFF6FF]"
                    style={{ zIndex: -1 }}
                  />
                )}

                <Icon
                  className={cn(
                    'transition-all duration-200',
                    isActive ? 'w-[22px] h-[22px] text-[#2563EB]' : 'w-5 h-5',
                  )}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
                <span
                  className={cn(
                    'text-[10px] tracking-tight',
                    isActive ? 'font-bold text-[#2563EB]' : 'font-medium',
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
