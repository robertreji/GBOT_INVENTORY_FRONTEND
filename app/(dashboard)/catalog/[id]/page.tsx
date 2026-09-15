'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Barcode,
  Boxes,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Plus,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { ConditionBadge } from '@/src/components/common/ConditionBadge';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { componentsApi } from '@/src/api/components.api';
import {
  ComponentDTO,
  ComponentInstanceDTO,
  QuantityInventoryDTO,
} from '@/src/types/component.types';
import { useCart } from '@/src/context/CartContext';
import { useToast } from '@/src/context/ToastContext';

export default function ComponentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { addItem, isInCart } = useCart();
  const toast = useToast();

  const [component, setComponent] = useState<ComponentDTO | null>(null);
  const [instances, setInstances] = useState<ComponentInstanceDTO[]>([]);
  const [inventory, setInventory] = useState<QuantityInventoryDTO | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadComponentData() {
      setIsLoading(true);
      try {
        const comp = await componentsApi.getComponent(id);
        setComponent(comp);

        if (comp.inventoryType === 'sticker_based') {
          const insts = await componentsApi.listInstances(id);
          if (insts) setInstances(insts);
        } else {
          const inv = await componentsApi.getInventory(id);
          if (inv) setInventory(inv);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load component details');
      } finally {
        setIsLoading(false);
      }
    }

    loadComponentData();
  }, [id, toast]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!component) {
    return (
      <div className="max-w-md mx-auto text-center py-16 flex flex-col items-center gap-3">
        <h2 className="text-lg font-bold">Component Not Found</h2>
        <p className="text-xs text-zinc-500">The component you requested does not exist or has been removed.</p>
        <Link href="/catalog">
          <Button size="sm">Back to Catalog</Button>
        </Link>
      </div>
    );
  }

  const isSticker = component.inventoryType === 'sticker_based';
  const workingInstancesCount = instances.filter((i) => i.conditionStatus === 'working').length;
  const availableCount = isSticker ? workingInstancesCount : (inventory?.availableQuantity ?? 0);

  const handleAddToCart = () => {
    if (quantity > availableCount && availableCount > 0) {
      toast.warning(`Only ${availableCount} items currently available in lab stock.`);
    }
    addItem(component, quantity);
    toast.success(`Added ${quantity} ${component.name} to reservation basket!`);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Back button */}
      <Link
        href="/catalog"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalog</span>
      </Link>

      {/* Main Info Card */}
      <Card className="p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm">
                {isSticker ? (
                  <span className="flex items-center gap-1">
                    <Barcode className="w-3 h-3" /> Sticker Tagged
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Boxes className="w-3 h-3" /> Bulk Quantity
                  </span>
                )}
              </Badge>
              {availableCount > 0 ? (
                <Badge variant="success" size="sm">
                  {availableCount} Available
                </Badge>
              ) : (
                <Badge variant="danger" size="sm">
                  Out of Stock
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {component.name}
            </h1>
          </div>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {component.description || 'No detailed description provided for this component.'}
        </p>

        {/* Quantity Stepper & Add to Basket */}
        <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-zinc-500">Quantity:</span>
            <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:bg-white dark:hover:bg-zinc-800"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <Button
            size="md"
            variant="primary"
            onClick={handleAddToCart}
            leftIcon={<ShoppingBag className="w-4 h-4" />}
            className="sm:w-auto w-full"
          >
            <span>{isInCart(component.id) ? 'Add More to Basket' : 'Add to Reservation'}</span>
          </Button>
        </div>
      </Card>

      {/* Stock & Instances Breakdown */}
      {isSticker ? (
        <Card className="p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-sky-600" />
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Sticker Units ({instances.length} total)
              </h2>
            </div>
            <span className="text-xs text-zinc-500 font-medium">
              {workingInstancesCount} ready for issue
            </span>
          </div>

          {instances.length === 0 ? (
            <p className="text-xs text-zinc-500 py-3 text-center border border-dashed rounded-xl">
              No physical instances registered yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {instances.map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs"
                >
                  <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                    {inst.stickerCode}
                  </span>
                  <ConditionBadge condition={inst.conditionStatus} size="sm" />
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : inventory ? (
        <Card className="p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-sky-600" />
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Bulk Stock Summary
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-center">
              <span className="text-[11px] text-zinc-400 font-medium block">Total Stock</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{inventory.totalQuantity}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/50 text-center">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">Available</span>
              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{inventory.availableQuantity}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/50 text-center">
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium block">Reserved</span>
              <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{inventory.reservedQuantity}</span>
            </div>
            <div className="p-3 rounded-xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800/50 text-center">
              <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium block">Borrowed</span>
              <span className="text-lg font-bold text-sky-700 dark:text-sky-300">{inventory.borrowedQuantity}</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800/50 text-center">
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium block">Lost / Damaged</span>
              <span className="text-lg font-bold text-rose-700 dark:text-rose-300">
                {inventory.lostCount + inventory.damagedCount}
              </span>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

