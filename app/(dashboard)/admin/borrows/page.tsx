'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Handshake,
  Plus,
  RotateCcw,
  Clock,
  ShieldAlert,
  ChevronRight,
  User,
} from 'lucide-react';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { StatusBadge } from '../../../../src/components/common/StatusBadge';
import { Skeleton } from '../../../../src/components/ui/Skeleton';
import { borrowsApi } from '../../../../src/api/borrows.api';
import { BorrowDTO, BorrowStatus } from '../../../../src/types/borrow.types';

export default function AdminBorrowsPage() {
  const [borrows, setBorrows] = useState<BorrowDTO[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [isLoading, setIsLoading] = useState(true);

  const fetchBorrows = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await borrowsApi.listBorrows({
        status: (selectedStatus as BorrowStatus) || undefined,
        limit: 100,
      });
      if (res?.borrows) setBorrows(res.borrows as BorrowDTO[]);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchBorrows();
  }, [fetchBorrows]);

  const statusFilters = [
    { value: '', label: 'All Borrows' },
    { value: 'active', label: 'Active' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'partially_returned', label: 'Partially Returned' },
    { value: 'fully_returned', label: 'Fully Returned' },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Hardware Loans & Checkouts
          </h1>
          <p className="text-xs text-zinc-500">
            Track all active student loans and record returned, lost, or damaged equipment
          </p>
        </div>

        <Link href="/admin/borrows/new">
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Issue New Borrow
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
            <Skeleton key={n} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : borrows.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <p className="text-xs text-zinc-500">No borrows under this status.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3.5">
          {borrows.map((b) => (
            <Card key={b.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={b.borrowStatus} size="sm" />
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {b.user?.name || `Student (${b.userId.substring(0, 8)}...)`}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {b.user?.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>Issued: {new Date(b.borrowDate).toLocaleDateString()}</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      Due: {new Date(b.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Link href={`/admin/borrows/${b.id}/returns`}>
                  <Button size="sm" variant="primary" leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
                    Process Return
                  </Button>
                </Link>
                <Link href={`/borrows/${b.id}`}>
                  <Button size="sm" variant="secondary">
                    View
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

