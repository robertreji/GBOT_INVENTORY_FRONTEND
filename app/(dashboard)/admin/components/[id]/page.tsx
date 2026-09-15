'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  Barcode,
  Boxes,
  Plus,
  Trash2,
  Scan,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Badge } from '@/src/components/ui/Badge';
import { ConditionBadge } from '@/src/components/common/ConditionBadge';
import { BarcodeScanner } from '@/src/components/common/BarcodeScanner';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { componentsApi } from '@/src/api/components.api';
import {
  ComponentDTO,
  ComponentInstanceDTO,
  QuantityInventoryDTO,
  ConditionStatus,
} from '@/src/types/component.types';
import { useToast } from '@/src/context/ToastContext';

export default function AdminComponentStockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const toast = useToast();

  const [component, setComponent] = useState<ComponentDTO | null>(null);
  const [instances, setInstances] = useState<ComponentInstanceDTO[]>([]);
  const [inventory, setInventory] = useState<QuantityInventoryDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sticker instance form
  const [newStickerCode, setNewStickerCode] = useState('');
  const [newCondition, setNewCondition] = useState<ConditionStatus>('working');
  const [isAddingInstance, setIsAddingInstance] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Quantity inventory form
  const [quantities, setQuantities] = useState({
    totalQuantity: 0,
    lostCount: 0,
    damagedCount: 0,
  });
  const [isSavingInventory, setIsSavingInventory] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const comp = await componentsApi.getComponent(id);
        setComponent(comp);

        if (comp.inventoryType === 'sticker_based') {
          const insts = await componentsApi.listInstances(id);
          if (insts) setInstances(insts);
        } else {
          const inv = await componentsApi.getInventory(id);
          if (inv) {
            setInventory(inv);
            setQuantities({
              totalQuantity: inv.totalQuantity,
              lostCount: inv.lostCount,
              damagedCount: inv.damagedCount,
            });
          }
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load component details');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, toast]);

  const handleAddInstance = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newStickerCode.trim()) {
      toast.error('Sticker barcode/QR code is required');
      return;
    }

    setIsAddingInstance(true);
    try {
      const created = await componentsApi.createInstance(id, {
        stickerCode: newStickerCode.trim(),
        conditionStatus: newCondition,
      });

      setInstances((prev) => [...prev, created]);
      setNewStickerCode('');
      toast.success(`Registered sticker instance "${created.stickerCode}"`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to register sticker instance.');
    } finally {
      setIsAddingInstance(false);
    }
  };

  const handleUpdateCondition = async (instanceId: string, condition: ConditionStatus) => {
    try {
      await componentsApi.updateInstance(id, instanceId, { conditionStatus: condition });
      setInstances((prev) =>
        prev.map((i) => (i.id === instanceId ? { ...i, conditionStatus: condition } : i))
      );
      toast.success('Condition status updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update condition');
    }
  };

  const handleDeleteInstance = async (instanceId: string, stickerCode: string) => {
    if (!confirm(`Delete sticker instance ${stickerCode}?`)) return;
    try {
      await componentsApi.deleteInstance(id, instanceId);
      setInstances((prev) => prev.filter((i) => i.id !== instanceId));
      toast.success(`Removed instance ${stickerCode}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete instance');
    }
  };

  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInventory(true);
    try {
      const updated = await componentsApi.updateInventory(id, {
        totalQuantity: Number(quantities.totalQuantity),
        lostCount: Number(quantities.lostCount),
        damagedCount: Number(quantities.damagedCount),
      });
      setInventory(updated);
      toast.success('Stock numbers successfully updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update stock');
    } finally {
      setIsSavingInventory(false);
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

  if (!component) {
    return <div className="p-8 text-center">Component not found</div>;
  }

  const isSticker = component.inventoryType === 'sticker_based';

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Link
        href="/admin/components"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Components List</span>
      </Link>

      {/* Component Header Card */}
      <Card className="p-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="sm">
            {isSticker ? 'Sticker Based' : 'Quantity Based'}
          </Badge>
          <span className="text-xs text-zinc-400 font-mono">UUID: {component.id}</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{component.name}</h1>
        <p className="text-xs text-zinc-500">{component.description || 'No description'}</p>
      </Card>

      {/* Sticker Instances Management */}
      {isSticker ? (
        <div className="flex flex-col gap-5">
          <Card className="p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Register Physical Sticker Instance
              </h2>
              <p className="text-xs text-zinc-500">
                Scan or enter the unique barcode label applied to the physical unit
              </p>
            </div>

            <form onSubmit={handleAddInstance} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="e.g. ARD-UNO-004"
                  value={newStickerCode}
                  onChange={(e) => setNewStickerCode(e.target.value)}
                  leftIcon={<Barcode className="w-4 h-4" />}
                />
              </div>

              <div className="w-full sm:w-40">
                <Select
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value as ConditionStatus)}
                >
                  <option value="working">Working</option>
                  <option value="under_repair">Under Repair</option>
                  <option value="not_working">Not Working</option>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setScannerOpen(true)}
                  title="Open Camera Scanner"
                >
                  <Scan className="w-4 h-4" />
                </Button>
                <Button type="submit" variant="primary" isLoading={isAddingInstance}>
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </Button>
              </div>
            </form>
          </Card>

          {/* Instances List */}
          <Card className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Physical Units Registered ({instances.length})
              </h2>
              <span className="text-xs text-zinc-500">
                {instances.filter((i) => i.conditionStatus === 'working').length} Working
              </span>
            </div>

            {instances.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center border border-dashed rounded-xl">
                No sticker instances registered yet. Add one above or scan a barcode.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {instances.map((inst) => (
                  <div
                    key={inst.id}
                    className="p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <Barcode className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {inst.stickerCode}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">ID: {inst.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Select
                        value={inst.conditionStatus}
                        onChange={(e) =>
                          handleUpdateCondition(inst.id, e.target.value as ConditionStatus)
                        }
                        className="h-9 min-h-[36px] text-xs py-1"
                      >
                        <option value="working">Working</option>
                        <option value="under_repair">Under Repair</option>
                        <option value="not_working">Not Working</option>
                      </Select>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:bg-rose-50"
                        onClick={() => handleDeleteInstance(inst.id, inst.stickerCode)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* Quantity Inventory Management */
        <Card className="p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Bulk Stock Adjustment
            </h2>
            <p className="text-xs text-zinc-500">
              Adjust aggregate count and track lost or damaged parts
            </p>
          </div>

          <form onSubmit={handleSaveInventory} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Total Quantity Owned"
                type="number"
                min={0}
                value={quantities.totalQuantity}
                onChange={(e) =>
                  setQuantities({ ...quantities, totalQuantity: parseInt(e.target.value, 10) || 0 })
                }
              />
              <Input
                label="Lost Count"
                type="number"
                min={0}
                value={quantities.lostCount}
                onChange={(e) =>
                  setQuantities({ ...quantities, lostCount: parseInt(e.target.value, 10) || 0 })
                }
              />
              <Input
                label="Damaged Count"
                type="number"
                min={0}
                value={quantities.damagedCount}
                onChange={(e) =>
                  setQuantities({ ...quantities, damagedCount: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>

            {/* Live Calculation formula indicator */}
            {inventory && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-xs flex flex-col gap-1.5">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Stock Availability Formula:
                </span>
                <span className="font-mono text-zinc-500">
                  available = {quantities.totalQuantity} - {inventory.reservedQuantity} (reserved) -{' '}
                  {inventory.borrowedQuantity} (borrowed) - {quantities.lostCount} (lost) -{' '}
                  {quantities.damagedCount} (damaged) ={' '}
                  <strong className="text-emerald-600 font-bold">
                    {Math.max(
                      0,
                      quantities.totalQuantity -
                        inventory.reservedQuantity -
                        inventory.borrowedQuantity -
                        quantities.lostCount -
                        quantities.damagedCount
                    )}
                  </strong>
                </span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isSavingInventory}
              leftIcon={<Save className="w-4 h-4" />}
              className="w-fit self-end"
            >
              Update Stock Numbers
            </Button>
          </form>
        </Card>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(code) => {
          setNewStickerCode(code);
        }}
      />
    </div>
  );
}

