'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Hash, Lock, Phone, RotateCcw, ShieldCheck, User, UserPlus } from 'lucide-react';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { ApiError } from '@/src/types/api.types';
import { AuthSessionDTO } from '@/src/types/auth.types';

/** Roster check, email OTP verification, and account creation. */
export default function RegisterPage() {
  const router = useRouter();
  const {
    lookupRoster,
    verifyRegistrationOtp,
    resendRegistrationOtp,
    register,
  } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [mobile, setMobile] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [step1Loading, setStep1Loading] = useState(false);
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    department: 'Computer Science and Engineering',
    year: '1',
    password: '',
  });
  const [step2Loading, setStep2Loading] = useState(false);
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

  const [otp, setOtp] = useState('');
  const [verifiedSession, setVerifiedSession] = useState<AuthSessionDTO | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);

  useEffect(() => {
    if (step !== 2 || verifiedSession || resendCountdown <= 0) return;
    const timer = window.setTimeout(() => setResendCountdown((remaining) => remaining - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [step, verifiedSession, resendCountdown]);

  const departments = [
    { value: 'Computer Science and Engineering', label: 'Computer Science & Eng (CSE)' },
    { value: 'Electronics and Communication Engineering', label: 'Electronics & Comm (ECE)' },
    { value: 'Electrical and Electronics Engineering', label: 'Electrical & Electronics (EEE)' },
    { value: 'Mechanical Engineering', label: 'Mechanical Engineering (ME)' },
    { value: 'Civil Engineering', label: 'Civil Engineering (CE)' },
  ];

  const years = [
    { value: '1', label: '1st Year' },
    { value: '2', label: '2nd Year' },
    { value: '3', label: '3rd Year' },
    { value: '4', label: '4th Year' },
  ];

  const handleLookup = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!admissionNumber.trim()) errors.admissionNumber = 'Admission number is required';
    if (!mobile.trim()) errors.mobile = 'Mobile number is required';
    if (Object.keys(errors).length) {
      setStep1Errors(errors);
      return;
    }

    setStep1Loading(true);
    setStep1Errors({});
    try {
      const result = await lookupRoster({
        admissionNumber: admissionNumber.trim().toUpperCase(),
        mobile: mobile.trim(),
      });
      setMaskedEmail(result.maskedEmail);
      setFormData((current) => ({ ...current, name: result.name }));
      setOtp('');
      setVerifiedSession(null);
      setResendCountdown(60);
      setStep(2);
      toast.success('Details verified. A verification code has been sent to your college email.');
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Details not found. Check your admission number and registered mobile number.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setStep1Loading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      toast.error('Enter the 6-digit verification code sent to your college email.');
      return;
    }

    setOtpLoading(true);
    try {
      const session = await verifyRegistrationOtp({
        admissionNumber: admissionNumber.trim().toUpperCase(),
        token: otp,
      });
      setVerifiedSession(session);
      toast.success('Email verified. You can now register your account.');
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Invalid or expired verification code.');
      } else {
        toast.error('Verification failed. Please try again.');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      await resendRegistrationOtp(admissionNumber.trim().toUpperCase());
      setOtp('');
      setVerifiedSession(null);
      setResendCountdown(60);
      toast.success('A new verification code has been sent to your college email.');
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Could not resend the verification code.');
      } else {
        toast.error('Could not resend the verification code. Please try again.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!verifiedSession) {
      toast.error('Verify the email code before registering your account.');
      return;
    }

    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (Object.keys(errors).length) {
      setStep2Errors(errors);
      return;
    }

    setStep2Loading(true);
    setStep2Errors({});
    try {
      await register(
        {
          admissionNumber: admissionNumber.trim().toUpperCase(),
          mobile: mobile.trim(),
          password: formData.password,
          name: formData.name.trim(),
          department: formData.department,
          year: parseInt(formData.year, 10),
        },
        verifiedSession.accessToken
      );
      toast.success('Account created successfully. You are now signed in.');
      router.push('/');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.validationErrors && Object.keys(error.validationErrors).length) {
          setStep2Errors(error.validationErrors);
        } else {
          toast.error(error.message || 'Registration failed.');
        }
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setStep2Loading(false);
    }
  };

  const setField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    if (step2Errors[field]) setStep2Errors((current) => ({ ...current, [field]: '' }));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Create Student Account</h2>
        <p className="text-xs text-zinc-500">
          {step === 1
            ? 'Enter your admission number and registered mobile number to get started'
            : 'Verify your college email code, complete your details, then register'}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        {[1, 2].map((number) => (
          <React.Fragment key={number}>
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              number === step
                ? 'bg-emerald-600 text-white'
                : number < step
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'
            }`}>
              {number < step ? <CheckCircle2 className="h-4 w-4" /> : number}
            </div>
            {number === 1 && <div className="h-px w-8 bg-zinc-200 dark:bg-zinc-700" />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 ? (
        <form onSubmit={handleLookup} className="flex flex-col gap-3.5">
          <Input
            label="Admission Number"
            placeholder="e.g. GEC2024CS001"
            value={admissionNumber}
            onChange={(event) => {
              setAdmissionNumber(event.target.value);
              if (step1Errors.admissionNumber) setStep1Errors((current) => ({ ...current, admissionNumber: '' }));
            }}
            error={step1Errors.admissionNumber}
            leftIcon={<Hash className="h-4 w-4" />}
            helperText="Your unique college admission number"
            autoComplete="off"
            autoFocus
          />

          <Input
            label="Registered Mobile Number"
            type="tel"
            placeholder="e.g. 9876543210"
            value={mobile}
            onChange={(event) => {
              setMobile(event.target.value);
              if (step1Errors.mobile) setStep1Errors((current) => ({ ...current, mobile: '' }));
            }}
            error={step1Errors.mobile}
            leftIcon={<Phone className="h-4 w-4" />}
            helperText="The mobile number registered with your college"
            autoComplete="tel"
          />

          <Button type="submit" variant="primary" isLoading={step1Loading} className="mt-2 w-full">
            Verify Details &amp; Send OTP
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/40">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                {verifiedSession ? 'College email verified' : 'Verification code sent to'}
              </p>
              <p className="mt-0.5 break-all font-mono text-sm text-emerald-700 dark:text-emerald-400">{maskedEmail}</p>
              <p className="mt-1 text-xs text-emerald-600/70 dark:text-emerald-500/70">
                {verifiedSession
                  ? 'Your email is verified. Complete the form and register your account.'
                  : 'Enter the 6-digit code from this email and verify it before registering.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Input
              label="Email Verification Code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              disabled={!!verifiedSession}
              autoFocus
              className="text-center font-mono text-lg tracking-[0.35em]"
              helperText="Check your inbox and spam folder."
            />
            {verifiedSession ? (
              <div className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-100 text-sm font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Email verified
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                isLoading={otpLoading}
                disabled={!/^\d{6}$/.test(otp)}
                onClick={handleVerifyOtp}
                className="w-full"
              >
                <ShieldCheck className="h-4 w-4" /> Verify OTP
              </Button>
            )}
          </div>

          {!verifiedSession && (
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
              <span>{resendCountdown > 0 ? `Request another code in ${resendCountdown}s` : "Didn't receive the code?"}</span>
              <button
                type="button"
                disabled={resendCountdown > 0 || resendLoading}
                onClick={handleResendOtp}
                className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-emerald-400"
              >
                <RotateCcw className="h-3 w-3" /> {resendLoading ? 'Sending…' : 'Resend OTP'}
              </button>
            </div>
          )}

          <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

          <Input
            label="Full Name"
            placeholder="e.g. Rahul Sharma"
            value={formData.name}
            onChange={(event) => setField('name', event.target.value)}
            error={step2Errors.name}
            leftIcon={<User className="h-4 w-4" />}
            autoComplete="name"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Department"
              value={formData.department}
              options={departments}
              onChange={(event) => setField('department', event.target.value)}
            />
            <Select
              label="Year of Study"
              value={formData.year}
              options={years}
              onChange={(event) => setField('year', event.target.value)}
            />
          </div>

          <Input
            label="Password"
            type="password"
            placeholder="Min. 6 characters"
            value={formData.password}
            onChange={(event) => setField('password', event.target.value)}
            error={step2Errors.password}
            leftIcon={<Lock className="h-4 w-4" />}
            autoComplete="new-password"
          />

          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStep(1);
                setStep2Errors({});
                setOtp('');
                setVerifiedSession(null);
              }}
              className="flex-1"
            >
              ← Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={step2Loading}
              disabled={!verifiedSession}
              className="flex-1"
            >
              <UserPlus className="h-4 w-4" /> Register Account
            </Button>
          </div>
        </form>
      )}

      <div className="border-t border-zinc-100 pt-3 text-center text-xs text-zinc-500 dark:border-zinc-800">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400">
          Sign In
        </Link>
      </div>
    </div>
  );
}
