'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  Phone,
  ShieldCheck,
  LogOut,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { usersApi } from '@/src/api/users.api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, updateUser, logout } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    department: 'Computer Science and Engineering',
    year: '1',
    phoneNo: '',
    profileImg: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        department: user.department || 'Computer Science and Engineering',
        year: (user.year || 1).toString(),
        phoneNo: user.phoneNo || '',
        profileImg: user.profileImg || '',
      });
    }
  }, [user]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updated = await usersApi.updateMe({
        name: formData.name.trim(),
        department: formData.department,
        year: parseInt(formData.year, 10),
        phoneNo: formData.phoneNo.trim(),
        profileImg: formData.profileImg.trim() || null,
      });

      updateUser(updated);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto text-center py-16 flex flex-col items-center gap-3">
        <h2 className="text-lg font-bold">Please Sign In</h2>
        <p className="text-xs text-zinc-500">Sign in with your college credentials to view and manage your profile.</p>
        <Link href="/login">
          <Button size="sm">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Student Profile
          </h1>
          <p className="text-xs text-zinc-500">
            Manage your personal and academic information for hardware loans
          </p>
        </div>

        {isAdmin && (
          <Link href="/admin">
            <Button size="sm" variant="outline" leftIcon={<ShieldCheck className="w-4 h-4 text-amber-500" />}>
              Open Admin Console
            </Button>
          </Link>
        )}
      </div>

      {/* Main Profile Form Card */}
      <Card className="p-6 sm:p-8 flex flex-col gap-6">
        {/* Avatar & Email preview */}
        <div className="flex items-center gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800">
          {user?.profileImg ? (
            <img
              src={user.profileImg}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-2xl flex items-center justify-center border-2 border-emerald-500/20">
              {user?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
          )}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{user?.name}</h2>
              {isAdmin && <Badge variant="warning" size="sm">Lab Admin</Badge>}
            </div>
            <span className="text-xs text-zinc-500 font-mono flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {user?.email}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            leftIcon={<User className="w-4 h-4" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            label="Contact Phone Number"
            type="tel"
            value={formData.phoneNo}
            onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <Input
            label="Profile Image URL (Optional)"
            type="url"
            placeholder="https://example.com/avatar.jpg"
            value={formData.profileImg}
            onChange={(e) => setFormData({ ...formData, profileImg: e.target.value })}
          />

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              isLoading={isLoggingOut}
              onClick={handleLogout}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign Out
            </Button>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

