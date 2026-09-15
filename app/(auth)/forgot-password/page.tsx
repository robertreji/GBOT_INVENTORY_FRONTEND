'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { authApi } from '@/src/api/auth.api';
import { useToast } from '@/src/context/ToastContext';
import { ApiError } from '@/src/types/api.types';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.endsWith('@gecwyd.ac.in')) {
      toast.error('Please enter a valid college email address (@gecwyd.ac.in)');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setSubmitted(true);
      toast.success('Password reset link sent to your email.');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to send reset link.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Reset Password</h2>
        <p className="text-xs text-zinc-500">
          Enter your registered college email to receive a password reset link
        </p>
      </div>

      {submitted ? (
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Check your inbox! We sent password reset instructions to <span className="font-semibold">{email}</span>.
          </p>
          <Link href="/login" className="mt-2 text-xs font-semibold text-emerald-600 hover:underline">
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="College Email"
            type="email"
            placeholder="student@gecwyd.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            autoFocus
          />

          <Button type="submit" variant="primary" isLoading={isLoading} className="w-full mt-1">
            <Send className="w-4 h-4" />
            <span>Send Reset Link</span>
          </Button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

