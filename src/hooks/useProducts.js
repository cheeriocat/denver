// src/hooks/useProducts.js
// Fetches active products from Firestore `products` collection.
// Falls back gracefully on error.

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * @returns {{ products: Array, loading: boolean, error: string|null }}
 */
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      try {
        const q = query(
          collection(db, 'products'),
          where('active', '==', true),
          orderBy('createdAt', 'asc')
        );
        const snap = await getDocs(q);
        if (!cancelled) {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setProducts(docs);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('useProducts error:', err);
          // If index not ready yet, try without orderBy as fallback
          if (err.code === 'failed-precondition' || err.code === 'unimplemented') {
            try {
              const q2 = query(
                collection(db, 'products'),
                where('active', '==', true)
              );
              const snap2 = await getDocs(q2);
              if (!cancelled) {
                const docs2 = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
                setProducts(docs2);
                setLoading(false);
              }
            } catch (err2) {
              if (!cancelled) {
                setError(err2.message);
                setLoading(false);
              }
            }
          } else {
            setError(err.message);
            setLoading(false);
          }
        }
      }
    }

    fetchProducts();
    return () => { cancelled = true; };
  }, []);

  return { products, loading, error };
}
