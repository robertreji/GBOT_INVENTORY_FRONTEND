'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Handshake,
  User,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Select } from '@/src/components/ui/Select';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { reservationsApi } from '@/src/api/reservations.api';
import {
  ReservationWithItemsDTO,
  ReservationStatus,
} from '@/src/types/reservation.types';
import { useToast } from '@/src/context/ToastContext';

export default function AdminReservationsPage() {
  const toast = useToast();
  const [reservations, setReservations] = useState<ReservationWithItemsDTO[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await reservationsApi.listReservations({
        status: (selectedStatus as ReservationStatus) || undefined,
        limit: 100,
      });
      if (res?.reservations) {
        setReservations(res.reservations as ReservationWithItemsDTO[]);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleStatusChange = async (id: string, newStatus: ReservationStatus) => {
    setUpdatingId(id);
    try {
      await reservationsApi.updateReservationStatus(id, { reservationStatus: newStatus });
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, reservationStatus: newStatus } : r))
      );
      toast.success(`Reservation status set to ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update reservation status');
    } finally {
      setUpdatingId(null);
    }
  };

  const statusFilters = [
    { value: '', label: 'All Requests' },
    { value: 'pending', label: 'Pending Holds' },
    { value: 'fulfilled', label: 'Fulfilled' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Student Equipment Holds & Reservations
        </h1>
        <p className="text-xs text-zinc-500">
          Review reservation queue and issue borrows when students collect hardware at the lab
        </p>
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
                ? 'bg-amber-600 text-white font-semibold shadow-xs'
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
            <Skeleton key={n} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <p className="text-xs text-zinc-500">No reservations under this status.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {reservations.map((res) => (
            <Card key={res.id} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      {res.user?.name || `Student (${res.userId.substring(0, 8)}...)`}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {res.user?.email || `User ID: ${res.userId}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={res.reservationStatus} size="sm" />
                  <span className="text-xs text-zinc-400">
                    Requested: {new Date(res.reservationDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Items in reservation */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Requested Items
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {res.items?.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-xs flex items-center justify-between"
                    >
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {item.component?.name || `Component #${item.componentId.substring(0, 8)}`}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-700 font-bold text-[11px]">
                        x{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Actions */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Update Status:</span>
                  <Select
                    value={res.reservationStatus}
                    onChange={(e) =>
                      handleStatusChange(res.id, e.target.value as ReservationStatus)
                    }
                    className="h-8 min-h-[32px] text-xs py-0.5"
                    disabled={updatingId === res.id}
                  >
                    <option value="pending">Pending</option>
                    <option value="partially_fulfilled">Partially Fulfilled</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                  </Select>
                </div>

                {res.reservationStatus === 'pending' && (
                  <Link
                    href={`/admin/borrows/new?reservationId=${res.id}&userId=${res.userId}`}
                  >
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Handshake className="w-3.5 h-3.5" />}
                    >
                      Issue Borrow at Counter
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

