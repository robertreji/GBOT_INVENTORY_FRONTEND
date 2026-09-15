'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layers, CalendarClock, Handshake, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const navItems = [
    { label: 'Home', href: '/', icon: Home, exact: true },
    { label: 'Catalog', href: '/catalog', icon: Layers },
    { label: 'Reservations', href: '/reservations', icon: CalendarClock },
    { label: 'My Borrows', href: '/borrows', icon: Handshake },
    isAdmin
      ? { label: 'Admin', href: '/admin', icon: ShieldCheck }
      : { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 pb-safe">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center h-full py-1 text-center transition-all ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-normal'
              }`}
            >
              <div
                className={`relative p-1 rounded-xl transition-all ${
                  isActive ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 line-clamp-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

