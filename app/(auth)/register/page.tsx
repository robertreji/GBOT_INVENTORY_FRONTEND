'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Phone, UserPlus, Hash, ShieldCheck, User, GraduationCap, Calendar } from 'lucide-react';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { ApiError } from '@/src/types/api.types';

/**
 * Two-step roster-driven registration page.
 *
 * Step 1 — Identity check:
 *   User enters admission number + mobile.
 *   Backend verifies both match the same pre-loaded roster row.
 *   Returns the masked email on record.
 *
 * Step 2 — Profile + password:
 *   User fills in name, department, year, phone and sets a password.
 *   The masked email is shown read-only so they know where the OTP will go.
 *   Backend uses the roster email (never the user-supplied one).
 */
export default function RegisterPage() {
  const router = useRouter();
  const { lookupRoster, register } = useAuth();
  const toast = useToast();

  // ─── Step tracking ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);

  // ─── Step 1 state ───────────────────────────────────────────────────────────
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [mobile, setMobile] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [step1Loading, setStep1Loading] = useState(false);
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // ─── Step 2 state ───────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: '',
    department: 'Computer Science and Engineering',
    year: '1',
    phoneNo: '',
    password: '',
  });
  const [step2Loading, setStep2Loading] = useState(false);
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

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

  // ─── Step 1: lookup roster ──────────────────────────────────────────────────
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: Record<string, string> = {};
    if (!admissionNumber.trim()) errs.admissionNumber = 'Admission number is required';
    if (!mobile.trim()) errs.mobile = 'Mobile number is required';
    if (Object.keys(errs).length > 0) {
      setStep1Errors(errs);
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
      // Pre-fill name from roster as a convenience; user can change it
      setFormData((prev) => ({ ...prev, name: result.name }));
      setStep(2);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || 'Details not found. Please check your admission number and mobile number.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setStep1Loading(false);
    }
  };

  // ─── Step 2: create account ─────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.phoneNo.trim()) errs.phoneNo = 'Phone number is required';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (Object.keys(errs).length > 0) {
      setStep2Errors(errs);
      return;
    }

    setStep2Loading(true);
    setStep2Errors({});

    try {
      await register({
        admissionNumber: admissionNumber.trim().toUpperCase(),
        mobile: mobile.trim(),
        password: formData.password,
        name: formData.name.trim(),
        department: formData.department,
        year: parseInt(formData.year, 10),
        phoneNo: formData.phoneNo.trim(),
      });
      toast.success('Account created! Please check your email for the verification OTP.');
      router.push(`/verify-otp?admissionNumber=${encodeURIComponent(admissionNumber.trim().toUpperCase())}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.validationErrors && Object.keys(err.validationErrors).length > 0) {
          setStep2Errors(err.validationErrors);
        } else {
          toast.error(err.message || 'Registration failed.');
        }
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setStep2Loading(false);
    }
  };

  const setField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (step2Errors[field]) setStep2Errors((prev) => ({ ...prev, [field]: '' }));
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Create Student Account</h2>
        <p className="text-xs text-zinc-500">
          {step === 1
            ? 'Enter your admission number and registered mobile number to get started'
            : 'Complete your profile and set a password'}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 justify-center">
        <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
          step === 1 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
        }`}>1</div>
        <div className="h-px w-8 bg-zinc-200 dark:bg-zinc-700" />
        <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
          step === 2 ? 'bg-emerald-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
        }`}>2</div>
      </div>

      {/* ── Step 1 ── */}
      {step === 1 && (
        <form onSubmit={handleLookup} className="flex flex-col gap-3.5">
          <Input
            label="Admission Number"
            placeholder="e.g. GEC2024CS001"
            value={admissionNumber}
            onChange={(e) => {
              setAdmissionNumber(e.target.value);
              if (step1Errors.admissionNumber) setStep1Errors((prev) => ({ ...prev, admissionNumber: '' }));
            }}
            error={step1Errors.admissionNumber}
            leftIcon={<Hash className="w-4 h-4" />}
            helperText="Your unique college admission number"
            autoComplete="off"
            autoFocus
          />

          <Input
            label="Registered Mobile Number"
            type="tel"
            placeholder="e.g. 9876543210"
            value={mobile}
            onChange={(e) => {
              setMobile(e.target.value);
              if (step1Errors.mobile) setStep1Errors((prev) => ({ ...prev, mobile: '' }));
            }}
            error={step1Errors.mobile}
            leftIcon={<Phone className="w-4 h-4" />}
            helperText="Mobile number registered with the college"
            autoComplete="tel"
          />

          <Button type="submit" variant="primary" isLoading={step1Loading} className="w-full mt-2">
            <span>Verify Details</span>
          </Button>
        </form>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <form onSubmit={handleRegister} className="flex flex-col gap-3.5">

          {/* Masked email confirmation — read-only */}
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Verification OTP will be sent to</p>
              <p className="text-sm font-mono text-emerald-700 dark:text-emerald-400 mt-0.5 break-all">{maskedEmail}</p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-1">
                This is the email registered with your college.
              </p>
            </div>
          </div>

          <Input
            label="Full Name"
            placeholder="e.g. Rahul Sharma"
            value={formData.name}
            onChange={(e) => setField('name', e.target.value)}
            error={step2Errors.name}
            leftIcon={<User className="w-4 h-4" />}
            autoComplete="name"
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Department"
              value={formData.department}
              options={departments}
              onChange={(e) => setField('department', e.target.value)}
            />
            <Select
              label="Year of Study"
              value={formData.year}
              options={years}
              onChange={(e) => setField('year', e.target.value)}
            />
          </div>

          <Input
            label="Phone Number"
            type="tel"
            placeholder="+91 98765 43210"
            value={formData.phoneNo}
            onChange={(e) => setField('phoneNo', e.target.value)}
            error={step2Errors.phoneNo}
            leftIcon={<Phone className="w-4 h-4" />}
            autoComplete="tel"
          />

          <Input
            label="Password"
            type="password"
            placeholder="Min. 6 characters"
            value={formData.password}
            onChange={(e) => setField('password', e.target.value)}
            error={step2Errors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete="new-password"
          />

          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setStep(1); setStep2Errors({}); }}
              className="flex-1"
            >
              ← Back
            </Button>
            <Button type="submit" variant="primary" isLoading={step2Loading} className="flex-1">
              <UserPlus className="w-4 h-4" />
              <span>Register Account</span>
            </Button>
          </div>
        </form>
      )}

      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
