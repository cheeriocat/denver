// src/admin/AdminSettingsPage.jsx
// Store settings manager: shipping fee, free shipping threshold,
// low-stock threshold, WhatsApp contact number, and bank transfer account details.
// Persists to Firestore doc settings/store.

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_SETTINGS } from '../hooks/useSettings';
import { Check, AlertCircle, Save, Settings, ShieldCheck, Truck, Building2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const [form, setForm]         = useState(DEFAULT_SETTINGS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  // ── Load existing settings on mount ────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    async function loadSettings() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'store'));
        if (mounted && snap.exists()) {
          setForm(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (err) {
        console.error('Failed to load store settings:', err);
        if (mounted) setError('Could not load current settings. Please refresh.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadSettings();
    return () => { mounted = false; };
  }, []);

  const handleChange = (field, val) => {
    setSuccess(false);
    setError('');
    setForm(prev => ({ ...prev, [field]: val }));
  };

  // ── Save settings ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const shippingFee = Number(form.shippingFee);
    const freeShippingThreshold = Number(form.freeShippingThreshold);
    const lowStockThreshold = Number(form.lowStockThreshold);

    if (isNaN(shippingFee) || shippingFee < 0) {
      setError('Please provide a valid shipping fee (0 or greater).');
      return;
    }
    if (isNaN(freeShippingThreshold) || freeShippingThreshold < 0) {
      setError('Please provide a valid free shipping threshold (0 or greater).');
      return;
    }
    if (isNaN(lowStockThreshold) || lowStockThreshold < 0) {
      setError('Please provide a valid low-stock threshold (0 or greater).');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        shippingFee,
        freeShippingThreshold,
        lowStockThreshold,
        whatsappNumber:   (form.whatsappNumber || '').trim(),
        storeContact:     (form.whatsappNumber || '').trim(), // keep backwards compatibility
        bankName:         (form.bankName || '').trim(),
        bankAccountName:  (form.bankAccountName || '').trim(),
        bankAccountNumber: (form.bankAccountNumber || '').trim(),
        bankBranch:       (form.bankBranch || '').trim(),
        bankSwiftCode:    (form.bankSwiftCode || '').trim(),
        updatedAt:        serverTimestamp(),
      };

      await setDoc(doc(db, 'settings', 'store'), payload, { merge: true });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err.message || 'Failed to update store settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <div className="adm-page-eyebrow">Configuration</div>
            <h1 className="adm-page-title">Store Settings</h1>
          </div>
        </div>
        <div style={{ color: 'var(--adm-muted)', fontSize: '13px', padding: '40px 0' }}>
          Loading settings from Firestore…
        </div>
      </div>
    );
  }

  return (
    <div className="adm-page">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="adm-page-header">
        <div>
          <div className="adm-page-eyebrow">Configuration</div>
          <h1 className="adm-page-title">Store Settings</h1>
        </div>
        <button
          type="button"
          className="adm-btn-primary"
          onClick={handleSubmit}
          disabled={saving}
        >
          <Save size={14} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* ── Banners ────────────────────────────────────────────── */}
      {error && (
        <div className="admin-error-banner" style={{ marginBottom: '20px' }}>
          <AlertCircle size={15} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
          {error}
        </div>
      )}

      {success && (
        <div className="adm-success-banner" style={{ marginBottom: '20px' }}>
          <Check size={16} />
          Store settings have been saved successfully and are now live.
        </div>
      )}

      {/* ── Settings Form ──────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="adm-settings-form">

        {/* Section 1: Shipping & Delivery */}
        <div className="adm-card-section">
          <div className="adm-card-section-header">
            <div className="adm-card-section-icon">
              <Truck size={16} />
            </div>
            <div>
              <h2 className="adm-card-section-title">Shipping & Delivery</h2>
              <p className="adm-card-section-desc">
                Configure standard flat shipping rate and automatic free shipping thresholds applied at checkout.
              </p>
            </div>
          </div>

          <div className="adm-form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="shippingFee">
                Flat Shipping Fee (Rs.)
              </label>
              <input
                id="shippingFee"
                type="number"
                min="0"
                step="50"
                className="form-input"
                value={form.shippingFee}
                onChange={e => handleChange('shippingFee', e.target.value)}
                required
              />
              <span className="adm-field-hint">Standard islandwide courier fee</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="freeShippingThreshold">
                Free Shipping Threshold (Rs.)
              </label>
              <input
                id="freeShippingThreshold"
                type="number"
                min="0"
                step="100"
                className="form-input"
                value={form.freeShippingThreshold}
                onChange={e => handleChange('freeShippingThreshold', e.target.value)}
                required
              />
              <span className="adm-field-hint">Orders at or above this subtotal qualify for free shipping</span>
            </div>
          </div>
        </div>

        {/* Section 2: Inventory & Notifications */}
        <div className="adm-card-section">
          <div className="adm-card-section-header">
            <div className="adm-card-section-icon">
              <Settings size={16} />
            </div>
            <div>
              <h2 className="adm-card-section-title">Inventory & Contact</h2>
              <p className="adm-card-section-desc">
                Dashboard stock alert levels and official customer contact WhatsApp line.
              </p>
            </div>
          </div>

          <div className="adm-form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="lowStockThreshold">
                Low Stock Threshold (Units)
              </label>
              <input
                id="lowStockThreshold"
                type="number"
                min="0"
                step="1"
                className="form-input"
                value={form.lowStockThreshold}
                onChange={e => handleChange('lowStockThreshold', e.target.value)}
                required
              />
              <span className="adm-field-hint">Products with size stock at or below this number appear in low-stock alerts</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="whatsappNumber">
                WhatsApp Hotline
              </label>
              <input
                id="whatsappNumber"
                type="text"
                className="form-input"
                value={form.whatsappNumber}
                onChange={e => handleChange('whatsappNumber', e.target.value)}
              />
              <span className="adm-field-hint">Used for order inquiries and customer support</span>
            </div>
          </div>
        </div>

        {/* Section 3: Bank Transfer Details */}
        <div className="adm-card-section">
          <div className="adm-card-section-header">
            <div className="adm-card-section-icon">
              <Building2 size={16} />
            </div>
            <div>
              <h2 className="adm-card-section-title">Bank Transfer Account Details</h2>
              <p className="adm-card-section-desc">
                These banking instructions are presented to customers on the Order Confirmation page when paying via Bank Transfer.
              </p>
            </div>
          </div>

          <div className="adm-form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="bankName">
                Bank Name
              </label>
              <input
                id="bankName"
                type="text"
                className="form-input"
                value={form.bankName}
                onChange={e => handleChange('bankName', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bankAccountName">
                Account Holder Name
              </label>
              <input
                id="bankAccountName"
                type="text"
                className="form-input"
                value={form.bankAccountName}
                onChange={e => handleChange('bankAccountName', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bankAccountNumber">
                Account Number
              </label>
              <input
                id="bankAccountNumber"
                type="text"
                className="form-input"
                value={form.bankAccountNumber}
                onChange={e => handleChange('bankAccountNumber', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bankBranch">
                Branch
              </label>
              <input
                id="bankBranch"
                type="text"
                className="form-input"
                value={form.bankBranch}
                onChange={e => handleChange('bankBranch', e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="bankSwiftCode">
                SWIFT / Routing Code (Optional)
              </label>
              <input
                id="bankSwiftCode"
                type="text"
                className="form-input"
                value={form.bankSwiftCode}
                onChange={e => handleChange('bankSwiftCode', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
          <button
            type="submit"
            className="adm-btn-primary"
            disabled={saving}
          >
            <Save size={14} />
            {saving ? 'Saving Changes…' : 'Save Changes'}
          </button>
        </div>

      </form>
    </div>
  );
}
