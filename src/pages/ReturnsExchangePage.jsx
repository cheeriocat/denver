// src/pages/ReturnsExchangePage.jsx
// Returns & Exchange policy page for Denver t-shirt store (Sri Lanka).

import { Link } from 'react-router-dom';
import StoreNav from '../components/StoreNav';
import { useSEO } from '../hooks/useSEO';
import { RefreshCw, CheckCircle2, AlertTriangle, Truck, HelpCircle } from 'lucide-react';

export default function ReturnsExchangePage() {
  useSEO({
    title: 'Returns & Exchange Policy',
    description: 'Learn about Denver exchange policy, eligibility guidelines, and how to request a garment size exchange in Sri Lanka.',
  });

  return (
    <>
      <StoreNav backLabel="Back to Shop" backTo="/" />

      <main className="info-page">
        <div className="container" style={{ maxWidth: '820px' }}>
          
          <div className="info-header">
            <div className="info-eyebrow">Customer Care</div>
            <h1 className="info-title">Returns & Exchange</h1>
            <p className="info-subtitle">
              We want you to feel confident in every Denver garment you wear. Here is our straightforward exchange and returns policy.
            </p>
          </div>

          <div className="info-content-card">
            
            {/* Section 1: Window */}
            <section className="info-section">
              <div className="info-section-title">
                <RefreshCw size={16} />
                1. Exchange Window
              </div>
              <p>
                We accept size and item exchanges within <strong>[7 / 14 days from delivery]</strong> (editable exchange window).
                Please notify our team as soon as possible after receiving your package so we can reserve your replacement size.
              </p>
            </section>

            {/* Section 2: Eligibility */}
            <section className="info-section">
              <div className="info-section-title">
                <CheckCircle2 size={16} />
                2. Eligibility Guidelines
              </div>
              <p>To qualify for an exchange, items must meet the following criteria:</p>
              <ul>
                <li>The garment must be unworn, unwashed, and in its original, brand-new condition.</li>
                <li>All original Denver tags and internal neck labels must remain attached.</li>
                <li>Original garment packaging must be returned intact.</li>
                <li>Items showing signs of perfume, stains, pet hair, or wear cannot be accepted for hygiene reasons.</li>
              </ul>
            </section>

            {/* Section 3: Courier Exchange Process */}
            <section className="info-section">
              <div className="info-section-title">
                <Truck size={16} />
                3. How the Exchange Process Works
              </div>
              <p>Exchanges are processed conveniently via local courier across Sri Lanka:</p>
              <ol className="info-numbered-list">
                <li>
                  <strong>Contact us on WhatsApp:</strong> Message our team with your order number (e.g. <code>DNV-XXXX-XXXX</code>) and the replacement size or color you require.
                </li>
                <li>
                  <strong>Stock reservation:</strong> We will verify warehouse inventory and reserve your desired replacement.
                </li>
                <li>
                  <strong>Two-way courier exchange:</strong> Our courier service will bring the fresh replacement garment to your doorstep and collect the original item at the same time.
                </li>
                <li>
                  <strong>Courier handling fee:</strong> Unless the exchange is due to a manufacturer defect or our packing error, standard courier return fees may apply for exchanges.
                </li>
              </ol>
            </section>

            {/* Section 4: Damaged or Incorrect Items */}
            <section className="info-section">
              <div className="info-section-title">
                <AlertTriangle size={16} />
                4. Damaged, Defective, or Incorrect Deliveries
              </div>
              <p>
                Every Denver t-shirt undergoes strict quality inspection before dispatch. In the rare event that you receive a defective garment or an incorrect size/item, please notify us within 48 hours of delivery.
              </p>
              <p>
                We will dispatch an immediate replacement at zero additional delivery cost to you.
              </p>
            </section>

            {/* Section 5: Refunds */}
            <section className="info-section">
              <div className="info-section-title">
                <HelpCircle size={16} />
                5. Refunds & Payment Methods
              </div>
              <p>
                As Denver accepts Cash on Delivery and Direct Bank Transfer, our primary resolution is replacement or size exchange. If a suitable replacement size is out of stock, we will issue a store credit voucher or arrange a direct bank transfer refund.
              </p>
            </section>

          </div>

          <div className="info-footer-links">
            <Link to="/delivery-info" className="info-footer-link">Delivery Information</Link>
            <span className="info-sep">&middot;</span>
            <Link to="/track" className="info-footer-link">Track Your Order</Link>
            <span className="info-sep">&middot;</span>
            <Link to="/contact" className="info-footer-link">Contact Support</Link>
          </div>

        </div>
      </main>
    </>
  );
}
