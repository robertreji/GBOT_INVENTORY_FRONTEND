'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Repeat,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { borrowsApi } from '@/src/api/borrows.api';
import { renewalsApi } from '@/src/api/renewals.api';
import {
  BorrowWithItemsDTO,
  ReturnItemDTO,
} from '@/src/types/borrow.types';
import { RenewalDTO } from '@/src/types/renewal.types';
import { useToast } from '@/src/context/ToastContext';

export default function BorrowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const toast = useToast();

  const [borrow, setBorrow] = useState<BorrowWithItemsDTO | null>(null);
  const [returns, setReturns] = useState<ReturnItemDTO[]>([]);
  const [renewals, setRenewals] = useState<RenewalDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenewing, setIsRenewing] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [borrowData, returnsData, renewalsData] = await Promise.allSettled([
          borrowsApi.getBorrow(id),
          borrowsApi.listReturns(id),
          renewalsApi.listRenewalsForBorrow(id),
        ]);

        if (borrowData.status === 'fulfilled') setBorrow(borrowData.value);
        if (returnsData.status === 'fulfilled') setReturns(returnsData.value);
        if (renewalsData.status === 'fulfilled') setRenewals(renewalsData.value);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load borrow details');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id, toast]);

  const handleRenewal = async () => {
    setIsRenewing(true);
    try {
      const renewal = await renewalsApi.createRenewal({ borrowId: id });
      toast.success('Renewal requested! Awaiting admin approval.');
      setRenewals((prev) => [renewal, ...prev]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to request renewal');
    } finally {
      setIsRenewing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!borrow) {
    return (
      <div className="max-w-md mx-auto text-center py-16 flex flex-col items-center gap-3">
        <h2 className="text-lg font-bold">Borrow Record Not Found</h2>
        <Link href="/borrows">
          <Button size="sm">Back to My Borrows</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Back button */}
      <Link
        href="/borrows"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Borrows</span>
      </Link>

      {/* Main Details Card */}
      <Card className="p-6 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={borrow.borrowStatus} size="sm" />
              <span className="text-xs font-mono text-zinc-400">ID: {borrow.id}</span>
            </div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Hardware Loan Agreement
            </h1>
          </div>

          {(borrow.borrowStatus === 'active' || borrow.borrowStatus === 'overdue') && (
            <Button
              size="sm"
              variant="primary"
              isLoading={isRenewing}
              onClick={handleRenewal}
              leftIcon={<Repeat className="w-3.5 h-3.5" />}
            >
              Request Renewal
            </Button>
          )}
        </div>

        {/* Timeline details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="flex flex-col">
              <span className="text-zinc-400 font-medium">Issue Date</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                {new Date(borrow.borrowDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex flex-col">
              <span className="text-zinc-400 font-medium">Due Date</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                {new Date(borrow.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Items checked out */}
        <div className="flex flex-col gap-2.5">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Issued Equipment
          </h2>
          <div className="flex flex-col gap-2">
            {borrow.items?.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.component?.name || 'Component'}
                    </span>
                    {item.componentInstanceId && (
                      <span className="font-mono text-[11px] text-zinc-400">
                        Instance ID: {item.componentInstanceId}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="neutral" size="sm">
                  Qty: {item.quantity}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Return Events */}
      <Card className="p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Return History & Logs ({returns.length})
          </h2>
        </div>

        {returns.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center border border-dashed rounded-xl">
            No items have been returned on this loan yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {returns.map((ret) => (
              <div
                key={ret.id}
                className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs flex items-center justify-between"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                    {ret.returnType === 'returned'
                      ? 'Returned to Lab'
                      : ret.returnType === 'damaged'
                      ? 'Reported Damaged'
                      : 'Reported Lost'}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Recorded on {new Date(ret.returnDate).toLocaleDateString()}
                  </span>
                </div>
                <Badge
                  variant={
                    ret.returnType === 'returned'
                      ? 'success'
                      : ret.returnType === 'damaged'
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                >
                  Qty: {ret.quantity}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Renewal Requests */}
      <Card className="p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Renewal Requests ({renewals.length})
          </h2>
        </div>

        {renewals.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center border border-dashed rounded-xl">
            No loan renewals have been requested for this borrow.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {renewals.map((ren) => (
              <div
                key={ren.id}
                className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs flex items-center justify-between"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Requested on {new Date(ren.renewalDate).toLocaleDateString()}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    ID: {ren.id.substring(0, 8)}...
                  </span>
                </div>
                <StatusBadge status={ren.renewalStatus} size="sm" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

