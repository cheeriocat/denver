// src/pages/CheckoutPage.jsx
// Checkout form → Firestore order creation via transaction.
// Reads cart from CartContext, settings from Firestore, user profile from AuthContext.

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  runTransaction,
  doc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import StoreNav from '../components/StoreNav';

const SL_PHONE_RE = /^(\+94|0)[0-9]{9}$/;

function genRandChars(n = 4) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, cartSubtotal, clearCart } = useCart();
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const { settings, settingsLoading } = useSettings();
  const orderPlacedRef = useRef(false);

  // ── Form state ────────────────────────────────────────────────────────────
  const [name, setName]             = useState('');
  const [phone, setPhone]           = useState('');
  const [address, setAddress]       = useState('');
  const [city, setCity]             = useState('');
  const [notes, setNotes]           = useState('');
  const [paymentMethod, setPayment] = useState('cod');
  const [fieldErrors, setFieldErrs] = useState({});
  const [submitError, setSubmitErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Prefill from user profile
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setPhone(userProfile.phone || '');
      setAddress(userProfile.address || '');
      setCity(userProfile.city || '');
    }
  }, [userProfile]);

  // Redirect if cart is empty (skip if order was just placed)
  useEffect(() => {
    if (orderPlacedRef.current) return;
    if (!settingsLoading && cartItems.length === 0) navigate('/', { replace: true });
  }, [cartItems, settingsLoading, navigate]);

  // ── Shipping calculation ──────────────────────────────────────────────────
  const shipping = cartSubtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
  const total    = cartSubtotal + shipping;

  const fmtRs = (n) => `Rs. ${n.toLocaleString('en-LK')}`;

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!name.trim())    e.name    = 'Name is required.';
    if (!phone.trim())   e.phone   = 'Phone is required.';
    else if (!SL_PHONE_RE.test(phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid Sri Lankan number (e.g. 0771234567).';
    if (!address.trim()) e.address = 'Address is required.';
    if (!city.trim())    e.city    = 'City is required.';
    setFieldErrs(e);
    return Object.keys(e).length === 0;
  };

  // ── Place order ───────────────────────────────────────────────────────────
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitErr('');
    setSubmitting(true);

    try {
      const counterRef = doc(db, 'counters', 'orders');
      const orderRef   = doc(collection(db, 'orders'));
      let finalOrderNumber = '';

      await runTransaction(db, async (txn) => {
        const counterSnap = await txn.get(counterRef);
        const nextNum = (counterSnap.exists() ? counterSnap.data().count : 0) + 1;
        finalOrderNumber = `DNV-${nextNum}-${genRandChars(4)}`;

        txn.set(counterRef, { count: nextNum }, { merge: true });
        txn.set(orderRef, {
          orderNumber: finalOrderNumber,
          userId: currentUser.uid,
          customer: {
            name:    name.trim(),
            phone:   phone.replace(/\s/g, ''),
            email:   currentUser.email || '',
            address: address.trim(),
            city:    city.trim(),
            notes:   notes.trim(),
          },
          items: cartItems.map(item => ({
            productId: item.id,
            name:      item.name,
            size:      item.size,
            qty:       item.qty,
            unitPrice: item.price,
            image:     item.image || '',
          })),
          subtotal:      cartSubtotal,
          shipping,
          total,
          paymentMethod,
          paymentStatus: 'unpaid',
          status:        'pending',
          courierName:    '',
          trackingNumber: '',
          trackingUrl:    '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      // Save address to profile for next time (non-blocking)
      updateUserProfile({ name: name.trim(), phone: phone.trim(), address: address.trim(), city: city.trim() })
        .catch(console.warn);

      // Flag that order was placed so empty-cart effect doesn't redirect to home
      orderPlacedRef.current = true;

      // Navigate to success page first
      navigate(`/order-success/${finalOrderNumber}`, {
        replace: true,
        state: {
          orderNumber: finalOrderNumber,
          total,
          paymentMethod,
          settings,
        },
      });

      // Clear cart safely after navigating
      clearCart();
    } catch (err) {
      console.error('Order creation error:', err);
      setSubmitErr('Failed to place order. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (settingsLoading) {
    return (
      <>
        <StoreNav />
        <div className="page-loading">Loading…</div>
      </>
    );
  }

  return (
    <>
      <StoreNav backLabel="Continue Shopping" backTo="/" />

      <div className="checkout-page">
        <div className="checkout-grid">

          {/* ── LEFT: Form ─────────────────────────────────────────────── */}
          <div>
            <form onSubmit={handlePlaceOrder} noValidate>

              {/* Delivery details */}
              <div className="checkout-form-card" style={{ marginBottom: '20px' }}>
                <div className="checkout-section-title">Delivery Details</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="co-name">Full Name</label>
                    <input
                      id="co-name"
                      className={`form-input ${fieldErrors.name ? 'error' : ''}`}
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder=""
                    />
                    {fieldErrors.name && <span className="form-error">{fieldErrors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="co-phone">Phone Number</label>
                    <input
                      id="co-phone"
                      className={`form-input ${fieldErrors.phone ? 'error' : ''}`}
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder=""
                      type="tel"
                    />
                    {fieldErrors.phone && <span className="form-error">{fieldErrors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="co-city">City</label>
                    <input
                      id="co-city"
                      className={`form-input ${fieldErrors.city ? 'error' : ''}`}
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder=""
                    />
                    {fieldErrors.city && <span className="form-error">{fieldErrors.city}</span>}
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="co-address">Street Address</label>
                    <input
                      id="co-address"
                      className={`form-input ${fieldErrors.address ? 'error' : ''}`}
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder=""
                    />
                    {fieldErrors.address && <span className="form-error">{fieldErrors.address}</span>}
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="co-notes">
                      Order Notes <span style={{ color: 'var(--white-muted)' }}>(optional)</span>
                    </label>
                    <textarea
                      id="co-notes"
                      className="form-input"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="e.g. Call before delivery"
                      rows={3}
                      style={{ resize: 'vertical', fontFamily: 'var(--font-primary)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div className="checkout-form-card">
                <div className="checkout-section-title">Payment Method</div>
                <div className="payment-options">

                  {/* Cash on Delivery */}
                  <label
                    className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
                    htmlFor="pay-cod"
                  >
                    <input
                      id="pay-cod"
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPayment('cod')}
                    />
                    <div>
                      <div className="payment-option-label">💵 Cash on Delivery</div>
                      <div className="payment-option-desc">Pay when your order arrives.</div>
                    </div>
                  </label>

                  {/* Bank Transfer */}
                  <label
                    className={`payment-option ${paymentMethod === 'bank_transfer' ? 'selected' : ''}`}
                    htmlFor="pay-bank"
                  >
                    <input
                      id="pay-bank"
                      type="radio"
                      name="payment"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPayment('bank_transfer')}
                    />
                    <div>
                      <div className="payment-option-label">🏦 Bank Transfer</div>
                      <div className="payment-option-desc">Transfer before dispatch. Order confirmed after verification.</div>
                    </div>
                  </label>

                  {paymentMethod === 'bank_transfer' && (
                    <div className="bank-details-box">
                      <div style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>
                        Bank Details
                      </div>
                      <div>Bank: <strong>{settings.bankName}</strong></div>
                      <div>Account Name: <strong>{settings.bankAccountName}</strong></div>
                      <div>Account No: <strong>{settings.bankAccountNumber}</strong></div>
                      <div>Branch: <strong>{settings.bankBranch}</strong></div>
                      {settings.bankSwiftCode && <div>Swift Code: <strong>{settings.bankSwiftCode}</strong></div>}
                      <div style={{ marginTop: '12px', color: 'var(--white)', fontSize: '13px' }}>
                        Amount to Transfer: <strong style={{ color: 'var(--gold)' }}>{fmtRs(total)}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {submitError && (
                  <div className="auth-error-banner" style={{ marginTop: '16px' }}>{submitError}</div>
                )}

                <button
                  id="place-order-btn"
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '24px', fontSize: '12px', padding: '18px 20px' }}
                  disabled={submitting}
                >
                  {submitting ? 'Placing Order…' : `Place Order — ${fmtRs(total)}`}
                </button>
              </div>
            </form>
          </div>

          {/* ── RIGHT: Order Summary ────────────────────────────────────── */}
          <div>
            <div className="checkout-summary-card">
              <div className="checkout-section-title">Order Summary</div>

              <div className="summary-items">
                {cartItems.map(item => (
                  <div key={`${item.id}-${item.size}`} className="summary-item">
                    <img src={item.image} alt={item.name} className="summary-item-img" />
                    <div className="summary-item-info">
                      <div className="summary-item-name">{item.name}</div>
                      <div className="summary-item-meta">Size: {item.size} · Qty: {item.qty}</div>
                    </div>
                    <div className="summary-item-price">{fmtRs(item.price * item.qty)}</div>
                  </div>
                ))}
              </div>

              <hr className="summary-divider" />

              <div className="summary-row">
                <span>Subtotal</span>
                <span>{fmtRs(cartSubtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : fmtRs(shipping)}</span>
              </div>
              {shipping === 0 && (
                <div className="summary-shipping-note">
                  ✓ Free shipping applied
                </div>
              )}
              {shipping > 0 && (
                <div className="summary-shipping-note">
                  Add {fmtRs(settings.freeShippingThreshold - cartSubtotal)} more for free shipping
                </div>
              )}

              <div className="summary-row total" style={{ marginTop: '12px' }}>
                <span>Total</span>
                <span>{fmtRs(total)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
