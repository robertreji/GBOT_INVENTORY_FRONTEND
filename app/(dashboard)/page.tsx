'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  CalendarClock,
  Handshake,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Repeat,
  XCircle,
  Plus,
  Cpu,
} from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { borrowsApi } from '@/src/api/borrows.api';
import { reservationsApi } from '@/src/api/reservations.api';
import { renewalsApi } from '@/src/api/renewals.api';
import { BorrowWithItemsDTO } from '@/src/types/borrow.types';
import { ReservationWithItemsDTO } from '@/src/types/reservation.types';

export default function HomePage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const toast = useToast();

  const [borrows, setBorrows] = useState<BorrowWithItemsDTO[]>([]);
  const [reservations, setReservations] = useState<ReservationWithItemsDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [borrowsRes, reservationsRes] = await Promise.allSettled([
        borrowsApi.listBorrows({ status: 'active', limit: 5 }),
        reservationsApi.listReservations({ status: 'pending', limit: 5 }),
      ]);

      if (borrowsRes.status === 'fulfilled' && borrowsRes.value?.borrows) {
        setBorrows(borrowsRes.value.borrows as BorrowWithItemsDTO[]);
      }
      if (reservationsRes.status === 'fulfilled' && reservationsRes.value?.reservations) {
        setReservations(reservationsRes.value.reservations as ReservationWithItemsDTO[]);
      }
    } catch {
      // Ignore initial load failure
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) {
      fetchData();
    }
  }, [isAuthenticated, isAuthLoading]);

  const handleRequestRenewal = async (borrowId: string) => {
    setActionLoadingId(borrowId);
    try {
      await renewalsApi.createRenewal({ borrowId });
      toast.success('Renewal request submitted! Awaiting lab admin approval.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit renewal request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    setActionLoadingId(reservationId);
    try {
      await reservationsApi.cancelReservation(reservationId);
      toast.success('Reservation cancelled and components released.');
      setReservations((prev) => prev.filter((r) => r.id !== reservationId));
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel reservation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getDaysRemaining = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-600 via-emerald-700 to-indigo-800 text-white p-6 sm:p-8 shadow-lg shadow-emerald-700/10">
        <div className="relative z-10 max-w-xl flex flex-col gap-2">
          <Badge variant="primary" className="bg-white/20 text-white border-white/30 w-fit backdrop-blur-xs">
            {isAuthenticated ? `${user?.department || 'Engineering'} • Year ${user?.year || 1}` : 'GEC Wayanad'}
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {isAuthenticated ? `Welcome, ${user?.name || 'Student'}` : 'GBOT Hardware Lab'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Reserve development boards, sensors, actuators, and robotics equipment. Keep track of loans, due dates, and renewals effortlessly.
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            <Link href="/catalog">
              <Button size="md" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-xs">
                <Layers className="w-4 h-4" />
                <span>Browse Inventory</span>
              </Button>
            </Link>
            {!isAuthenticated && (
              <Link href="/login">
                <Button size="md" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                  <span>Sign In with College ID</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
        {/* Decorative background icons */}
        <Cpu className="absolute -right-6 -bottom-6 w-48 h-48 text-white/10 pointer-events-none" />
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link href="/catalog" className="group">
          <Card hoverable className="h-full flex flex-col items-center text-center p-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Components</span>
            <span className="text-[11px] text-zinc-400 mt-0.5">Explore catalog</span>
          </Card>
        </Link>

        <Link href="/reservations/new" className="group">
          <Card hoverable className="h-full flex flex-col items-center text-center p-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Reserve Kit</span>
            <span className="text-[11px] text-zinc-400 mt-0.5">Multi-item booking</span>
          </Card>
        </Link>

        <Link href="/borrows" className="group">
          <Card hoverable className="h-full flex flex-col items-center text-center p-4">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Handshake className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">My Borrows</span>
            <span className="text-[11px] text-zinc-400 mt-0.5">Due dates & status</span>
          </Card>
        </Link>

        <Link href="/reservations" className="group">
          <Card hoverable className="h-full flex flex-col items-center text-center p-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <CalendarClock className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Reservations</span>
            <span className="text-[11px] text-zinc-400 mt-0.5">Pending requests</span>
          </Card>
        </Link>
      </div>

      {/* Active Borrows Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Active Hardware Loans
            </h2>
            {borrows.length > 0 && (
              <Badge variant="success" size="sm">
                {borrows.length} active
              </Badge>
            )}
          </div>
          <Link
            href="/borrows"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : borrows.length === 0 ? (
          <Card className="p-6 text-center flex flex-col items-center justify-center gap-2 border-dashed">
            <Handshake className="w-8 h-8 text-zinc-400 stroke-1" />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No active borrows</p>
            <p className="text-xs text-zinc-500 max-w-sm">
              You currently have no hardware checked out from the lab. Need microcontrollers or sensors for your project?
            </p>
            <Link href="/catalog" className="mt-1">
              <Button size="sm" variant="secondary">
                Find Components
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {borrows.map((borrow) => {
              const days = getDaysRemaining(borrow.dueDate);
              const isOverdue = days < 0;
              const isUrgent = days <= 2 && days >= 0;

              return (
                <Card
                  key={borrow.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 border-l-4 ${
                    isOverdue
                      ? 'border-l-rose-500 bg-rose-50/30 dark:bg-rose-950/10'
                      : isUrgent
                      ? 'border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10'
                      : 'border-l-emerald-500'
                  }`}
                >
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={borrow.borrowStatus} size="sm" />
                      <span className="text-xs text-zinc-500">
                        Borrowed on {new Date(borrow.borrowDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-medium text-sm text-zinc-900 dark:text-zinc-100">
                      {isOverdue ? (
                        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                      )}
                      <span>
                        Due by{' '}
                        <strong className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {new Date(borrow.dueDate).toLocaleDateString()}
                        </strong>{' '}
                        ({isOverdue ? `${Math.abs(days)} days overdue!` : `${days} days remaining`})
                      </span>
                    </div>

                    {borrow.items && borrow.items.length > 0 && (
                      <div className="text-xs text-zinc-500 flex flex-wrap gap-1.5 mt-1">
                        {borrow.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-mono text-[11px]"
                          >
                            Qty: {item.quantity}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={actionLoadingId === borrow.id}
                      onClick={() => handleRequestRenewal(borrow.id)}
                      leftIcon={<Repeat className="w-3.5 h-3.5" />}
                    >
                      Request Renewal
                    </Button>
                    <Link href={`/borrows/${borrow.id}`}>
                      <Button size="sm" variant="secondary">
                        Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Reservations Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Pending Reservations
            </h2>
            {reservations.length > 0 && (
              <Badge variant="warning" size="sm">
                {reservations.length} pending
              </Badge>
            )}
          </div>
          <Link
            href="/reservations"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : reservations.length === 0 ? (
          <Card className="p-5 text-center text-xs text-zinc-500 border-dashed">
            No pending reservations awaiting pickup.
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {reservations.map((res) => (
              <Card
                key={res.id}
                className="flex items-center justify-between gap-3 p-4 hover:border-zinc-300 dark:hover:border-zinc-700"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={res.reservationStatus} size="sm" />
                    <span className="text-xs text-zinc-400">
                      Reserved {new Date(res.reservationDate).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">
                    Expires: {res.expiresAt ? new Date(res.expiresAt).toLocaleDateString() : 'No expiry set'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    isLoading={actionLoadingId === res.id}
                    onClick={() => handleCancelReservation(res.id)}
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

