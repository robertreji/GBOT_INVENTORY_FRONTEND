'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ComponentDTO } from '../types/component.types';

export interface CartItem {
  component: ComponentDTO;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (component: ComponentDTO, quantity?: number) => void;
  removeItem: (componentId: string) => void;
  updateQuantity: (componentId: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  isInCart: (componentId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'gbot_reservation_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {
        // LocalStorage quota or unavailable
      }
    }
  }, [items, isInitialized]);

  const addItem = useCallback((component: ComponentDTO, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.component.id === component.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }
      return [...prev, { component, quantity }];
    });
  }, []);

  const removeItem = useCallback((componentId: string) => {
    setItems((prev) => prev.filter((i) => i.component.id !== componentId));
  }, []);

  const updateQuantity = useCallback((componentId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(componentId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.component.id === componentId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback(
    (componentId: string) => items.some((i) => i.component.id === componentId),
    [items]
  );

  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

