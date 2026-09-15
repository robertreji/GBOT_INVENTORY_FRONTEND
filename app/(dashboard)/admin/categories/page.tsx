'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FolderTree, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { categoriesApi } from '@/src/api/categories.api';
import { CategoryDTO } from '@/src/types/category.types';
import { useToast } from '@/src/context/ToastContext';

export default function AdminCategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await categoriesApi.listCategories();
      if (data) setCategories(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsCreating(true);
    try {
      const created = await categoriesApi.createCategory({ name: newCatName.trim() });
      setCategories((prev) => [...prev, created]);
      setNewCatName('');
      toast.success(`Category "${created.name}" created!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create category.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      const updated = await categoriesApi.updateCategory(id, { name: editingName.trim() });
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
      toast.success('Category updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update category');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Components referencing this category must be reassigned first.`)) {
      return;
    }

    try {
      await categoriesApi.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success(`Category "${name}" deleted.`);
    } catch (err: any) {
      toast.error(err.message || 'Cannot delete category with associated components.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Component Categories
        </h1>
        <p className="text-xs text-zinc-500">
          Organize equipment into microcontrollers, sensors, actuators, kits, etc.
        </p>
      </div>

      {/* Add Category Form */}
      <Card className="p-5 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Add New Category</h2>
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            placeholder="e.g. Microcontrollers & Dev Boards"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            leftIcon={<FolderTree className="w-4 h-4" />}
          />
          <Button type="submit" variant="primary" isLoading={isCreating} disabled={!newCatName.trim()}>
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </Button>
        </form>
      </Card>

      {/* Categories List */}
      <Card className="p-5 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Existing Categories ({categories.length})
        </h2>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center border border-dashed rounded-xl">
            No categories defined yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-3 text-sm"
              >
                {editingId === cat.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-9 min-h-[36px] text-xs"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdate(cat.id)}
                      className="p-1.5 rounded-lg bg-emerald-600 text-white"
                      title="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditingName(cat.name);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Edit name"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

