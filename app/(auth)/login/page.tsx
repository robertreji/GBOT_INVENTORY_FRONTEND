'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, LogIn, Hash } from 'lucide-react';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { ApiError } from '@/src/types/api.types';

type LoginMode = 'email' | 'admission';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();

  const [loginMode, setLoginMode] = useState<LoginMode>('email');
  const [email, setEmail] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (loginMode === 'email') {
      if (!email) {
        errs.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errs.email = 'A valid email address is required';
      }
    } else {
      if (!admissionNumber.trim()) {
        errs.admissionNumber = 'Admission number is required';
      }
    }

    if (!password) errs.password = 'Password is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (loginMode === 'email') {
        await login({ email: email.trim(), password });
      } else {
        await login({ admissionNumber: admissionNumber.trim().toUpperCase(), password });
      }
      toast.success('Welcome back!');
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.validationErrors && Object.keys(err.validationErrors).length > 0) {
          setErrors(err.validationErrors);
        } else {
          toast.error(err.message || 'Login failed. Please check your credentials.');
        }
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = (mode: LoginMode) => {
    setLoginMode(mode);
    setErrors({});
    setEmail('');
    setAdmissionNumber('');
    setPassword('');
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Sign in to your account</h2>
        <p className="text-xs text-zinc-500">Access college equipment reservations &amp; borrowed items</p>
      </div>

      {/* Login Mode Toggle */}
      <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <button
          type="button"
          onClick={() => handleModeSwitch('email')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors duration-200 ${
            loginMode === 'email'
              ? 'bg-emerald-600 text-white'
              : 'bg-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Email Login
        </button>
        <div className="w-px bg-zinc-200 dark:bg-zinc-700" />
        <button
          type="button"
          onClick={() => handleModeSwitch('admission')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors duration-200 ${
            loginMode === 'admission'
              ? 'bg-emerald-600 text-white'
              : 'bg-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          Admission No.
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {loginMode === 'email' ? (
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
            error={errors.email}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
            autoFocus
          />
        ) : (
          <Input
            label="Admission Number"
            placeholder="e.g. GEC2024CS001"
            value={admissionNumber}
            onChange={(e) => {
              setAdmissionNumber(e.target.value);
              if (errors.admissionNumber) setErrors((prev) => ({ ...prev, admissionNumber: '' }));
            }}
            error={errors.admissionNumber}
            leftIcon={<Hash className="w-4 h-4" />}
            autoComplete="off"
            autoFocus
          />
        )}

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
            }}
            error={errors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            autoComplete="current-password"
          />
          <div className="flex justify-end mt-1.5">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" variant="primary" isLoading={isLoading} className="w-full mt-1">
          <LogIn className="w-4 h-4" />
          <span>Sign In</span>
        </Button>
      </form>

      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline">
          Register with college ID
        </Link>
      </div>
    </div>
  );
}
