'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  Barcode,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Badge } from '@/src/components/ui/Badge';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { Modal } from '@/src/components/ui/Modal';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { borrowsApi } from '@/src/api/borrows.api';
import {
  BorrowWithItemsDTO,
  BorrowItemDTO,
  ReturnItemDTO,
  ReturnType,
} from '@/src/types/borrow.types';
import { useToast } from '@/src/context/ToastContext';
import { ApiError } from '@/src/types/api.types';

export default function ProcessReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const toast = useToast();

  const [borrow, setBorrow] = useState<BorrowWithItemsDTO | null>(null);
  const [returns, setReturns] = useState<ReturnItemDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Return dialog state
  const [selectedItem, setSelectedItem] = useState<BorrowItemDTO | null>(null);
  const [returnType, setReturnType] = useState<ReturnType>('returned');
  const [returnQty, setReturnQty] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [borrowData, returnsData] = await Promise.allSettled([
        borrowsApi.getBorrow(id),
        borrowsApi.listReturns(id),
      ]);

      if (borrowData.status === 'fulfilled') setBorrow(borrowData.value);
      if (returnsData.status === 'fulfilled') setReturns(returnsData.value);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleOpenReturnModal = (item: BorrowItemDTO) => {
    setSelectedItem(item);
    setReturnType('returned');
    setReturnQty(item.quantity);
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      await borrowsApi.createReturn(id, {
        borrowItemId: selectedItem.id,
        returnType,
        quantity: Number(returnQty),
      });

      toast.success(
        returnType === 'returned'
          ? 'Item return recorded! Restored to available stock.'
          : returnType === 'damaged'
          ? 'Item condition flagged as under repair.'
          : 'Item marked as lost.'
      );

      setSelectedItem(null);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to process return.');
      } else {
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!borrow) {
    return <div className="p-8 text-center">Borrow agreement not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Link
        href="/admin/borrows"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Borrows</span>
      </Link>

      <Card className="p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={borrow.borrowStatus} size="sm" />
              <span className="text-xs font-mono text-zinc-400">ID: {borrow.id}</span>
            </div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Return Intake & Hardware Inspection
            </h1>
          </div>
          <div className="text-xs text-zinc-500">
            Due: <strong className="text-zinc-800 dark:text-zinc-200">{new Date(borrow.dueDate).toLocaleDateString()}</strong>
          </div>
        </div>

        {/* Borrowed items list */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Items Outstanding on this Loan
          </h2>

          <div className="flex flex-col gap-2.5">
            {borrow.items?.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {item.component?.name || 'Component'}
                    </span>
                    {item.componentInstanceId && (
                      <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Barcode className="w-3.5 h-3.5" />
                        Instance ID: {item.componentInstanceId}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <Badge variant="neutral" size="sm">
                    Qty: {item.quantity}
                  </Badge>

                  {borrow.borrowStatus !== 'fully_returned' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenReturnModal(item)}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Intake Item
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Return logs table */}
      <Card className="p-6 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Logged Returns for this Agreement ({returns.length})
        </h2>

        {returns.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center border border-dashed rounded-xl">
            No items have been processed for return yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {returns.map((ret) => (
              <div
                key={ret.id}
                className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                    {ret.returnType === 'returned'
                      ? 'Returned (Working Condition)'
                      : ret.returnType === 'damaged'
                      ? 'Marked as Damaged (Under Repair)'
                      : 'Marked as Lost (Not Working)'}
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

      {/* Return Intake Modal */}
      <Modal
        isOpen={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        title="Record Equipment Return"
      >
        <form onSubmit={handleSubmitReturn} className="flex flex-col gap-4">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs flex flex-col gap-1">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {selectedItem?.component?.name || 'Selected Item'}
            </span>
            {selectedItem?.componentInstanceId && (
              <span className="font-mono text-[11px] text-zinc-500">
                Instance ID: {selectedItem.componentInstanceId}
              </span>
            )}
            <span className="text-[11px] text-zinc-400">
              Max Quantity: {selectedItem?.quantity}
            </span>
          </div>

          <Select
            label="Condition Inspection Result"
            value={returnType}
            onChange={(e) => setReturnType(e.target.value as ReturnType)}
          >
            <option value="returned">Working Condition (Returned to Lab Stock)</option>
            <option value="damaged">Damaged / Broken (Send to Repair)</option>
            <option value="lost">Lost / Missing (Update Lost Inventory Count)</option>
          </Select>

          <Input
            label="Quantity Being Returned"
            type="number"
            min={1}
            max={selectedItem?.quantity || 1}
            value={returnQty}
            onChange={(e) => setReturnQty(parseInt(e.target.value, 10) || 1)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedItem(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Confirm Intake
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

