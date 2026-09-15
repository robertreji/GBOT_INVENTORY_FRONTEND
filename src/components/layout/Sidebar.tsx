'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Layers,
  CalendarClock,
  Handshake,
  User,
  ShieldCheck,
  Package,
  FolderTree,
  Repeat,
  Users,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, logout } = useAuth();

  const mainLinks = [
    { label: 'Home Dashboard', href: '/', icon: Home, exact: true },
    { label: 'Components Catalog', href: '/catalog', icon: Layers },
    { label: 'My Reservations', href: '/reservations', icon: CalendarClock },
    { label: 'My Borrows & Returns', href: '/borrows', icon: Handshake },
    { label: 'My Profile', href: '/profile', icon: User },
  ];

  const adminLinks = [
    { label: 'Admin Hub', href: '/admin', icon: ShieldCheck, exact: true },
    { label: 'Inventory Items', href: '/admin/components', icon: Package },
    { label: 'Categories', href: '/admin/categories', icon: FolderTree },
    { label: 'All Reservations', href: '/admin/reservations', icon: CalendarClock },
    { label: 'Borrows & Checkouts', href: '/admin/borrows', icon: Handshake },
    { label: 'Renewal Requests', href: '/admin/renewals', icon: Repeat },
    { label: 'Student Users', href: '/admin/users', icon: Users },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 shrink-0 h-[calc(100vh-3.75rem)] sticky top-15 overflow-y-auto">
      {/* Student Nav */}
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase px-3 mb-1">
          Student Portal
        </span>
        {mainLinks.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Admin Nav */}
      {isAdmin && (
        <div className="flex flex-col gap-1 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <span className="text-[11px] font-semibold tracking-wider text-amber-600 dark:text-amber-400 uppercase px-3 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Lab Management
          </span>
          {adminLinks.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer / Logout */}
      {isAuthenticated && (
        <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
};

