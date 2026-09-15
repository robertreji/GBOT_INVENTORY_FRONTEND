'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, GraduationCap, Calendar, UserPlus } from 'lucide-react';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { ApiError } from '@/src/types/api.types';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Computer Science and Engineering',
    year: '1',
    phoneNo: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'College email is required';
    } else if (!formData.email.trim().endsWith('@gecwyd.ac.in')) {
      errs.email = 'Only college emails (@gecwyd.ac.in) are permitted';
    }
    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    if (!formData.phoneNo.trim()) {
      errs.phoneNo = 'Phone number is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        department: formData.department,
        year: parseInt(formData.year, 10),
        phoneNo: formData.phoneNo.trim(),
      });
      toast.success('Registration successful! Please check your email for the verification OTP.');
      router.push(`/verify-otp?email=${encodeURIComponent(formData.email.trim())}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.validationErrors) {
          setErrors(err.validationErrors);
        } else {
          toast.error(err.message || 'Registration failed.');
        }
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Create Student Account</h2>
        <p className="text-xs text-zinc-500">Enter your college credentials to start borrowing components</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <Input
          label="Full Name"
          placeholder="e.g. Rahul Sharma"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
          }}
          error={errors.name}
          leftIcon={<User className="w-4 h-4" />}
          autoComplete="name"
          autoFocus
        />

        <Input
          label="College Email"
          type="email"
          placeholder="username@gecwyd.ac.in"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
          }}
          error={errors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          helperText="Must be your official @gecwyd.ac.in domain"
          autoComplete="email"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Department"
            value={formData.department}
            options={departments}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />

          <Select
            label="Year of Study"
            value={formData.year}
            options={years}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
          />
        </div>

        <Input
          label="Phone Number"
          type="tel"
          placeholder="+91 98765 43210"
          value={formData.phoneNo}
          onChange={(e) => {
            setFormData({ ...formData, phoneNo: e.target.value });
            if (errors.phoneNo) setErrors((prev) => ({ ...prev, phoneNo: '' }));
          }}
          error={errors.phoneNo}
          leftIcon={<Phone className="w-4 h-4" />}
          autoComplete="tel"
        />

        <Input
          label="Password"
          type="password"
          placeholder="Min. 6 characters"
          value={formData.password}
          onChange={(e) => {
            setFormData({ ...formData, password: e.target.value });
            if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
          }}
          error={errors.password}
          leftIcon={<Lock className="w-4 h-4" />}
          autoComplete="new-password"
        />

        <Button type="submit" variant="primary" isLoading={isLoading} className="w-full mt-2">
          <UserPlus className="w-4 h-4" />
          <span>Register Account</span>
        </Button>
      </form>

      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}

