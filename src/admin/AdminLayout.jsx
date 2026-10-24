// src/admin/AdminLayout.jsx
// Persistent sidebar + top bar shell for every admin page.
// Uses an <Outlet /> for the active panel content.

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Package,
  ShoppingCart,
  BarChart2,
  Settings,
  LogOut,
  Layers,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin/products', icon: Package,      label: 'Products'  },
  { to: '/admin/orders',   icon: ShoppingCart, label: 'Orders'    },
  { to: '/admin/reports',  icon: BarChart2,    label: 'Reports'   },
  { to: '/admin/settings', icon: Settings,     label: 'Settings'  },
];

export default function AdminLayout() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <Layers size={18} className="admin-sidebar-logo-icon" />
          <span>Denver <em>Admin</em></span>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-email">{currentUser?.email}</div>
          <button className="admin-sidebar-logout" onClick={handleLogout}>
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main panel ───────────────────────────────────── */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
