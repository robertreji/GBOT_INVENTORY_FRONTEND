'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, CheckCircle2 } from 'lucide-react';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { authApi } from '@/src/api/auth.api';
import { useToast } from '@/src/context/ToastContext';
import { ApiError } from '@/src/types/api.types';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [accessToken, setAccessToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check URL query param or hash fragment (Supabase reset link contains access_token)
    const token = searchParams.get('token') || searchParams.get('access_token');
    if (token) {
      setAccessToken(token);
    } else if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashToken = hashParams.get('access_token');
      if (hashToken) setAccessToken(hashToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      toast.error('Recovery token is missing. Please use the link sent to your email.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({ accessToken, newPassword });
      toast.success('Password updated successfully! Please sign in with your new password.');
      router.push('/login');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to reset password');
      } else {
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Set New Password</h2>
        <p className="text-xs text-zinc-500">Create a secure password for your college account</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!accessToken && (
          <Input
            label="Recovery Access Token"
            type="text"
            placeholder="Paste token from email link"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
          />
        )}

        <Input
          label="New Password"
          type="password"
          placeholder="Min 6 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          autoFocus
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="Repeat new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
        />

        <Button type="submit" variant="primary" isLoading={isLoading} className="w-full mt-1">
          <CheckCircle2 className="w-4 h-4" />
          <span>Update Password</span>
        </Button>

        <div className="pt-2 text-center text-xs text-zinc-500">
          <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-400">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

