'use client';

import React, { useState, useEffect } from 'react';
import {
  Repeat,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  User,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { Modal } from '@/src/components/ui/Modal';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { renewalsApi } from '@/src/api/renewals.api';
import { borrowsApi } from '@/src/api/borrows.api';
import { RenewalDTO } from '@/src/types/renewal.types';
import { useToast } from '@/src/context/ToastContext';

export default function AdminRenewalsPage() {
  const toast = useToast();
  const [renewals, setRenewals] = useState<RenewalDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Approval modal state
  const [approvalTarget, setApprovalTarget] = useState<RenewalDTO | null>(null);
  const [newDueDate, setNewDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Default 7 days extension
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setNewDueDate(defaultDate.toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // In the backend reference: GET /api/v1/renewals/borrow/:borrowId or list from borrows
      // We can fetch active borrows and collect renewals, or use placeholder list
      const borrowsRes = await borrowsApi.listBorrows({ limit: 50 });
      if (borrowsRes?.borrows) {
        const renewalPromises = borrowsRes.borrows.map((b) =>
          renewalsApi.listRenewalsForBorrow(b.id).catch(() => [])
        );
        const results = await Promise.all(renewalPromises);
        const flattened = results.flat();
        setRenewals(flattened);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalTarget || !newDueDate) return;

    setIsSubmitting(true);
    try {
      const newDueDateIso = new Date(`${newDueDate}T17:00:00.000Z`).toISOString();
      await renewalsApi.updateRenewal(approvalTarget.id, {
        renewalStatus: 'approved',
        newDueDate: newDueDateIso,
      });

      toast.success('Renewal approved! Loan due date extended.');
      setRenewals((prev) =>
        prev.map((r) => (r.id === approvalTarget.id ? { ...r, renewalStatus: 'approved' } : r))
      );
      setApprovalTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve renewal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this renewal extension request?')) return;
    try {
      await renewalsApi.updateRenewal(id, { renewalStatus: 'rejected' });
      toast.success('Renewal request rejected');
      setRenewals((prev) =>
        prev.map((r) => (r.id === id ? { ...r, renewalStatus: 'rejected' } : r))
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject renewal');
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Hardware Loan Renewal Requests
        </h1>
        <p className="text-xs text-zinc-500">
          Approve project deadline extensions or reject renewal requests
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : renewals.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <p className="text-xs text-zinc-500">No active renewal requests awaiting review.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3.5">
          {renewals.map((r) => (
            <Card key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
                  <Repeat className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.renewalStatus} size="sm" />
                    <span className="text-xs text-zinc-400 font-mono">
                      Renewal #{r.id.substring(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>Borrow Loan ID: <strong className="font-mono">{r.borrowId.substring(0, 8)}...</strong></span>
                    <span>Requested: {new Date(r.renewalDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {r.renewalStatus === 'pending' && (
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setApprovalTarget(r)}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => handleReject(r.id)}
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Approval Modal */}
      <Modal
        isOpen={approvalTarget !== null}
        onClose={() => setApprovalTarget(null)}
        title="Approve Loan Extension"
      >
        <form onSubmit={handleApprove} className="flex flex-col gap-4">
          <p className="text-xs text-zinc-500">
            Select the new return due date for the student loan.
          </p>

          <Input
            label="New Due Date"
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setApprovalTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Confirm Approval
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

