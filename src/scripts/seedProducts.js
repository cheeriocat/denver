// src/scripts/seedProducts.js
// Run this ONE TIME from the Admin panel to import the 6 mock products into
// Firestore. Each product doc gets `active: true` and a `createdAt` timestamp.
// A matching productCosts/{productId} doc is created with a placeholder costPrice
// (≈60% of selling price) that you can edit in the Admin products panel later.
//
// It is idempotent — skips if products already exist.

import {
  collection,
  addDoc,
  getDocs,
  query,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const MOCK_PRODUCTS = [
  {
    name: 'Denver Classic',
    description: 'Signature essential',
    fullDescription: 'Our flagship classic tee. Crafted from 100% premium Egyptian cotton with a weight of 240gsm. Ribbed crewneck collar. Double-stitched seams for unmatched durability. True to size.',
    price: 3490,
    originalPrice: null,
    badge: 'New',
    category: 'essentials',
    images: ['/tshirt_black.jpg'],
    colors: ['#000000', '#ffffff', '#555555'],
    stock: { XS: 20, S: 20, M: 20, L: 20, XL: 20, XXL: 20 },
    active: true,
  },
  {
    name: 'Denver White',
    description: 'Clean luxury',
    fullDescription: 'The white edition of our classic. Heavyweight 240gsm Egyptian cotton that stays crisp wash after wash. A staple piece redefined.',
    price: 3490,
    originalPrice: null,
    badge: 'New',
    category: 'essentials',
    images: ['/tshirt_white.jpg'],
    colors: ['#ffffff', '#000000'],
    stock: { XS: 20, S: 20, M: 20, L: 20, XL: 20, XXL: 20 },
    active: true,
  },
  {
    name: 'Denver Slate',
    description: 'Refined grey',
    fullDescription: 'Charcoal grey done right. The Denver Slate features a tight-weave 240gsm cotton blend with pre-washed texture. Understated perfection.',
    price: 3290,
    originalPrice: 3990,
    badge: 'Sale',
    category: 'essentials',
    images: ['/tshirt_grey.jpg'],
    colors: ['#555555', '#000000'],
    stock: { XS: 15, S: 15, M: 15, L: 15, XL: 15 },
    active: true,
  },
  {
    name: 'Denver Navy',
    description: 'Deep indigo',
    fullDescription: 'Deep navy blue with the same premium quality you expect from Denver. Garment-dyed for a rich, lived-in finish that only improves with time.',
    price: 3490,
    originalPrice: null,
    badge: null,
    category: 'essentials',
    images: ['/tshirt_navy.jpg'],
    colors: ['#1a2a4a', '#000000'],
    stock: { S: 20, M: 20, L: 20, XL: 20, XXL: 20 },
    active: true,
  },
  {
    name: 'Denver Oversize',
    description: 'Drop shoulder fit',
    fullDescription: 'For those who move beyond convention. The Denver Oversize features a dramatic drop shoulder and boxy silhouette cut from 280gsm heavyweight cotton.',
    price: 3990,
    originalPrice: null,
    badge: 'Limited',
    category: 'oversized',
    images: ['/tshirt_oversized.jpg'],
    colors: ['#000000'],
    stock: { 'S/M': 10, 'L/XL': 10, 'XL/XXL': 10 },
    active: true,
  },
  {
    name: 'Denver Signature',
    description: 'Logo edition',
    fullDescription: 'The Denver Signature carries our iconic wordmark, screen-printed with water-based inks for a premium, breathable finish. Built beyond ordinary.',
    price: 4290,
    originalPrice: null,
    badge: 'Limited',
    category: 'signature',
    images: ['/tshirt_black.jpg'],
    colors: ['#000000', '#ffffff'],
    stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10 },
    active: true,
  },
];

/**
 * Seeds the Firestore `products` collection with mock data and creates
 * a matching `productCosts/{productId}` doc with a placeholder cost price.
 * Returns { seeded: number, skipped: boolean } or throws on error.
 */
export async function seedProducts() {
  const colRef = collection(db, 'products');

  // Check if already seeded
  const existing = await getDocs(query(colRef));
  if (!existing.empty) {
    console.warn('seedProducts: products collection already has docs — skipping.');
    return { seeded: 0, skipped: true };
  }

  let seeded = 0;
  for (const product of MOCK_PRODUCTS) {
    // Write product doc (cost price is NOT stored here — kept separate)
    const ref = await addDoc(colRef, {
      ...product,
      createdAt: serverTimestamp(),
    });

    // Write placeholder cost price to productCosts/{productId}
    // Default: ~60% of selling price, rounded to nearest 10. Edit in Admin panel.
    const placeholderCost = Math.round(product.price * 0.6 / 10) * 10;
    await setDoc(doc(db, 'productCosts', ref.id), {
      costPrice: placeholderCost,
      updatedAt: serverTimestamp(),
    });

    seeded++;
  }

  console.log(`seedProducts: seeded ${seeded} products with productCosts docs.`);
  return { seeded, skipped: false };
}
