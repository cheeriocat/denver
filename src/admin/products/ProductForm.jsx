// src/admin/products/ProductForm.jsx
// Modal form used for both Add and Edit product.
// Manages: name, description, fullDescription, price, originalPrice,
//          costPrice (saved to productCosts/{id}), badge, category,
//          colors (comma-separated hex), active flag,
//          sizes with individual stock values, Cloudinary images.

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import {
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ImageUploader from './ImageUploader';

const BADGE_OPTIONS = ['', 'New', 'Sale', 'Limited', 'Hot'];
const CATEGORY_OPTIONS = ['essentials', 'oversized', 'signature'];
const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const EMPTY_FORM = {
  name:            '',
  description:     '',
  fullDescription: '',
  price:           '',
  originalPrice:   '',
  costPrice:       '',
  badge:           '',
  category:        'essentials',
  colors:          '',
  active:          true,
  images:          [],
  sizes:           [{ size: 'M', stock: 20 }],
};

function buildStockMap(sizes) {
  return Object.fromEntries(
    sizes.filter(s => s.size.trim()).map(s => [s.size.trim(), Number(s.stock) || 0])
  );
}

export default function ProductForm({ product, onClose, onSaved }) {
  const isEdit = Boolean(product);

  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // Populate form when editing
  useEffect(() => {
    if (!product) { setForm(EMPTY_FORM); return; }

    const stockSizes = product.stock
      ? Object.entries(product.stock).map(([size, stock]) => ({ size, stock }))
      : [{ size: 'M', stock: 0 }];

    setForm({
      name:            product.name            || '',
      description:     product.description     || '',
      fullDescription: product.fullDescription || '',
      price:           product.price           != null ? String(product.price) : '',
      originalPrice:   product.originalPrice   != null ? String(product.originalPrice) : '',
      costPrice:       product.costPrice       != null ? String(product.costPrice) : '',
      badge:           product.badge           || '',
      category:        product.category        || 'essentials',
      colors:          (product.colors || []).join(', '),
      active:          product.active !== false,
      images:          product.images          || [],
      sizes:           stockSizes,
    });
  }, [product]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── Sizes management ──────────────────────────────────────────────────────
  const addSize = () => set('sizes', [...form.sizes, { size: '', stock: 0 }]);

  const addPresetSizes = () => {
    const existing = new Set(form.sizes.map(s => s.size));
    const newSizes = PRESET_SIZES.filter(s => !existing.has(s)).map(s => ({ size: s, stock: 20 }));
    set('sizes', [...form.sizes, ...newSizes]);
  };

  const updateSize = (idx, key, val) =>
    set('sizes', form.sizes.map((s, i) => i === idx ? { ...s, [key]: val } : s));

  const removeSize = (idx) =>
    set('sizes', form.sizes.filter((_, i) => i !== idx));

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.name.trim())       { setError('Product name is required.'); return; }
    if (!form.price || isNaN(Number(form.price))) { setError('Valid price is required.'); return; }
    if (form.sizes.length === 0) { setError('Add at least one size.'); return; }
    for (const s of form.sizes) {
      if (!s.size.trim()) { setError('All sizes must have a label.'); return; }
    }

    setSaving(true);
    try {
      const payload = {
        name:            form.name.trim(),
        description:     form.description.trim(),
        fullDescription: form.fullDescription.trim(),
        price:           Number(form.price),
        originalPrice:   form.originalPrice ? Number(form.originalPrice) : null,
        badge:           form.badge || null,
        category:        form.category,
        colors:          form.colors.split(',').map(c => c.trim()).filter(Boolean),
        active:          form.active,
        images:          form.images,
        stock:           buildStockMap(form.sizes),
        updatedAt:       serverTimestamp(),
      };

      let productId;

      if (isEdit) {
        // Update existing product
        const ref = doc(db, 'products', product.id);
        await setDoc(ref, payload, { merge: true });
        productId = product.id;
      } else {
        // Create new product
        payload.createdAt = serverTimestamp();
        const ref = await addDoc(collection(db, 'products'), payload);
        productId = ref.id;
      }

      // Save cost price to productCosts/{productId} (keeps financials separate)
      if (form.costPrice && !isNaN(Number(form.costPrice))) {
        await setDoc(
          doc(db, 'productCosts', productId),
          { costPrice: Number(form.costPrice), updatedAt: serverTimestamp() },
          { merge: true }
        );
      }

      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Save product error:', err);
      setError('Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="adm-modal-header">
          <h2 className="adm-modal-title">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
          <button className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form className="adm-modal-body" onSubmit={handleSave} noValidate>
          {error && <div className="admin-error-banner">{error}</div>}

          {/* ── Images ──────────────────────────────────────── */}
          <div className="adm-form-section">
            <div className="adm-form-section-title">Product Images</div>
            <ImageUploader images={form.images} onChange={urls => set('images', urls)} />
          </div>

          {/* ── Basic info ───────────────────────────────────── */}
          <div className="adm-form-section">
            <div className="adm-form-section-title">Basic Info</div>
            <div className="adm-form-grid">

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" htmlFor="pf-name">Product Name *</label>
                <input id="pf-name" className="form-input" value={form.name}
                  onChange={e => set('name', e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pf-desc">Short Description</label>
                <input id="pf-desc" className="form-input" value={form.description}
                  onChange={e => set('description', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pf-cat">Category</label>
                <select id="pf-cat" className="form-input adm-select" value={form.category}
                  onChange={e => set('category', e.target.value)}>
                  {CATEGORY_OPTIONS.map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" htmlFor="pf-full">Full Description</label>
                <textarea id="pf-full" className="form-input" rows={3} value={form.fullDescription}
                  onChange={e => set('fullDescription', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Pricing ──────────────────────────────────────── */}
          <div className="adm-form-section">
            <div className="adm-form-section-title">Pricing (Rs.)</div>
            <div className="adm-form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="pf-price">Selling Price *</label>
                <input id="pf-price" className="form-input" type="number" min="0" value={form.price}
                  onChange={e => set('price', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pf-orig">Original Price (for Sale badge)</label>
                <input id="pf-orig" className="form-input" type="number" min="0" value={form.originalPrice}
                  onChange={e => set('originalPrice', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pf-cost">
                  Cost Price <span style={{ color: 'var(--adm-muted)', fontWeight: 'normal' }}>(private)</span>
                </label>
                <input id="pf-cost" className="form-input" type="number" min="0" value={form.costPrice}
                  onChange={e => set('costPrice', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pf-badge">Badge</label>
                <select id="pf-badge" className="form-input adm-select" value={form.badge}
                  onChange={e => set('badge', e.target.value)}>
                  {BADGE_OPTIONS.map(b => <option key={b} value={b}>{b || '— None —'}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Sizes & Stock ────────────────────────────────── */}
          <div className="adm-form-section">
            <div className="adm-form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Sizes &amp; Stock</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="adm-btn-sm" onClick={addPresetSizes}>
                  + Standard Sizes
                </button>
                <button type="button" className="adm-btn-sm" onClick={addSize}>
                  <Plus size={12} /> Custom
                </button>
              </div>
            </div>

            <div className="adm-size-rows">
              {form.sizes.map((s, idx) => (
                <div key={idx} className="adm-size-row">
                  <input
                    className="form-input adm-size-label"
                    placeholder="Size"
                    value={s.size}
                    onChange={e => updateSize(idx, 'size', e.target.value)}
                  />
                  <input
                    className="form-input adm-size-stock"
                    type="number"
                    min="0"
                    placeholder="Stock"
                    value={s.stock}
                    onChange={e => updateSize(idx, 'stock', e.target.value)}
                  />
                  <button
                    type="button"
                    className="adm-icon-btn adm-icon-btn-danger"
                    onClick={() => removeSize(idx)}
                    aria-label="Remove size"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {form.sizes.length === 0 && (
                <p className="adm-empty-hint">No sizes yet — add standard or custom sizes above.</p>
              )}
            </div>
          </div>

          {/* ── Visual ───────────────────────────────────────── */}
          <div className="adm-form-section">
            <div className="adm-form-section-title">Visual</div>
            <div className="adm-form-grid">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" htmlFor="pf-colors">
                  Colors <span style={{ color: 'var(--adm-muted)' }}>(comma-separated hex, e.g. #000000, #ffffff)</span>
                </label>
                <input id="pf-colors" className="form-input" value={form.colors}
                  onChange={e => set('colors', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Visibility ───────────────────────────────────── */}
          <div className="adm-form-section">
            <label className="adm-toggle-row">
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => set('active', e.target.checked)}
                id="pf-active"
                style={{ accentColor: 'var(--adm-gold)' }}
              />
              <span className="form-label" style={{ margin: 0 }}>Visible on storefront</span>
            </label>
          </div>

          {/* ── Actions ──────────────────────────────────────── */}
          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button id="pf-save-btn" type="submit" className="adm-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
