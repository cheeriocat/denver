// src/admin/AdminLoginPage.jsx
// Dedicated admin sign-in page at /admin/login.
// After sign-in, the AdminProtectedRoute checks admins/{uid};
// non-admins are redirected back here with an error message.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLoginPage() {
  const { signIn } = useAuth();
  const navigate   = useNavigate();

  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Enter email and password.'); return; }
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      // AdminProtectedRoute will verify admins/{uid} and redirect if not admin
      navigate('/admin/products', { replace: true });
    } catch (err) {
      const code = err.code || '';
      if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
        setError('Invalid email or password.');
      else if (code.includes('too-many-requests'))
        setError('Too many attempts. Please try again later.');
      else
        setError('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <div className="admin-login-brand">Denver</div>
          <div className="admin-login-sub">Admin Panel</div>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="admin-error-banner">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="adm-email">Email</label>
            <input
              id="adm-email"
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="adm-password">Password</label>
            <input
              id="adm-password"
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPass(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            id="adm-login-btn"
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Signing In…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
