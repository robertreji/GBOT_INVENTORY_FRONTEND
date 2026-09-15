'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-radial from-sky-50/50 via-zinc-50 to-zinc-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-black">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <Link href="/" className="flex items-center gap-2.5 mb-2 group">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/30 group-hover:scale-105 transition-transform">
            <Cpu className="w-7 h-7" />
          </div>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          GBOT Inventory
        </h1>
        <p className="text-xs text-zinc-500 font-medium">
          Govt Engineering College Wayanad
        </p>
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8">
        {children}
      </div>

      {/* Footer info */}
      <p className="mt-8 text-xs text-zinc-400 text-center">
        Restricted to verified college members (<span className="font-mono text-zinc-500">@gecwyd.ac.in</span>)
      </p>
    </div>
  );
}

