'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  ShieldCheck,
  Package,
  FolderTree,
  CalendarClock,
  Handshake,
  Repeat,
  Users,
} from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { Button } from '@/src/components/ui/Button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAdmin, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
      </div>
    );
  }

  // Not Admin Guard
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Admin Access Required
        </h2>
        <p className="text-xs text-zinc-500 leading-relaxed">
          You need lab administrator privileges (<code className="font-mono text-xs">role: admin</code>) to access the inventory console.
        </p>
        <div className="flex gap-2 mt-2">
          <Link href="/">
            <Button size="sm" variant="outline">
              Return Home
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm" variant="primary">
              Sign In as Admin
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const adminNav = [
    { label: 'Overview', href: '/admin', exact: true },
    { label: 'Components', href: '/admin/components' },
    { label: 'Categories', href: '/admin/categories' },
    { label: 'Reservations', href: '/admin/reservations' },
    { label: 'Borrows & Returns', href: '/admin/borrows' },
    { label: 'Renewals', href: '/admin/renewals' },
    { label: 'Users', href: '/admin/users' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Admin Subheader on mobile/tablet */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-zinc-200 dark:border-zinc-800 no-scrollbar">
        {adminNav.map((tab) => {
          const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}

