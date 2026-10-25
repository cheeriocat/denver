// src/pages/PrivacyPolicyPage.jsx
// Privacy policy page for Denver t-shirt store (Sri Lanka).

import { Link } from 'react-router-dom';
import StoreNav from '../components/StoreNav';
import { useSEO } from '../hooks/useSEO';
import { ShieldCheck, Lock, Eye, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  useSEO({
    title: 'Privacy Policy',
    description: 'Learn how Denver collects, uses, and protects your personal information when you order online.',
  });

  return (
    <>
      <StoreNav backLabel="Back to Shop" backTo="/" />

      <main className="info-page">
        <div className="container" style={{ maxWidth: '820px' }}>
          
          <div className="info-header">
            <div className="info-eyebrow">Legal & Data Protection</div>
            <h1 className="info-title">Privacy Policy</h1>
            <p className="info-subtitle">
              Last updated: October 2026. Your privacy and personal data protection are fundamental to how we operate at Denver.
            </p>
          </div>

          <div className="info-content-card">
            
            <section className="info-section">
              <div className="info-section-title">
                <Eye size={16} />
                1. Information We Collect
              </div>
              <p>
                When you browse our catalog, register an account, or place an order on Denver, we collect only the information necessary to fulfill your purchases and provide a seamless shopping experience:
              </p>
              <ul>
                <li><strong>Contact details:</strong> Full name, telephone/mobile number, and email address.</li>
                <li><strong>Delivery information:</strong> Shipping street address, city, and special courier delivery notes.</li>
                <li><strong>Account credentials:</strong> Your email and secure password (authenticated through Firebase Auth). We never have access to your plain-text password.</li>
                <li><strong>Order history:</strong> Items ordered, sizes, quantities, order reference numbers, and delivery status logs.</li>
              </ul>
            </section>

            <section className="info-section">
              <div className="info-section-title">
                <Lock size={16} />
                2. Payment Security
              </div>
              <p>
                Denver accepts <strong>Cash on Delivery (COD)</strong> and <strong>Direct Bank Transfer</strong> across Sri Lanka.
              </p>
              <ul>
                <li>We do not store credit card numbers, debit card details, or sensitive banking passwords on our servers.</li>
                <li>For bank transfers, payment verification is conducted manually against official bank reference numbers provided by you.</li>
              </ul>
            </section>

            <section className="info-section">
              <div className="info-section-title">
                <ShieldCheck size={16} />
                3. How We Use Your Information
              </div>
              <p>Your personal information is used strictly for:</p>
              <ul>
                <li>Processing and packaging your apparel orders.</li>
                <li>Coordinating islandwide dispatch with our licensed local courier partners.</li>
                <li>Sending order confirmation and shipment tracking updates via email or WhatsApp.</li>
                <li>Customer support inquiries regarding sizing, exchanges, and order status.</li>
              </ul>
              <p>
                We will never sell, rent, or trade your personal information to third parties for marketing purposes.
              </p>
            </section>

            <section className="info-section">
              <div className="info-section-title">
                <Mail size={16} />
                4. Courier Data Sharing
              </div>
              <p>
                To deliver your package, your recipient name, contact phone number, address, and city are shared solely with our assigned third-party courier service in Sri Lanka. Courier partners are bound to use your details only to complete the physical delivery of your package.
              </p>
            </section>

            <section className="info-section">
              <div className="info-section-title">
                5. Contact Us Regarding Your Data
              </div>
              <p>
                If you have questions about your personal data, or wish to update or delete your profile information, please contact our support team at <a href="mailto:hello@denverco.lk" className="info-link">hello@denverco.lk</a> or via our WhatsApp hotline.
              </p>
            </section>

          </div>

          <div className="info-footer-links">
            <Link to="/returns-exchange" className="info-footer-link">Returns & Exchange Policy</Link>
            <span className="info-sep">&middot;</span>
            <Link to="/delivery-info" className="info-footer-link">Delivery Information</Link>
            <span className="info-sep">&middot;</span>
            <Link to="/contact" className="info-footer-link">Contact Support</Link>
          </div>

        </div>
      </main>
    </>
  );
}
