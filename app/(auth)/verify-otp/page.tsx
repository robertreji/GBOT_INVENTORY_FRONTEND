'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, RotateCcw, ArrowRight } from 'lucide-react';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { ApiError } from '@/src/types/api.types';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp, resendOtp } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const qEmail = searchParams.get('email');
    if (qEmail) setEmail(qEmail);
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !token) {
      toast.error('Please provide both email and the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp({ email: email.trim(), token: token.trim() });
      toast.success('Account verified successfully!');
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || 'Invalid or expired OTP');
      } else {
        toast.error('Verification failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your college email');
      return;
    }

    setIsResending(true);
    try {
      await resendOtp(email.trim());
      toast.success('A new verification code has been sent to your email.');
      setCountdown(60);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to resend OTP.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-1">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Verify Your Email</h2>
        <p className="text-xs text-zinc-500">
          Enter the verification code sent to your college inbox
        </p>
      </div>

      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <Input
          label="College Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="student@gecwyd.ac.in"
        />

        <div>
          <Input
            label="Verification Code (OTP)"
            type="text"
            maxLength={8}
            placeholder="123456"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/[^0-9]/g, ''))}
            className="text-center font-mono text-lg tracking-widest"
            autoFocus
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-zinc-400">
              {countdown > 0 ? `Resend in ${countdown}s` : "Didn't receive the code?"}
            </span>
            <button
              type="button"
              disabled={countdown > 0 || isResending}
              onClick={handleResend}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Resend OTP</span>
            </button>
          </div>
        </div>

        <Button type="submit" variant="primary" isLoading={isLoading} className="w-full mt-2">
          <span>Complete Verification</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-400">Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}

