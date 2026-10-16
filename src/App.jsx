import { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingBag, X, ChevronDown, Plus, Minus, User } from 'lucide-react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { useProducts } from './hooks/useProducts';
import { useCart } from './contexts/CartContext';
import { useAuth } from './contexts/AuthContext';
import { categories, testimonials } from './data';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import AccountOrdersPage from './pages/AccountOrdersPage';

// Inline social icons (lucide-react version doesn't include these)
const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
  </svg>
);
const TwitterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

/* ============================================================
   UTILITY: useIntersection observer for scroll animations
   ============================================================ */
function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ============================================================
   ANNOUNCEMENT BAR — fixed at very top
   ============================================================ */
function AnnouncementBar() {
  return (
    <div className="announcement-bar">
      Free Shipping on Orders Above Rs. 2,500 &nbsp;&middot;&nbsp; New Collection Now Live
    </div>
  );
}

/* ============================================================
   NAVBAR
   ============================================================ */
function Navbar({ cartCount, onCartOpen }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <a href="#home" className="navbar-logo" onClick={e => { e.preventDefault(); scrollTo('home'); }}>
          <div className="navbar-logo-text">
            <div className="navbar-logo-brand">Denver</div>
            <div className="navbar-logo-sub">Built Beyond Ordinary</div>
          </div>
        </a>

        <div className="navbar-menu">
          {[['home', 'Home'], ['shop', 'Shop'], ['about', 'About'], ['contact', 'Contact']].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="navbar-link"
              onClick={e => { e.preventDefault(); scrollTo(id); }}
            >
              {label}
            </a>
          ))}
        </div>

        <div className="navbar-actions">
          {/* Auth / account icon */}
          <button
            id="account-btn"
            className="navbar-icon-btn"
            onClick={() => navigate(currentUser ? '/account/orders' : '/login')}
            aria-label={currentUser ? 'My Orders' : 'Sign In'}
            title={currentUser ? 'My Orders' : 'Sign In'}
          >
            <User size={20} />
          </button>

          <button id="cart-btn" className="navbar-icon-btn" onClick={onCartOpen} aria-label="Open cart">
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          <button
            id="mobile-menu-btn"
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className={`mobile-nav ${menuOpen ? 'open' : ''}`}>
        {[['home', 'Home'], ['shop', 'Shop'], ['about', 'About'], ['contact', 'Contact']].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="mobile-nav-link"
            onClick={e => { e.preventDefault(); scrollTo(id); }}
          >
            {label}
          </a>
        ))}
        <a
          className="mobile-nav-link"
          style={{ cursor: 'pointer' }}
          onClick={() => { setMenuOpen(false); navigate(currentUser ? '/account/orders' : '/login'); }}
        >
          {currentUser ? 'My Orders' : 'Sign In'}
        </a>
      </div>
    </>
  );
}



/* ============================================================
   HERO
   ============================================================ */
function Hero() {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="hero" id="home">
      <div className="hero-bg">
        <img src="/hero_banner.jpg" alt="Denver — Built Beyond Ordinary" loading="eager" />
        <div className="hero-overlay" />
      </div>

      <div className="hero-content">
        <div className="hero-eyebrow">New Collection 2025</div>
        <h1 className="hero-title">
          Built<br />
          <em>Beyond</em><br />
          Ordinary
        </h1>
        <p className="hero-subtitle">
          Premium t-shirts crafted for those who refuse the average.
          Egyptian cotton. Uncompromising quality. Unapologetic design.
        </p>
        <div className="hero-actions">
          <button id="shop-now-btn" className="btn-primary" onClick={() => scrollTo('shop')}>
            Shop Now
          </button>
          <button className="btn-outline" onClick={() => scrollTo('about')}>
            Our Story
          </button>
        </div>
      </div>

      <div className="hero-scroll-hint">
        <ChevronDown size={18} />
        Scroll
      </div>
    </section>
  );
}

/* ============================================================
   MARQUEE
   ============================================================ */
function Marquee() {
  const items = [
    "Free Shipping Above Rs. 2,500",
    "100% Egyptian Cotton",
    "Premium Quality",
    "Built Beyond Ordinary",
    "Made For The Bold",
    "Delivered Islandwide",
  ];
  const doubled = [...items, ...items];
  return (
    <div className="marquee-strip">
      <div className="marquee-inner">
        {doubled.map((item, i) => (
          <div className="marquee-item" key={i}>
            {item}
            <span className="marquee-dot" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   PRODUCT CARD
   ============================================================ */
function ProductCard({ product, onAddToCart, onOpenModal, index }) {
  const [ref, visible] = useScrollReveal();

  const formatPrice = (p) => `Rs. ${p.toLocaleString('en-LK')}`;
  // Support both Firestore (images[]) and legacy (image) shape
  const imageSrc = (product.images && product.images.length > 0)
    ? product.images[0]
    : (product.image || '/tshirt_black.jpg');

  return (
    <div
      ref={ref}
      className={`product-card fade-up fade-up-delay-${(index % 3) + 1} ${visible ? 'visible' : ''}`}
      onClick={() => onOpenModal(product)}
    >
      <div className="product-card-image">
        <img src={imageSrc} alt={product.name} loading="lazy" />
        {product.badge && (
          <span className={`product-badge badge-${product.badge.toLowerCase()}`}>
            {product.badge}
          </span>
        )}
        <div className="product-card-overlay">
          <button
            id={`quick-add-${product.id}`}
            className="product-quick-add"
            onClick={e => { e.stopPropagation(); onAddToCart(product); }}
          >
            Quick Add
          </button>
        </div>
      </div>
      <div className="product-card-info">
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-desc">{product.description}</div>
        <div className="product-card-footer">
          <div>
            {product.originalPrice && (
              <span className="product-price-old">{formatPrice(product.originalPrice)}</span>
            )}
            <span className="product-price">{formatPrice(product.price)}</span>
          </div>
          <div className="product-colors">
            {(product.colors || []).map((c, i) => (
              <div key={i} className="color-dot" style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PRODUCT SKELETON CARD (loading placeholder)
   ============================================================ */
function ProductCardSkeleton({ index }) {
  return (
    <div className={`product-card product-card-skeleton fade-up fade-up-delay-${(index % 3) + 1} visible`}>
      <div className="skeleton-img" />
      <div className="product-card-info">
        <div className="skeleton-line" style={{ width: '60%', marginBottom: '8px' }} />
        <div className="skeleton-line" style={{ width: '40%', marginBottom: '12px' }} />
        <div className="skeleton-line" style={{ width: '30%' }} />
      </div>
    </div>
  );
}

/* ============================================================
   SHOP SECTION
   ============================================================ */
function ShopSection({ onAddToCart, onOpenModal, products, loading, error }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [ref, visible] = useScrollReveal();

  const filtered = activeFilter === 'all'
    ? products
    : products.filter(p => p.category === activeFilter);

  return (
    <section className="section" id="shop">
      <div className="container">
        <div ref={ref} className={`section-header fade-up ${visible ? 'visible' : ''}`}>
          <div className="section-eyebrow">The Collection</div>
          <h2 className="section-title">Shop Denver</h2>
          <p className="section-subtitle">
            Every piece engineered for the extraordinary.
            Premium Egyptian cotton. Exceptional craftsmanship.
          </p>
        </div>

        <div className="filter-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              id={`filter-${cat}`}
              className={`filter-tab ${activeFilter === cat ? 'active' : ''}`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="products-grid">
            {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} index={i} />)}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="shop-state-msg">
            <p style={{ color: 'var(--gold)' }}>Unable to load products. Please refresh.</p>
            <p style={{ color: 'var(--white-muted)', fontSize: '12px', marginTop: '8px' }}>{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filtered.length === 0 && (
          <div className="shop-state-msg">
            <p>No products in this category yet.</p>
          </div>
        )}

        {/* Products */}
        {!loading && !error && filtered.length > 0 && (
          <div className="products-grid">
            {filtered.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onOpenModal={onOpenModal}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   FEATURED BANNER
   ============================================================ */
function FeaturedBanner({ onScrollToShop }) {
  const [ref, visible] = useScrollReveal();

  return (
    <section className="section" style={{ padding: '0 0 100px' }}>
      <div className="container">
        <div ref={ref} className={`featured-banner fade-up ${visible ? 'visible' : ''}`}>
          <div className="featured-banner-img">
            <img src="/tshirt_oversized.jpg" alt="Denver Oversized Collection" loading="lazy" />
          </div>
          <div className="featured-banner-content">
            <div className="featured-banner-eyebrow">Exclusive Drop</div>
            <h2 className="featured-banner-title">
              The Oversized<br />
              Collection
            </h2>
            <p className="featured-banner-text">
              Drop shoulders. Boxy silhouette. 280gsm heavyweight cotton.
              The Denver Oversized series is a statement of controlled restraint —
              designed for those who command space without trying.
            </p>
            <button id="featured-shop-btn" className="btn-primary" onClick={onScrollToShop}>
              Explore Collection
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   STATS
   ============================================================ */
function Stats() {
  const [ref, visible] = useScrollReveal();
  const stats = [
    { number: "50K+", label: "Happy Customers" },
    { number: "240", label: "GSM Cotton" },
    { number: "100%", label: "Premium Quality" },
    { number: "48hr", label: "Fast Dispatch" },
  ];
  return (
    <div className="stats-section">
      <div className="container">
        <div ref={ref} className={`stats-grid fade-up ${visible ? 'visible' : ''}`}>
          {stats.map((s, i) => (
            <div key={i} className="stat-item">
              <div className="stat-number">{s.number}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   WHY DENVER (Features)
   ============================================================ */
const IconCotton = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8 2 5 5 5 9c0 2.5 1.2 4.7 3 6v5h8v-5c1.8-1.3 3-3.5 3-6 0-4-3-7-7-7z" />
    <path d="M9 15h6" /><path d="M10 18h4" />
  </svg>
);
const IconScissors = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);
const IconLeaf = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);
const IconBox = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

function WhyDenver() {
  const [ref, visible] = useScrollReveal();
  const features = [
    { icon: <IconCotton />, title: "Egyptian Cotton", text: "240gsm single-jersey weave for superior hand-feel and drape." },
    { icon: <IconScissors />, title: "Precision Cut", text: "Every seam placed with intention. Double-stitched for longevity." },
    { icon: <IconLeaf />, title: "Responsibly Made", text: "Ethical production. Low-waste processes. Built to last." },
    { icon: <IconBox />, title: "Premium Packaging", text: "Unboxing is part of the experience. Every order, beautifully packed." },
  ];
  return (
    <section className="section" id="about">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">Why Denver</div>
          <h2 className="section-title">Built Different</h2>
        </div>
        <div ref={ref} className={`features-grid fade-up ${visible ? 'visible' : ''}`}>
          {features.map((f, i) => (
            <div key={i} className="feature-item">
              <span className="feature-icon">{f.icon}</span>
              <div className="feature-title">{f.title}</div>
              <p className="feature-text">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   TESTIMONIALS
   ============================================================ */
function Testimonials() {
  const [ref, visible] = useScrollReveal();
  return (
    <section className="section testimonials">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">Reviews</div>
          <h2 className="section-title">Worn & Loved</h2>
        </div>
        <div ref={ref} className={`testimonials-slider fade-up ${visible ? 'visible' : ''}`}>
          {testimonials.map(t => (
            <div key={t.id} className="testimonial-card">
              <div className="testimonial-stars">
                {Array(t.stars).fill(0).map((_, i) => (
                  <span key={i} className="star">★</span>
                ))}
              </div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t.initial}</div>
                <div className="author-info">
                  <div className="author-name">{t.author}</div>
                  <div className="author-location">{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   NEWSLETTER
   ============================================================ */
function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [ref, visible] = useScrollReveal();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) { setSubmitted(true); setEmail(''); }
  };

  return (
    <div className="newsletter" id="contact">
      <div className="container">
        <div ref={ref} className={`fade-up ${visible ? 'visible' : ''}`}>
          <div className="section-eyebrow">Stay Connected</div>
          <h2 className="section-title">Join The Denver Circle</h2>
          <p className="section-subtitle">
            Early access to new drops, exclusive offers, and behind-the-scenes stories
            — straight to your inbox.
          </p>
          {submitted ? (
            <p style={{ fontFamily: 'Times New Roman', color: 'var(--gold)', letterSpacing: '0.3em', marginTop: '36px', fontSize: '14px' }}>
              THANK YOU — YOU'RE IN THE CIRCLE
            </p>
          ) : (
            <form className="newsletter-form" onSubmit={handleSubmit}>
              <input
                id="newsletter-email"
                className="newsletter-input"
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button id="newsletter-submit" type="submit" className="newsletter-btn">
                Subscribe
              </button>
            </form>
          )}
          <p className="newsletter-note">No spam. Unsubscribe anytime.</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */
function Footer() {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo-brand">Denver</div>
            <div className="footer-logo-sub">Built Beyond Ordinary</div>
            <p className="footer-brand-text">
              Premium t-shirts for those who demand more. Crafted with Egyptian cotton,
              built with purpose, worn by the extraordinary.
            </p>
            <div className="footer-social">
              <a href="#" className="footer-social-link" id="footer-instagram" aria-label="Instagram"><InstagramIcon /></a>
              <a href="#" className="footer-social-link" id="footer-twitter" aria-label="Twitter"><TwitterIcon /></a>
              <a href="#" className="footer-social-link" id="footer-facebook" aria-label="Facebook"><FacebookIcon /></a>
            </div>

          </div>

          <div>
            <div className="footer-col-title">Shop</div>
            <div className="footer-links">
              {['New Arrivals', 'Essentials', 'Oversized', 'Signature', 'Sale'].map(link => (
                <span key={link} className="footer-link" onClick={() => scrollTo('shop')}>{link}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="footer-col-title">Help</div>
            <div className="footer-links">
              {['Size Guide', 'Shipping & Returns', 'FAQ', 'Track Order', 'Contact Us'].map(link => (
                <span key={link} className="footer-link">{link}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="footer-col-title">Contact</div>
            <div className="footer-links">
              <span className="footer-link">hello@denverco.lk</span>
              <span className="footer-link">+94 77 123 4567</span>
              <span className="footer-link" style={{ marginTop: '8px', lineHeight: '1.6' }}>
                Mon–Sat<br />9am – 6pm (IST)
              </span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-copy">
            © 2026 Denver. All rights reserved.
          </span>
          <div className="footer-legal">
            <span className="footer-legal-link">Privacy Policy</span>
            <span className="footer-legal-link">Terms of Service</span>
            <span className="footer-legal-link">Refund Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   CART SIDEBAR — reads from CartContext, no props needed
   ============================================================ */
function CartSidebar() {
  const { cartItems, cartOpen, closeCart, updateQty, removeItem, cartSubtotal } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <>
      <div className={`cart-overlay ${cartOpen ? 'open' : ''}`} onClick={closeCart} />
      <div className={`cart-sidebar ${cartOpen ? 'open' : ''}`} role="dialog" aria-label="Shopping cart">
        <div className="cart-header">
          <span className="cart-title">Your Cart ({cartItems.length})</span>
          <button id="cart-close-btn" className="cart-close" onClick={closeCart} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <span className="cart-empty-icon">🛍</span>
              <p className="cart-empty-text">Your cart is empty</p>
              <button className="btn-primary" style={{ marginTop: '8px', fontSize: '10px', padding: '14px 28px' }} onClick={closeCart}>
                Start Shopping
              </button>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={`${item.id}-${item.size}`} className="cart-item">
                <img className="cart-item-img" src={item.image} alt={item.name} />
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-meta">Size: {item.size}</div>
                  <div className="cart-item-qty">
                    <button className="qty-btn" onClick={() => updateQty(item, -1)}>
                      <Minus size={12} />
                    </button>
                    <span className="qty-num">{item.qty}</span>
                    <button className="qty-btn" onClick={() => updateQty(item, 1)}>
                      <Plus size={12} />
                    </button>
                    <button
                      style={{ marginLeft: 'auto', background: 'transparent', color: 'var(--white-muted)', cursor: 'pointer', border: 'none', transition: 'color 0.3s' }}
                      onClick={() => removeItem(item)}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--white)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--white-muted)'}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="cart-item-price">Rs. {(item.price * item.qty).toLocaleString('en-LK')}</div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-subtotal">
              <span className="cart-subtotal-label">Subtotal</span>
              <span className="cart-subtotal-amount">Rs. {cartSubtotal.toLocaleString('en-LK')}</span>
            </div>
            <button id="checkout-btn" className="cart-checkout-btn" onClick={handleCheckout}>
              Proceed to Checkout
            </button>
            <button className="cart-continue" onClick={closeCart}>
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ============================================================
   PRODUCT MODAL
   ============================================================ */
function ProductModal({ product, isOpen, onClose, onAddToCart }) {
  const [selectedSize, setSelectedSize] = useState('M');

  // Derive size list from Firestore `stock` object OR legacy `sizes` array
  const sizeList = product
    ? (product.stock ? Object.keys(product.stock) : (product.sizes || []))
    : [];

  // Image: support Firestore `images[]` or legacy `image`
  const imageSrc = product
    ? ((product.images && product.images.length > 0) ? product.images[0] : (product.image || '/tshirt_black.jpg'))
    : '/tshirt_black.jpg';

  useEffect(() => {
    if (product) setSelectedSize(sizeList[1] || sizeList[0] || 'M');
  }, [product]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!product) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="product-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-img">
          <img src={imageSrc} alt={product.name} />
        </div>
        <div className="modal-content">
          <button id="modal-close-btn" className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
          <div className="modal-eyebrow">Denver Collection</div>
          <h2 className="modal-title">{product.name}</h2>
          <div className="modal-price">Rs. {product.price.toLocaleString('en-LK')}</div>
          <p className="modal-desc">{product.fullDescription || product.fullDesc}</p>

          <div className="modal-label">Select Size</div>
          <div className="modal-sizes">
            {sizeList.map(size => {
              const stockQty = product.stock ? (product.stock[size] ?? 0) : 99;
              return (
                <button
                  key={size}
                  id={`size-${size}`}
                  className={`size-btn ${selectedSize === size ? 'selected' : ''} ${stockQty === 0 ? 'out-of-stock' : ''}`}
                  onClick={() => stockQty > 0 && setSelectedSize(size)}
                  title={stockQty === 0 ? 'Out of stock' : undefined}
                >
                  {size}
                </button>
              );
            })}
          </div>

          <button
            id="modal-add-to-cart-btn"
            className="modal-add-btn"
            onClick={() => { onAddToCart(product, selectedSize); onClose(); }}
          >
            Add to Cart — Rs. {product.price.toLocaleString('en-LK')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TOAST
   ============================================================ */
function Toast({ message, show }) {
  return (
    <div className={`toast ${show ? 'show' : ''}`} role="alert">
      {message}
    </div>
  );
}

/* ============================================================
   PROTECTED ROUTE — redirects unauthenticated users to /login
   ============================================================ */
function ProtectedRoute({ children }) {
  const { currentUser, authLoading } = useAuth();
  const location = useLocation();
  if (authLoading) return <div className="page-loading">Loading…</div>;
  if (!currentUser)
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  return children;
}

/* ============================================================
   GLOBAL TOAST — reads from CartContext (shown on all pages)
   ============================================================ */
function GlobalToast() {
  const { toast } = useCart();
  return <Toast message={toast.message} show={toast.show} />;
}

/* ============================================================
   HOME PAGE — all existing sections, uses CartContext
   ============================================================ */
function HomePage() {
  const { addToCart, cartCount, openCart } = useCart();
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const [modalProduct, setModalProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = useCallback((product) => {
    setModalProduct(product);
    setModalOpen(true);
  }, []);

  return (
    <>
      <header className="site-header">
        <AnnouncementBar />
        <Navbar cartCount={cartCount} onCartOpen={openCart} />
      </header>
      <main>
        <Hero />
        <Marquee />
        <ShopSection
          onAddToCart={addToCart}
          onOpenModal={openModal}
          products={products}
          loading={productsLoading}
          error={productsError}
        />
        <FeaturedBanner onScrollToShop={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })} />
        <Stats />
        <WhyDenver />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
      <ProductModal
        product={modalProduct}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddToCart={addToCart}
      />
    </>
  );
}

/* ============================================================
   APP — React Router root
   CartSidebar and GlobalToast live here so they're available
   on every route (cart accessible from checkout, orders, etc.)
   ============================================================ */
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/checkout"
          element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>}
        />
        <Route path="/order-success/:orderNumber" element={<OrderSuccessPage />} />
        <Route
          path="/account/orders"
          element={<ProtectedRoute><AccountOrdersPage /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Available on every route */}
      <CartSidebar />
      <GlobalToast />
    </>
  );
}
