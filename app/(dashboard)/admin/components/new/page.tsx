'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Plus, Barcode, Boxes } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { categoriesApi } from '@/src/api/categories.api';
import { componentsApi } from '@/src/api/components.api';
import { CategoryDTO } from '@/src/types/category.types';
import { InventoryType } from '@/src/types/component.types';
import { useToast } from '@/src/context/ToastContext';
import { ApiError } from '@/src/types/api.types';

export default function NewComponentPage() {
  const router = useRouter();
  const toast = useToast();

  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [inventoryType, setInventoryType] = useState<InventoryType>('sticker_based');
  const [totalQuantity, setTotalQuantity] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await categoriesApi.listCategories();
        if (cats && cats.length > 0) {
          setCategories(cats);
          setCategoryId(cats[0].id);
        }
      } catch {
        // Fallback
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Component name is required');
      return;
    }
    if (!categoryId) {
      toast.error('Please select or create a category first');
      return;
    }

    setIsLoading(true);
    try {
      const comp = await componentsApi.createComponent({
        name: name.trim(),
        categoryId,
        description: description.trim() || null,
        inventoryType,
        totalQuantity: inventoryType === 'quantity_based' ? Number(totalQuantity) : undefined,
      });

      toast.success(`Component "${comp.name}" created!`);
      router.push(`/admin/components/${comp.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to create component.');
      } else {
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <Link
        href="/admin/components"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Components</span>
      </Link>

      <Card className="p-6 sm:p-8 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Register New Hardware Component
          </h1>
          <p className="text-xs text-zinc-500">
            Define item details and configure inventory tracking type
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Component Name"
            placeholder="e.g. Arduino Uno R4 WiFi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<Package className="w-4 h-4" />}
            autoFocus
          />

          <Select
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">
              Description / Specifications
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 32-bit Renesas RA4M1 MCU, ESP32-S3 module, USB-C"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Inventory Type Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">
              Inventory Tracking Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setInventoryType('sticker_based')}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                  inventoryType === 'sticker_based'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <Barcode className="w-4 h-4" />
                  <span>Sticker / Barcode Based</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Each physical unit receives a unique barcode sticker (e.g. ARD-UNO-001) for precise checkout and tracking.
                </p>
              </div>

              <div
                onClick={() => setInventoryType('quantity_based')}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                  inventoryType === 'quantity_based'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <Boxes className="w-4 h-4" />
                  <span>Quantity / Bulk Stock</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Tracked by bulk count (resistors, jumper wires, breadboards) without individual sticker labels.
                </p>
              </div>
            </div>
          </div>

          {/* Initial totalQuantity if quantity-based */}
          {inventoryType === 'quantity_based' && (
            <Input
              label="Initial Total Quantity in Stock"
              type="number"
              min={1}
              value={totalQuantity}
              onChange={(e) => setTotalQuantity(parseInt(e.target.value, 10) || 1)}
            />
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Hardware Component</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}

