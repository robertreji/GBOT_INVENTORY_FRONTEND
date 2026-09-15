'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Handshake,
  Clock,
  Calendar,
  Repeat,
  ChevronRight,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { borrowsApi } from '@/src/api/borrows.api';
import { renewalsApi } from '@/src/api/renewals.api';
import { BorrowWithItemsDTO, BorrowStatus } from '@/src/types/borrow.types';
import { useToast } from '@/src/context/ToastContext';
import { useAuth } from '@/src/context/AuthContext';

export default function BorrowsPage() {
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [borrows, setBorrows] = useState<BorrowWithItemsDTO[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  const fetchBorrows = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await borrowsApi.listBorrows({
        status: (selectedStatus as BorrowStatus) || undefined,
        limit: 50,
      });
      if (res?.borrows) {
        setBorrows(res.borrows as BorrowWithItemsDTO[]);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, selectedStatus]);

  useEffect(() => {
    fetchBorrows();
  }, [fetchBorrows]);

  const handleRenewal = async (borrowId: string) => {
    setRenewingId(borrowId);
    try {
      await renewalsApi.createRenewal({ borrowId });
      toast.success('Renewal requested! The lab admin will review your due date extension.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit renewal request.');
    } finally {
      setRenewingId(null);
    }
  };

  const getDaysRemaining = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const statusFilters = [
    { value: '', label: 'All Borrows' },
    { value: 'active', label: 'Active' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'fully_returned', label: 'Fully Returned' },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          My Borrows & Returns
        </h1>
        <p className="text-xs text-zinc-500">
          Monitor your borrowed equipment, track return deadlines, and request loan renewals
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
      ) : borrows.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center gap-3 border-dashed">
          <Handshake className="w-10 h-10 text-zinc-400 stroke-1" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No borrow records found
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm">
            You don&apos;t have any equipment loans under this filter.
          </p>
          <Link href="/catalog" className="mt-1">
            <Button size="sm" variant="outline">
              Browse Available Hardware
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-3.5">
          {borrows.map((borrow) => {
            const days = getDaysRemaining(borrow.dueDate);
            const isOverdue = days < 0;
            const isUrgent = days <= 2 && days >= 0;

            return (
              <Card
                key={borrow.id}
                className={`p-5 flex flex-col gap-4 border-l-4 transition-all ${
                  isOverdue
                    ? 'border-l-rose-500'
                    : isUrgent
                    ? 'border-l-amber-500'
                    : 'border-l-emerald-500'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={borrow.borrowStatus} size="sm" />
                    <span className="text-xs text-zinc-400 font-mono">
                      Ref: {borrow.id.substring(0, 8)}...
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-zinc-500">
                      Borrowed: {new Date(borrow.borrowDate).toLocaleDateString()}
                    </span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        isOverdue
                          ? 'text-rose-600'
                          : isUrgent
                          ? 'text-amber-600'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {isOverdue && <ShieldAlert className="w-3.5 h-3.5" />}
                      Due: {new Date(borrow.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Checked Out Items
                  </span>
                  {borrow.items && borrow.items.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {borrow.items.map((item) => (
                        <div
                          key={item.id}
                          className="px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-800 text-xs flex items-center gap-2"
                        >
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {item.component?.name || 'Lab Component'}
                          </span>
                          {item.componentInstanceId && (
                            <span className="font-mono text-[10px] text-zinc-400">
                              (Instance)
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-[10px] font-bold">
                            x{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400 italic">No item details</span>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  {borrow.borrowStatus === 'active' || borrow.borrowStatus === 'overdue' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={renewingId === borrow.id}
                      onClick={() => handleRenewal(borrow.id)}
                      leftIcon={<Repeat className="w-3.5 h-3.5" />}
                    >
                      Request Renewal
                    </Button>
                  ) : (
                    <div />
                  )}

                  <Link href={`/borrows/${borrow.id}`}>
                    <Button size="sm" variant="secondary" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                      View History
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

