'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, Mail, Phone, GraduationCap, Trash2 } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { usersApi } from '@/src/api/users.api';
import { UserDTO } from '@/src/types/user.types';
import { useToast } from '@/src/context/ToastContext';

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await usersApi.listUsers(1, 100);
      if (res?.users) setUsers(res.users);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove user "${name}" from the system?`)) {
      return;
    }

    try {
      await usersApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success(`User ${name} removed.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Student User Directory
        </h1>
        <p className="text-xs text-zinc-500">
          View all verified students registered with official college emails
        </p>
      </div>

      <Input
        placeholder="Search students by name, college email, or branch..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={<Search className="w-4 h-4" />}
        className="bg-white dark:bg-zinc-900"
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <p className="text-xs text-zinc-500">No students found.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredUsers.map((u) => (
            <Card
              key={u.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                {u.profileImg ? (
                  <img
                    src={u.profileImg}
                    alt={u.name}
                    className="w-11 h-11 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center text-sm">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {u.name}
                    </h3>
                    {u.role === 'admin' && (
                      <Badge variant="warning" size="sm">Admin</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3.5 h-3.5" />
                      {u.email}
                    </span>
                    {u.phoneNo && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5" />
                        {u.phoneNo}
                      </span>
                    )}
                    {u.department && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {u.department} (Yr {u.year || 1})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-600 hover:bg-rose-50"
                  onClick={() => handleDeleteUser(u.id, u.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

