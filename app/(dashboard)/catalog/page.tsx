'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  Search,
  Filter,
  Layers,
  Barcode,
  Boxes,
  ShoppingBag,
  Check,
  ChevronRight,
} from 'lucide-react';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { componentsApi } from '@/src/api/components.api';
import { categoriesApi } from '@/src/api/categories.api';
import { ComponentDTO, InventoryType } from '@/src/types/component.types';
import { CategoryDTO } from '@/src/types/category.types';
import { useCart } from '@/src/context/CartContext';
import { useToast } from '@/src/context/ToastContext';

export default function CatalogPage() {
  const { addItem, isInCart } = useCart();
  const toast = useToast();

  const [components, setComponents] = useState<ComponentDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'category' | 'name'>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [componentsError, setComponentsError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [componentsRetry, setComponentsRetry] = useState(0);
  const [categoriesRetry, setCategoriesRetry] = useState(0);

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories]
  );
  const sortedComponents = useMemo(() => {
    const result = [...components];
    if (sortBy === 'category') {
      result.sort((a, b) => {
        const categoryOrder = (categoryNames.get(a.categoryId) ?? '').localeCompare(
          categoryNames.get(b.categoryId) ?? '',
          undefined,
          { sensitivity: 'base' }
        );
        return categoryOrder || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    }
    return result;
  }, [components, categoryNames, sortBy]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load categories on mount and allow retry if the category service is unavailable.
  useEffect(() => {
    let isCurrent = true;

    async function loadCategories() {
      try {
        const cats = await categoriesApi.listCategories();
        if (!isCurrent) return;
        setCategories([...(cats ?? [])].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        ));
        setCategoriesError(null);
      } catch (error) {
        if (!isCurrent) return;
        setCategories([]);
        setCategoriesError(
          error instanceof Error ? error.message : 'Could not load categories.'
        );
      }
    }

    void loadCategories();
    return () => {
      isCurrent = false;
    };
  }, [categoriesRetry]);

  // Ignore stale responses when the user changes filters before a request finishes.
  useEffect(() => {
    let isCurrent = true;

    async function loadComponents() {
      setIsLoading(true);
      setComponentsError(null);
      try {
        const filters = {
          categoryId: selectedCategory || undefined,
          inventoryType: (selectedType as InventoryType) || undefined,
          search: debouncedSearch || undefined,
          limit: 100,
        };
        const firstPage = await componentsApi.listComponents({ ...filters, page: 1 });
        const totalPages = Math.ceil(
          (firstPage.pagination?.total ?? firstPage.components.length) / filters.limit
        );
        const remainingPages = await Promise.all(
          Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) =>
            componentsApi.listComponents({ ...filters, page: index + 2 })
          )
        );
        if (!isCurrent) return;
        setComponents(
          [firstPage, ...remainingPages].flatMap((page) => page.components ?? [])
        );
      } catch (error) {
        if (!isCurrent) return;
        setComponents([]);
        setComponentsError(
          error instanceof Error ? error.message : 'Could not load components.'
        );
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadComponents();
    return () => {
      isCurrent = false;
    };
  }, [selectedCategory, selectedType, debouncedSearch, componentsRetry]);

  const handleAddToCart = (comp: ComponentDTO, e: React.MouseEvent) => {
    e.preventDefault();
    addItem(comp, 1);
    toast.success(`Added ${comp.name} to reservation basket`);
  };

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto">
      {/* Header & Search */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Hardware Components
            </h1>
            <p className="text-xs text-zinc-500">
              Browse microcontrollers, sensors, ICs, and lab apparatus
            </p>
          </div>
          <Link href="/reservations/new">
            <Button size="sm" variant="outline" className="hidden sm:inline-flex">
              <ShoppingBag className="w-4 h-4" />
              <span>Review Basket</span>
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <Input
          placeholder="Search by component name, specification, or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="bg-white dark:bg-zinc-900"
        />
      </div>

      {/* Filter Chips (Horizontal scroll on mobile) */}
      <div className="flex flex-col gap-2.5">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === ''
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        {categoriesError && (
          <div role="alert" className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
            <span>Categories could not be loaded: {categoriesError}</span>
            <button
              type="button"
              onClick={() => setCategoriesRetry((attempt) => attempt + 1)}
              className="font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Inventory Type Toggle */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Type:
          </span>
          <button
            type="button"
            onClick={() => setSelectedType('')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              selectedType === ''
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            All Types
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('sticker_based')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors ${
              selectedType === 'sticker_based'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Barcode className="w-3 h-3" />
            <span>Sticker Based</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('quantity_based')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors ${
              selectedType === 'quantity_based'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Boxes className="w-3 h-3" />
            <span>Bulk Stock</span>
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Sort by:</span>
          <select
            aria-label="Sort components"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as 'newest' | 'category' | 'name')}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="newest">Newest</option>
            <option value="category">Category A–Z</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>

      {/* Components Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Skeleton key={n} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : componentsError ? (
        <Card role="alert" className="p-12 text-center flex flex-col items-center justify-center gap-3 border-dashed">
          <Layers className="w-10 h-10 text-rose-400 stroke-1" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Could not load components
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm">{componentsError}</p>
          <Button size="sm" variant="outline" onClick={() => setComponentsRetry((attempt) => attempt + 1)}>
            Retry
          </Button>
        </Card>
      ) : sortedComponents.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center gap-3 border-dashed">
          <Layers className="w-10 h-10 text-zinc-400 stroke-1" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No components found
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm">
            Try adjusting your search keywords or switching category filters.
          </p>
          {(searchQuery || selectedCategory || selectedType) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setSelectedType('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedComponents.map((comp) => {
            const inCart = isInCart(comp.id);
            const isSticker = comp.inventoryType === 'sticker_based';

            return (
              <Link key={comp.id} href={`/catalog/${comp.id}`} className="group">
                <Card
                  hoverable
                  className="h-full flex flex-col justify-between p-4.5 transition-all group-hover:border-emerald-400/50"
                >
                  {comp.imageUrl ? (
                    <img
                      src={comp.imageUrl}
                      alt={comp.name}
                      loading="lazy"
                      className="w-full h-44 object-cover rounded-xl mb-4"
                    />
                  ) : (
                    <div className="w-full h-28 rounded-xl mb-4 bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
                      <Package className="w-9 h-9 stroke-1" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    {/* Top tags */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="neutral" size="sm">
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
                      <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-600 transition-colors" />
                    </div>

                    {/* Name & description */}
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {comp.name}
                      </h3>
                      <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {categoryNames.get(comp.categoryId) ?? 'Uncategorized'}
                      </p>
                      <p className="text-xs text-zinc-500 line-clamp-2 mt-1 min-h-[2rem]">
                        {comp.description || 'No description available for this component.'}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Tray */}
                  <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      View details & stock
                    </span>
                    <Button
                      size="sm"
                      variant={inCart ? 'secondary' : 'primary'}
                      onClick={(e) => handleAddToCart(comp, e)}
                      className="shrink-0"
                    >
                      {inCart ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Reserve</span>
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

