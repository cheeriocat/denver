// src/components/StoreNav.jsx
// Simplified navigation bar used on non-home pages (checkout, account, etc.).

import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, ArrowLeft } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function StoreNav({ backLabel = 'Continue Shopping', backTo = '/' }) {
  const { cartCount, openCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="store-nav">
      <Link to="/" className="store-nav-logo">
        Denver
      </Link>

      <button
        className="store-nav-back"
        onClick={() => navigate(backTo)}
        aria-label={backLabel}
      >
        <ArrowLeft size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
        {backLabel}
      </button>

      <div className="store-nav-actions">
        <button
          className="navbar-icon-btn"
          onClick={openCart}
          aria-label="Open cart"
          style={{ position: 'relative' }}
        >
          <ShoppingBag size={18} />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
        <button
          className="navbar-icon-btn"
          onClick={() => navigate(currentUser ? '/account/orders' : '/login')}
          aria-label={currentUser ? 'My Orders' : 'Sign In'}
          title={currentUser ? 'My Orders' : 'Sign In'}
        >
          <User size={18} />
        </button>
      </div>
    </nav>
  );
}
