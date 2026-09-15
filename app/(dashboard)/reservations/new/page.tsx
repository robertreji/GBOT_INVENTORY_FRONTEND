'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Calendar,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { useCart } from '@/src/context/CartContext';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { reservationsApi } from '@/src/api/reservations.api';
import { ApiError } from '@/src/types/api.types';

export default function NewReservationPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, totalCount } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  // Default expiration: 3 days from now
  const defaultExpiry = new Date();
  defaultExpiry.setDate(defaultExpiry.getDate() + 3);
  const defaultExpiryStr = defaultExpiry.toISOString().split('T')[0];

  const [expiresAt, setExpiresAt] = useState<string>(defaultExpiryStr);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please sign in to complete your hardware reservation.');
      router.push('/login');
      return;
    }

    if (items.length === 0) {
      toast.error('Your reservation basket is empty');
      return;
    }

    setIsLoading(true);
    try {
      const payloadItems = items.map((i) => ({
        componentId: i.component.id,
        quantity: i.quantity,
      }));

      const expiryIso = expiresAt ? new Date(`${expiresAt}T18:00:00.000Z`).toISOString() : undefined;

      await reservationsApi.createReservation({
        items: payloadItems,
        expiresAt: expiryIso,
      });

      clearCart();
      toast.success('Reservation request placed successfully!');
      router.push('/reservations');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to place reservation.');
      } else {
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-1">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Your Basket is Empty</h2>
        <p className="text-xs text-zinc-500 max-w-xs">
          Explore the components catalog to find development boards and parts for your project.
        </p>
        <Link href="/catalog" className="mt-2">
          <Button size="md" variant="primary">
            Browse Components
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Reservation Basket ({totalCount} items)
          </h1>
          <p className="text-xs text-zinc-500">
            Confirm requested quantities before submitting to lab inventory
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-rose-600 hover:underline flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Items List */}
        <div className="flex flex-col gap-3">
          {items.map(({ component, quantity }) => (
            <Card key={component.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-xs font-semibold text-zinc-400 capitalize">
                  {component.inventoryType.replace('_', ' ')}
                </span>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {component.name}
                </h3>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 p-0.5">
                  <button
                    type="button"
                    onClick={() => updateQuantity(component.id, quantity - 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:bg-white dark:hover:bg-zinc-800"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center font-bold text-xs">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(component.id, quantity + 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:bg-white dark:hover:bg-zinc-800"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(component.id)}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Expiration Settings */}
        <Card className="p-5 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Pickup & Expiry Preference
          </h2>
          <p className="text-xs text-zinc-500">
            Reservations are automatically released back into inventory if not collected before expiration.
          </p>

          <Input
            label="Hold Reservation Until (Expires At)"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
          />
        </Card>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Link href="/catalog" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Browsing</span>
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full sm:w-auto"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Confirm Reservation
          </Button>
        </div>
      </form>
    </div>
  );
}

