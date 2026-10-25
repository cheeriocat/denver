// src/pages/DeliveryInfoPage.jsx
// Delivery and shipping information for Denver t-shirt store (Sri Lanka).

import { Link } from 'react-router-dom';
import StoreNav from '../components/StoreNav';
import { useSettings } from '../hooks/useSettings';
import { useSEO } from '../hooks/useSEO';
import { Truck, Clock, ShieldCheck, MapPin, CreditCard } from 'lucide-react';

export default function DeliveryInfoPage() {
  const { settings } = useSettings();

  useSEO({
    title: 'Delivery & Shipping Information',
    description: 'Learn about Denver islandwide courier delivery options, shipping fees, free shipping thresholds, and estimated timelines in Sri Lanka.',
  });

  const shippingFee = settings.shippingFee ?? 350;
  const freeShippingThreshold = settings.freeShippingThreshold ?? 2500;

  return (
    <>
      <StoreNav backLabel="Back to Shop" backTo="/" />

      <main className="info-page">
        <div className="container" style={{ maxWidth: '820px' }}>
          
          <div className="info-header">
            <div className="info-eyebrow">Islandwide Shipping</div>
            <h1 className="info-title">Delivery Information</h1>
            <p className="info-subtitle">
              Fast, reliable doorstep delivery throughout Sri Lanka. Every order is inspected, packed, and tracked.
            </p>
          </div>

          <div className="info-content-card">
            
            {/* Rates & Thresholds */}
            <section className="info-section">
              <div className="info-section-title">
                <Truck size={16} />
                1. Shipping Rates & Free Delivery
              </div>
              <p>
                We offer competitive flat-rate delivery across all 25 districts of Sri Lanka:
              </p>
              <div className="info-highlight-box">
                <div className="info-highlight-item">
                  <div className="info-highlight-label">Standard Shipping Fee</div>
                  <div className="info-highlight-val">Rs. {shippingFee.toLocaleString('en-LK')}</div>
                  <div className="info-highlight-sub">Flat rate applied islandwide</div>
                </div>
                <div className="info-highlight-item">
                  <div className="info-highlight-label">Free Shipping On Orders Above</div>
                  <div className="info-highlight-val">Rs. {freeShippingThreshold.toLocaleString('en-LK')}</div>
                  <div className="info-highlight-sub">Automatically calculated at checkout</div>
                </div>
              </div>
            </section>

            {/* Delivery Timelines */}
            <section className="info-section">
              <div className="info-section-title">
                <Clock size={16} />
                2. Estimated Delivery Timelines
              </div>
              <p>
                All orders are dispatched from our central fulfillment center in Colombo:
              </p>
              <ul>
                <li><strong>Colombo & Greater Western Province:</strong> 1 to 2 business days.</li>
                <li><strong>Major Regional Cities (Kandy, Galle, Kurunegala, Matara):</strong> 2 to 3 business days.</li>
                <li><strong>Outstation & Remote Areas:</strong> 3 to 4 business days.</li>
              </ul>
              <p style={{ fontSize: '12px', color: 'var(--white-muted)', marginTop: '8px' }}>
                * Deliveries are carried out Monday through Saturday. Orders placed on Sundays or public holidays are processed the next business day.
              </p>
            </section>

            {/* Payment Methods */}
            <section className="info-section">
              <div className="info-section-title">
                <CreditCard size={16} />
                3. Accepted Payment Methods
              </div>
              <p>We provide two convenient payment options upon checkout:</p>
              <ul>
                <li>
                  <strong>Cash on Delivery (COD):</strong> Pay cash directly to the courier agent when your package arrives at your doorstep. Please have exact cash ready if possible.
                </li>
                <li>
                  <strong>Direct Bank Transfer:</strong> Transfer directly to our company bank account (Bank of Ceylon / Commercial Bank). Your order will be dispatched once our finance team verifies the transfer reference.
                </li>
              </ul>
            </section>

            {/* Packaging & Courier Service */}
            <section className="info-section">
              <div className="info-section-title">
                <ShieldCheck size={16} />
                4. Courier Partners & Packaging
              </div>
              <p>
                We partner with reputable Sri Lankan domestic courier services (including PromptX, Koombiyo, Domex, and Fardar) to ensure your garments reach you in pristine condition.
              </p>
              <p>
                Every Denver t-shirt is sealed in dust-resistant, weatherproof packaging to protect the premium Egyptian cotton during transit.
              </p>
            </section>

            {/* Real-time tracking */}
            <section className="info-section">
              <div className="info-section-title">
                <MapPin size={16} />
                5. Tracking Your Delivery
              </div>
              <p>
                Once your order is confirmed and dispatched, you will receive a unique order number (e.g. <code>DNV-XXXX-XXXX</code>). You can check its live fulfillment and courier waybill status anytime using our{' '}
                <Link to="/track" className="info-link">Public Order Tracking page</Link>.
              </p>
            </section>

          </div>

          <div className="info-footer-links">
            <Link to="/track" className="info-footer-link">Track Your Order</Link>
            <span className="info-sep">&middot;</span>
            <Link to="/returns-exchange" className="info-footer-link">Returns & Exchange</Link>
            <span className="info-sep">&middot;</span>
            <Link to="/privacy-policy" className="info-footer-link">Privacy Policy</Link>
          </div>

        </div>
      </main>
    </>
  );
}
