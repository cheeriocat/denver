// src/admin/orders/orderActions.js
// Transaction-safe order status management.
//
// Transitions with side-effects:
//   pending  → confirmed  : deduct stock, snapshot unitCost, recalc total, write mirror
//   confirmed|packed|shipped → cancelled : restore stock, write mirror
//   pending  → cancelled  : no stock change, write mirror
//   any other transition  : update status + courier fields, write mirror

import {
  doc,
  runTransaction,
  updateDoc,
  setDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

/** Write or overwrite the public orderTracking mirror doc. */
function writeMirror(txn, order, newStatus, courierFields = {}) {
  const ref = doc(db, 'orderTracking', order.orderNumber);
  const data = {
    orderNumber:    order.orderNumber,
    status:         newStatus,
    courierName:    courierFields.courierName    ?? order.courierName    ?? '',
    trackingNumber: courierFields.trackingNumber ?? order.trackingNumber ?? '',
    trackingUrl:    courierFields.trackingUrl    ?? order.trackingUrl    ?? '',
    updatedAt:      serverTimestamp(),
  };
  if (txn) txn.set(ref, data);
  else      setDoc(ref, data);
}

/**
 * pending → confirmed
 * - Deduct stock from each product doc (error if insufficient)
 * - Snapshot unitCost from productCosts/{productId}
 * - Recalculate total and flag mismatch
 * - Write orderTracking mirror
 *
 * Returns { totalMismatch: bool, recalcTotal: number }
 * Throws Error with a user-visible message on stock failure.
 */
export async function confirmOrder(order) {
  const orderRef   = doc(db, 'orders', order.id);
  const productIds = [...new Set(order.items.map(i => i.productId))];

  let totalMismatch = false;
  let recalcTotal   = 0;

  await runTransaction(db, async (txn) => {
    // ── 1. Fetch product + cost docs ──────────────────────────────────
    const productRefs = productIds.map(id => doc(db, 'products', id));
    const costRefs    = productIds.map(id => doc(db, 'productCosts', id));

    const productSnaps = await Promise.all(productRefs.map(r => txn.get(r)));
    const costSnaps    = await Promise.all(costRefs.map(r => txn.get(r)));

    const productMap = {};
    const costMap    = {};
    for (let i = 0; i < productIds.length; i++) {
      productMap[productIds[i]] = productSnaps[i].exists() ? productSnaps[i].data() : null;
      costMap[productIds[i]]    = costSnaps[i].exists() ? (costSnaps[i].data().costPrice ?? 0) : 0;
    }

    // ── 2. Check stock ────────────────────────────────────────────────
    for (const item of order.items) {
      const product      = productMap[item.productId];
      const currentStock = product?.stock?.[item.size] ?? 0;
      if (currentStock < item.qty) {
        throw new Error(
          `Insufficient stock: ${item.name} (${item.size}) — available: ${currentStock}, needed: ${item.qty}`
        );
      }
    }

    // ── 3. Deduct stock ───────────────────────────────────────────────
    for (const productId of productIds) {
      const product  = productMap[productId];
      if (!product) continue;
      const newStock = { ...product.stock };
      for (const item of order.items.filter(i => i.productId === productId)) {
        newStock[item.size] = (newStock[item.size] ?? 0) - item.qty;
      }
      txn.update(doc(db, 'products', productId), { stock: newStock, updatedAt: serverTimestamp() });
    }

    // ── 4. Snapshot unitCost into each item ───────────────────────────
    const itemsWithCost = order.items.map(item => ({
      ...item,
      unitCost: costMap[item.productId] ?? 0,
    }));

    // ── 5. Recalculate total and flag mismatch ────────────────────────
    const recalcSubtotal = order.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    recalcTotal   = recalcSubtotal + (order.shipping ?? 0);
    totalMismatch = Math.abs(recalcTotal - order.total) > 0.5;

    // ── 6. Update order doc ───────────────────────────────────────────
    txn.update(orderRef, {
      status:        'confirmed',
      items:         itemsWithCost,
      confirmedAt:   serverTimestamp(),
      updatedAt:     serverTimestamp(),
      totalMismatch: totalMismatch || null,
      recalcTotal:   totalMismatch ? recalcTotal : null,
    });

    // ── 7. Mirror ─────────────────────────────────────────────────────
    writeMirror(txn, order, 'confirmed');
  });

  return { totalMismatch, recalcTotal };
}

/**
 * confirmed|packed|shipped → cancelled
 * - Restore stock to each product doc
 * - Write orderTracking mirror
 */
export async function cancelConfirmedOrder(order, courierFields = {}) {
  const orderRef   = doc(db, 'orders', order.id);
  const productIds = [...new Set(order.items.map(i => i.productId))];

  await runTransaction(db, async (txn) => {
    const productRefs  = productIds.map(id => doc(db, 'products', id));
    const productSnaps = await Promise.all(productRefs.map(r => txn.get(r)));

    const productMap = {};
    for (let i = 0; i < productIds.length; i++) {
      productMap[productIds[i]] = productSnaps[i].exists() ? productSnaps[i].data() : null;
    }

    // Restore stock
    for (const productId of productIds) {
      const product = productMap[productId];
      if (!product) continue;
      const newStock = { ...product.stock };
      for (const item of order.items.filter(i => i.productId === productId)) {
        newStock[item.size] = (newStock[item.size] ?? 0) + item.qty;
      }
      txn.update(doc(db, 'products', productId), { stock: newStock, updatedAt: serverTimestamp() });
    }

    txn.update(orderRef, {
      status:    'cancelled',
      updatedAt: serverTimestamp(),
      ...courierFields,
    });

    writeMirror(txn, order, 'cancelled', courierFields);
  });
}

/**
 * General status update (no stock side-effects).
 * Also persists courierName, trackingNumber, trackingUrl.
 */
export async function updateOrderStatus(order, newStatus, courierFields = {}) {
  const orderRef = doc(db, 'orders', order.id);

  const update = {
    status:    newStatus,
    updatedAt: serverTimestamp(),
    ...courierFields,
  };

  // Use a transaction so we can write both docs atomically
  await runTransaction(db, async (txn) => {
    txn.update(orderRef, update);
    writeMirror(txn, order, newStatus, courierFields);
  });
}

/**
 * Dispatch to the correct action based on old → new status.
 * Returns metadata object (may include totalMismatch).
 */
export async function changeOrderStatus(order, newStatus, courierFields = {}) {
  const prev = order.status;

  if (newStatus === 'confirmed' && prev === 'pending') {
    return confirmOrder(order);
  }

  if (newStatus === 'cancelled' && ['confirmed', 'packed', 'shipped'].includes(prev)) {
    return cancelConfirmedOrder(order, courierFields);
  }

  // All other transitions (including pending → cancelled)
  return updateOrderStatus(order, newStatus, courierFields);
}
