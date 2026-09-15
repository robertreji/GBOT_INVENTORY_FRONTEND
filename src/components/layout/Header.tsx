'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingBag, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { totalCount } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/logo.png"
            alt="GBOT Logo"
            width={36}
            height={36}
            className="rounded-xl group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
              GBOT
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              GECW Lab Inventory
            </span>
          </div>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Reservation Cart Button */}
          <Link
            href="/reservations/new"
            className="relative p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Reservation Basket"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center animate-in zoom-in-50">
                {totalCount}
              </span>
            )}
          </Link>

          {/* Admin Tag */}
          {isAdmin && (
            <Link
              href="/admin"
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                pathname.startsWith('/admin')
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : 'text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </Link>
          )}

          {/* User Profile / Login */}
          {isAuthenticated ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
            >
              {user?.profileImg ? (
                <img
                  src={user.profileImg}
                  alt={user.name}
                  className="w-7 h-7 rounded-lg object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
                  {user?.name?.split(' ')[0]}
                </span>
                <span className="text-[10px] text-zinc-500 leading-none mt-0.5">
                  Yr {user?.year || 1} • {user?.department || 'ECE'}
                </span>
              </div>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

