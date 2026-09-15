'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Package,
  Handshake,
  CalendarClock,
  Repeat,
  AlertTriangle,
  Plus,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { borrowsApi } from '@/src/api/borrows.api';
import { reservationsApi } from '@/src/api/reservations.api';
import { componentsApi } from '@/src/api/components.api';
import { BorrowDTO } from '@/src/types/borrow.types';
import { ReservationDTO } from '@/src/types/reservation.types';

export default function AdminHubPage() {
  const [stats, setStats] = useState({
    activeBorrows: 0,
    overdueBorrows: 0,
    pendingReservations: 0,
    totalComponents: 0,
  });
  const [overdueList, setOverdueList] = useState<BorrowDTO[]>([]);
  const [pendingReservations, setPendingReservations] = useState<ReservationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      setIsLoading(true);
      try {
        const [activeRes, overdueRes, pendingRes, compRes] = await Promise.allSettled([
          borrowsApi.listBorrows({ status: 'active', limit: 1 }),
          borrowsApi.listBorrows({ status: 'overdue', limit: 10 }),
          reservationsApi.listReservations({ status: 'pending', limit: 10 }),
          componentsApi.listComponents({ limit: 1 }),
        ]);

        const activeCount = activeRes.status === 'fulfilled' ? activeRes.value?.pagination?.total ?? 0 : 0;
        const overdueCount = overdueRes.status === 'fulfilled' ? overdueRes.value?.pagination?.total ?? 0 : 0;
        const pendingCount = pendingRes.status === 'fulfilled' ? pendingRes.value?.pagination?.total ?? 0 : 0;
        const totalComps = compRes.status === 'fulfilled' ? compRes.value?.pagination?.total ?? 0 : 0;

        setStats({
          activeBorrows: activeCount,
          overdueBorrows: overdueCount,
          pendingReservations: pendingCount,
          totalComponents: totalComps,
        });

        if (overdueRes.status === 'fulfilled' && overdueRes.value?.borrows) {
          setOverdueList(overdueRes.value.borrows as BorrowDTO[]);
        }
        if (pendingRes.status === 'fulfilled' && pendingRes.value?.reservations) {
          setPendingReservations(pendingRes.value.reservations as ReservationDTO[]);
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }

    loadAdminData();
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="warning" size="sm">Lab Administrator</Badge>
            <span className="text-xs text-zinc-400">GEC Wayanad</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Inventory Management Console
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/borrows/new">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Issue Borrow
            </Button>
          </Link>
          <Link href="/admin/components/new">
            <Button size="sm" variant="outline" leftIcon={<Package className="w-4 h-4" />}>
              Add Component
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 flex flex-col gap-1 border-l-4 border-l-sky-500">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Active Loans
          </span>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <span className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.activeBorrows}
            </span>
          )}
          <span className="text-[11px] text-zinc-500">Currently in student possession</span>
        </Card>

        <Card className="p-4 sm:p-5 flex flex-col gap-1 border-l-4 border-l-rose-500">
          <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
            Overdue Loans
          </span>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <span className="text-2xl sm:text-3xl font-bold text-rose-600">
              {stats.overdueBorrows}
            </span>
          )}
          <span className="text-[11px] text-zinc-500">Exceeded scheduled return date</span>
        </Card>

        <Card className="p-4 sm:p-5 flex flex-col gap-1 border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
            Pending Holds
          </span>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <span className="text-2xl sm:text-3xl font-bold text-amber-600">
              {stats.pendingReservations}
            </span>
          )}
          <span className="text-[11px] text-zinc-500">Reservations awaiting fulfillment</span>
        </Card>

        <Card className="p-4 sm:p-5 flex flex-col gap-1 border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Components
          </span>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <span className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.totalComponents}
            </span>
          )}
          <span className="text-[11px] text-zinc-500">Catalogued lab models</span>
        </Card>
      </div>

      {/* Quick Access Action Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/admin/reservations">
          <Card hoverable className="p-4 text-center flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <CalendarClock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Fulfill Holds</span>
            <span className="text-[10px] text-zinc-400">Review student requests</span>
          </Card>
        </Link>

        <Link href="/admin/borrows">
          <Card hoverable className="p-4 text-center flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Process Returns</span>
            <span className="text-[10px] text-zinc-400">Intake / damage logs</span>
          </Card>
        </Link>

        <Link href="/admin/renewals">
          <Card hoverable className="p-4 text-center flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Repeat className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Renewals Queue</span>
            <span className="text-[10px] text-zinc-400">Approve extensions</span>
          </Card>
        </Link>

        <Link href="/admin/components">
          <Card hoverable className="p-4 text-center flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Stock & Stickers</span>
            <span className="text-[10px] text-zinc-400">Barcodes & quantities</span>
          </Card>
        </Link>
      </div>

      {/* Two Columns: Overdue Items & Pending Reservations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Borrows */}
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Overdue Returns
              </h2>
            </div>
            <Link href="/admin/borrows" className="text-xs text-sky-600 hover:underline">
              View All
            </Link>
          </div>

          {isLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : overdueList.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-6 border border-dashed rounded-xl">
              No overdue loans currently!
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {overdueList.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl border border-rose-100 dark:border-rose-950/60 bg-rose-50/30 dark:bg-rose-950/20 text-xs flex items-center justify-between"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-rose-700 dark:text-rose-400">
                      User: {b.userId.substring(0, 8)}...
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Due: {new Date(b.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <Link href={`/admin/borrows/${b.id}/returns`}>
                    <Button size="sm" variant="danger">
                      Intake Return
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pending Reservations Awaiting Fulfillment */}
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Pending Holds to Fulfill
              </h2>
            </div>
            <Link href="/admin/reservations" className="text-xs text-sky-600 hover:underline">
              View All
            </Link>
          </div>

          {isLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : pendingReservations.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-6 border border-dashed rounded-xl">
              No pending reservations awaiting issue.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {pendingReservations.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs flex items-center justify-between"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      Req ID: {r.id.substring(0, 8)}...
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Expires: {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <Link href={`/admin/borrows/new?reservationId=${r.id}&userId=${r.userId}`}>
                    <Button size="sm" variant="primary">
                      Issue Equipment
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

