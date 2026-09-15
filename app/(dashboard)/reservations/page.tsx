'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  Plus,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { reservationsApi } from '@/src/api/reservations.api';
import {
  ReservationWithItemsDTO,
  ReservationStatus,
} from '@/src/types/reservation.types';
import { useToast } from '@/src/context/ToastContext';
import { useAuth } from '@/src/context/AuthContext';

export default function ReservationsPage() {
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [reservations, setReservations] = useState<ReservationWithItemsDTO[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await reservationsApi.listReservations({
        status: (selectedStatus as ReservationStatus) || undefined,
        limit: 50,
      });
      if (res?.reservations) {
        setReservations(res.reservations as ReservationWithItemsDTO[]);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, selectedStatus]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation? The reserved components will be returned to stock.')) {
      return;
    }

    setCancellingId(id);
    try {
      await reservationsApi.cancelReservation(id);
      toast.success('Reservation cancelled successfully');
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, reservationStatus: 'cancelled' } : r))
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel reservation');
    } finally {
      setCancellingId(null);
    }
  };

  const statusFilters = [
    { value: '', label: 'All Requests' },
    { value: 'pending', label: 'Pending' },
    { value: 'fulfilled', label: 'Fulfilled' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            My Reservations
          </h1>
          <p className="text-xs text-zinc-500">
            Track hold status and pickup deadlines for hardware components
          </p>
        </div>

        <Link href="/catalog">
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            New Reservation
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {statusFilters.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setSelectedStatus(tab.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedStatus === tab.value
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center gap-3 border-dashed">
          <CalendarClock className="w-10 h-10 text-zinc-400 stroke-1" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No reservations found
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm">
            You don&apos;t have any reservations matching the selected filter.
          </p>
          <Link href="/catalog" className="mt-1">
            <Button size="sm" variant="outline">
              Explore Hardware Catalog
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-3.5">
          {reservations.map((res) => (
            <Card key={res.id} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={res.reservationStatus} size="sm" />
                  <span className="text-xs text-zinc-400 font-mono">
                    ID: {res.id.substring(0, 8)}...
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Requested: {new Date(res.reservationDate).toLocaleDateString()}
                  </span>
                  {res.expiresAt && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                      Expires: {new Date(res.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Items in this reservation */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Reserved Items
                </span>
                {res.items && res.items.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {res.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs flex items-center justify-between"
                      >
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {item.component?.name || `Component #${item.componentId.substring(0, 8)}`}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-700 font-bold text-[11px]">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-zinc-400 italic">Items loading...</span>
                )}
              </div>

              {/* Actions */}
              {res.reservationStatus === 'pending' && (
                <div className="pt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    isLoading={cancellingId === res.id}
                    onClick={() => handleCancel(res.id)}
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Cancel Reservation
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

