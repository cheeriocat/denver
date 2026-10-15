// src/contexts/CartContext.jsx
// Cart state with localStorage persistence, stock enforcement, cart-sidebar
// open state, and a global "added to cart" toast.

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CART_KEY = 'denver_cart_v2';
const CartContext = createContext(null);

export function CartProvider({ children }) {
  // ── Cart items (restored from localStorage on first render) ─────────────
  const [cartItems, setCartItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
  });

  // ── Sidebar open state ────────────────────────────────────────────────────
  const [cartOpen, setCartOpen] = useState(false);

  // ── Global toast (used for "Added to Cart" notifications) ─────────────────
  const [toast, setToast] = useState({ show: false, message: '' });

  // Persist to localStorage whenever cartItems changes
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const showToast = useCallback((msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast(p => ({ ...p, show: false })), 2500);
  }, []);

  /**
   * Adds product+size to cart with stock enforcement.
   * If `size` is omitted, picks the first size with stock > 0.
   */
  const addToCart = useCallback((product, providedSize = null) => {
    setCartItems(prev => {
      // Determine size to use
      let size = providedSize;
      if (!size) {
        if (product.stock) {
          const entry = Object.entries(product.stock).find(([, qty]) => qty > 0);
          size = entry ? entry[0] : Object.keys(product.stock)[0];
        } else if (product.sizes?.length) {
          size = product.sizes[0];
        } else {
          size = 'M';
        }
      }

      const stockQty = product.stock ? (product.stock[size] ?? 0) : 99;
      const key = `${product.id}-${size}`;
      const existing = prev.find(i => `${i.id}-${i.size}` === key);

      if (stockQty === 0) {
        showToast('Out of stock');
        return prev;
      }
      if (existing) {
        if (existing.qty >= stockQty) {
          showToast('Maximum stock reached');
          return prev;
        }
        showToast(`${product.name} Added to Cart`);
        return prev.map(i => i === existing ? { ...i, qty: i.qty + 1 } : i);
      }

      showToast(`${product.name} Added to Cart`);
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        size,
        qty: 1,
        image: (product.images?.length > 0) ? product.images[0] : (product.image || '/tshirt_black.jpg'),
        stock: product.stock || null,
      }];
    });
  }, [showToast]);

  const updateQty = useCallback((item, delta) => {
    setCartItems(prev => {
      const newQty = item.qty + delta;
      if (newQty <= 0) return prev.filter(i => !(i.id === item.id && i.size === item.size));
      // Stock cap on increase
      if (delta > 0 && item.stock) {
        const cap = item.stock[item.size] ?? 0;
        if (newQty > cap) return prev;
      }
      return prev.map(i =>
        (i.id === item.id && i.size === item.size) ? { ...i, qty: newQty } : i
      );
    });
  }, []);

  const removeItem = useCallback((item) => {
    setCartItems(prev => prev.filter(i => !(i.id === item.id && i.size === item.size)));
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const openCart  = useCallback(() => setCartOpen(true),  []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const cartCount    = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const cartSubtotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      cartSubtotal,
      cartOpen,
      openCart,
      closeCart,
      addToCart,
      updateQty,
      removeItem,
      clearCart,
      toast,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
