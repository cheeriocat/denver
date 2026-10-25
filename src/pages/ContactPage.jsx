// src/pages/ContactPage.jsx
// Contact page with dynamic WhatsApp link read from settings/store.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import StoreNav from '../components/StoreNav';
import { useSettings } from '../hooks/useSettings';
import { useSEO } from '../hooks/useSEO';
import { Phone, Mail, Clock, MapPin, MessageSquare, ExternalLink, Send } from 'lucide-react';

export default function ContactPage() {
  const { settings } = useSettings();
  const [formSent, setFormSent] = useState(false);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [msg, setMsg]           = useState('');

  useSEO({
    title: 'Contact Us',
    description: 'Get in touch with Denver customer support via WhatsApp or email for inquiries, order support, and islandwide delivery assistance.',
  });

  // Read WhatsApp from settings/store with fallback placeholder
  const rawNumber = settings.whatsappNumber || '+94770000000';
  const cleanDigits = rawNumber.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanDigits || '94770000000'}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && email && msg) {
      setFormSent(true);
      setName('');
      setEmail('');
      setMsg('');
    }
  };

  return (
    <>
      <StoreNav backLabel="Back to Shop" backTo="/" />

      <main className="info-page">
        <div className="container" style={{ maxWidth: '820px' }}>
          
          <div className="info-header">
            <div className="info-eyebrow">Customer Support</div>
            <h1 className="info-title">Contact Denver</h1>
            <p className="info-subtitle">
              Have questions regarding garment sizing, delivery timelines, or order tracking?
              Our Colombo team is here to assist you.
            </p>
          </div>

          {/* Contact Methods Cards */}
          <div className="contact-cards-grid">
            
            {/* WhatsApp */}
            <div className="contact-card highlight">
              <div className="contact-card-icon wa">
                <MessageSquare size={22} />
              </div>
              <div className="contact-card-title">WhatsApp Hotline</div>
              <p className="contact-card-desc">
                For fastest replies on sizing, delivery confirmations, and exchanges.
              </p>
              <div className="contact-card-val">{rawNumber}</div>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-track"
                style={{ marginTop: '14px', width: '100%', justifyContent: 'center' }}
              >
                Chat on WhatsApp
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Email */}
            <div className="contact-card">
              <div className="contact-card-icon">
                <Mail size={22} />
              </div>
              <div className="contact-card-title">Email Inquiries</div>
              <p className="contact-card-desc">
                For wholesale, corporate orders, and formal support queries.
              </p>
              <div className="contact-card-val">hello@denverco.lk</div>
              <a
                href="mailto:hello@denverco.lk"
                className="btn-outline"
                style={{ marginTop: '14px', width: '100%', textAlign: 'center', display: 'inline-block', fontSize: '10px', padding: '12px 0' }}
              >
                Send Email
              </a>
            </div>

          </div>

          <div className="info-content-card" style={{ marginTop: '32px' }}>
            
            {/* Operating Hours & Dispatch Center */}
            <div className="info-grid-2">
              <section className="info-section">
                <div className="info-section-title">
                  <Clock size={16} />
                  Operating Hours
                </div>
                <p>
                  <strong>Monday - Saturday:</strong> 9:00 AM - 6:00 PM (IST)<br />
                  <strong>Sunday & Poya Days:</strong> Closed (Messages answered next business day)
                </p>
              </section>

              <section className="info-section">
                <div className="info-section-title">
                  <MapPin size={16} />
                  Fulfillment & Dispatch
                </div>
                <p>
                  Denver Fulfillment Hub<br />
                  Colombo 03, Sri Lanka<br />
                  <em>(Online store with islandwide doorstep delivery)</em>
                </p>
              </section>
            </div>

            {/* Quick Message Form */}
            <section className="info-section" style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
              <div className="info-section-title">
                Send Us a Quick Message
              </div>

              {formSent ? (
                <div className="track-alert track-alert-warning" style={{ marginTop: '16px' }}>
                  Thank you for reaching out! We have received your message and will respond shortly.
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="contact-name">Your Name</label>
                      <input
                        id="contact-name"
                        type="text"
                        className="form-input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="contact-email">Email Address</label>
                      <input
                        id="contact-email"
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-msg">Message</label>
                    <textarea
                      id="contact-msg"
                      className="form-input"
                      rows="4"
                      value={msg}
                      onChange={e => setMsg(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ alignSelf: 'flex-start', padding: '12px 32px', fontSize: '11px', marginTop: '6px' }}
                  >
                    Send Message
                  </button>
                </form>
              )}
            </section>

          </div>

          <div className="info-footer-links">
            <Link to="/track" className="info-footer-link">Track Your Order</Link>
            <span className="info-sep">&middot;</span>
            <Link to="/delivery-info" className="info-footer-link">Delivery Info</Link>
            <span className="info-sep">&middot;</span>
            <Link to="/returns-exchange" className="info-footer-link">Returns & Exchange</Link>
          </div>

        </div>
      </main>
    </>
  );
}
