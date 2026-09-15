'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  Barcode,
  Boxes,
  Trash2,
  Edit,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { componentsApi } from '@/src/api/components.api';
import { ComponentDTO } from '@/src/types/component.types';
import { useToast } from '@/src/context/ToastContext';

export default function AdminComponentsPage() {
  const toast = useToast();
  const [components, setComponents] = useState<ComponentDTO[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchComponents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await componentsApi.listComponents({ search: search || undefined, limit: 100 });
      if (res?.components) setComponents(res.components);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete component "${name}"? This action is permanent.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await componentsApi.deleteComponent(id);
      toast.success(`Component "${name}" deleted.`);
      setComponents((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete component.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Hardware Catalog Management
          </h1>
          <p className="text-xs text-zinc-500">
            Add and manage microcontroller boards, sensors, instances, and bulk stock
          </p>
        </div>

        <Link href="/admin/components/new">
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Create Component
          </Button>
        </Link>
      </div>

      <Input
        placeholder="Search components by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={<Search className="w-4 h-4" />}
        className="bg-white dark:bg-zinc-900"
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : components.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <p className="text-xs text-zinc-500">No components registered yet.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {components.map((comp) => {
            const isSticker = comp.inventoryType === 'sticker_based';
            return (
              <Card
                key={comp.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSticker
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                    }`}
                  >
                    {isSticker ? <Barcode className="w-5 h-5" /> : <Boxes className="w-5 h-5" />}
                  </div>

                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {comp.name}
                      </h3>
                      <Badge variant="neutral" size="sm">
                        {isSticker ? 'Sticker Based' : 'Quantity Based'}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-1">
                      {comp.description || 'No description'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link href={`/admin/components/${comp.id}`}>
                    <Button size="sm" variant="secondary" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                      Manage Stock
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    isLoading={deletingId === comp.id}
                    onClick={() => handleDelete(comp.id, comp.name)}
                    aria-label="Delete component"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

