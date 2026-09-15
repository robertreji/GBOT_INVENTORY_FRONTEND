'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Handshake,
  Plus,
  Trash2,
  Calendar,
  User,
  Barcode,
  Boxes,
  Scan,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../../../../src/components/ui/Button';
import { Card } from '../../../../../src/components/ui/Card';
import { Input } from '../../../../../src/components/ui/Input';
import { Select } from '../../../../../src/components/ui/Select';
import { BarcodeScanner } from '../../../../../src/components/common/BarcodeScanner';
import { usersApi } from '../../../../../src/api/users.api';
import { componentsApi } from '../../../../../src/api/components.api';
import { borrowsApi } from '../../../../../src/api/borrows.api';
import { UserDTO } from '../../../../../src/types/user.types';
import { ComponentDTO, ComponentInstanceDTO } from '../../../../../src/types/component.types';
import { useToast } from '../../../../../src/context/ToastContext';
import { ApiError } from '../../../../../src/types/api.types';

interface IssueItemRow {
  componentId: string;
  componentInstanceId?: string;
  quantity: number;
  inventoryType: 'sticker_based' | 'quantity_based';
  availableInstances?: ComponentInstanceDTO[];
}

function NewBorrowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [users, setUsers] = useState<UserDTO[]>([]);
  const [components, setComponents] = useState<ComponentDTO[]>([]);
  const [userId, setUserId] = useState(searchParams.get('userId') || '');
  const [reservationId, setReservationId] = useState(searchParams.get('reservationId') || '');

  // Default dueDate 14 days ahead
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 14);
  const [dueDate, setDueDate] = useState(defaultDueDate.toISOString().split('T')[0]);

  const [items, setItems] = useState<IssueItemRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeScannerRow, setActiveScannerRow] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [usersRes, compsRes] = await Promise.allSettled([
          usersApi.listUsers(1, 100),
          componentsApi.listComponents({ limit: 100 }),
        ]);

        if (usersRes.status === 'fulfilled' && usersRes.value?.users) {
          setUsers(usersRes.value.users);
          if (!userId && usersRes.value.users.length > 0) {
            setUserId(usersRes.value.users[0].id);
          }
        }

        if (compsRes.status === 'fulfilled' && compsRes.value?.components) {
          setComponents(compsRes.value.components);
        }
      } catch {
        // Fallback
      }
    }
    loadData();
  }, [userId]);

  const handleAddComponentRow = async (componentId: string) => {
    const comp = components.find((c) => c.id === componentId);
    if (!comp) return;

    let availableInstances: ComponentInstanceDTO[] = [];
    if (comp.inventoryType === 'sticker_based') {
      try {
        const allInsts = await componentsApi.listInstances(comp.id);
        availableInstances = allInsts.filter((i) => i.conditionStatus === 'working');
      } catch {
        // Fallback
      }
    }

    setItems((prev) => [
      ...prev,
      {
        componentId: comp.id,
        inventoryType: comp.inventoryType,
        quantity: 1,
        componentInstanceId: availableInstances[0]?.id || undefined,
        availableInstances,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error('Please select a student');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one component to issue');
      return;
    }

    for (const item of items) {
      if (item.inventoryType === 'sticker_based' && !item.componentInstanceId) {
        toast.error('Sticker-based components require selecting a physical sticker unit');
        return;
      }
    }

    setIsLoading(true);
    try {
      const dueDateIso = new Date(`${dueDate}T17:00:00.000Z`).toISOString();

      await borrowsApi.createBorrow({
        userId,
        reservationId: reservationId || null,
        dueDate: dueDateIso,
        items: items.map((i) => ({
          componentId: i.componentId,
          componentInstanceId: i.componentInstanceId || null,
          quantity: Number(i.quantity),
        })),
      });

      toast.success('Equipment checkout complete! Loan agreement active.');
      router.push('/admin/borrows');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to issue borrow.');
      } else {
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Link
        href="/admin/borrows"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Borrows</span>
      </Link>

      <Card className="p-6 sm:p-8 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Issue Hardware Loan (Checkout)
          </h1>
          <p className="text-xs text-zinc-500">
            Check out equipment directly or fulfill an approved student reservation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* User selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Borrowing Student"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </Select>

            <Input
              label="Return Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              leftIcon={<Calendar className="w-4 h-4" />}
            />
          </div>

          {reservationId && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <span>Linking to Reservation ID: <strong className="font-mono">{reservationId}</strong></span>
              <button
                type="button"
                onClick={() => setReservationId('')}
                className="text-[11px] underline hover:text-amber-950"
              >
                Unlink
              </button>
            </div>
          )}

          {/* Add Component Picker */}
          <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">
              Select Component to Add
            </label>
            <div className="flex gap-2">
              <select
                id="component-picker-select"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddComponentRow(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="" disabled>
                  -- Select hardware item to issue --
                </option>
                {components.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} ({comp.inventoryType.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items Table / Cards */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Items to Issue ({items.length})
            </span>

            {items.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center border border-dashed rounded-xl">
                No items added yet. Choose a component above.
              </p>
            ) : (
              items.map((row, idx) => {
                const comp = components.find((c) => c.id === row.componentId);

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {row.inventoryType === 'sticker_based' ? (
                        <Barcode className="w-5 h-5 text-sky-600 shrink-0" />
                      ) : (
                        <Boxes className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {comp?.name}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {row.inventoryType === 'sticker_based'
                            ? 'Sticker Unit Required'
                            : 'Quantity Stock'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {row.inventoryType === 'sticker_based' ? (
                        <div className="flex items-center gap-1.5">
                          <Select
                            value={row.componentInstanceId || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setItems((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, componentInstanceId: val } : item
                                )
                              );
                            }}
                            className="h-9 min-h-[36px] text-xs py-1 w-44"
                          >
                            <option value="" disabled>Select Sticker...</option>
                            {row.availableInstances?.map((inst) => (
                              <option key={inst.id} value={inst.id}>
                                {inst.stickerCode} (Working)
                              </option>
                            ))}
                          </Select>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveScannerRow(idx)}
                            title="Scan sticker barcode"
                          >
                            <Scan className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-400 font-medium">Qty:</span>
                          <Input
                            type="number"
                            min={1}
                            value={row.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 1;
                              setItems((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, quantity: val } : item
                                )
                              );
                            }}
                            className="w-20 h-9 min-h-[36px] text-xs text-center"
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={items.length === 0}
            className="w-full mt-2"
          >
            <Handshake className="w-4 h-4" />
            <span>Approve & Issue Hardware Loan</span>
          </Button>
        </form>
      </Card>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={activeScannerRow !== null}
        onClose={() => setActiveScannerRow(null)}
        onScan={(code) => {
          if (activeScannerRow !== null) {
            const row = items[activeScannerRow];
            const match = row.availableInstances?.find((i) => i.stickerCode === code);
            if (match) {
              setItems((prev) =>
                prev.map((item, i) =>
                  i === activeScannerRow ? { ...item, componentInstanceId: match.id } : item
                )
              );
              toast.success(`Matched sticker unit "${code}"`);
            } else {
              toast.warning(`Sticker "${code}" not found or not in working state`);
            }
          }
        }}
      />
    </div>
  );
}

export default function NewBorrowPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-400">Loading...</div>}>
      <NewBorrowContent />
    </Suspense>
  );
}

