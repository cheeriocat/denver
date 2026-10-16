// src/pages/SignupPage.jsx
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SL_PHONE_RE = /^(\+94|0)[0-9]{9}$/;

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [errors, setErrors]       = useState({});
  const [globalErr, setGlobalErr] = useState('');
  const [loading, setLoading]     = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim())  e.name  = 'Full name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    if (phone.trim() && !SL_PHONE_RE.test(phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid Sri Lankan number (e.g. 0771234567).';
    if (password.length < 6)    e.password = 'Password must be at least 6 characters.';
    if (password !== confirm)   e.confirm  = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setGlobalErr('');
    setLoading(true);
    try {
      await signUp(email, password, name.trim(), phone.trim());
      navigate(redirect, { replace: true });
    } catch (err) {
      if (err.code === 'auth/email-already-in-use')
        setGlobalErr('This email is already registered. Please sign in.');
      else
        setGlobalErr('Account creation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGlobalErr('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate(redirect, { replace: true });
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') setGlobalErr('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <div className="auth-logo-brand">Denver</div>
        <div className="auth-logo-sub">Built Beyond Ordinary</div>
      </div>

      <div className="auth-card" style={{ maxWidth: '460px' }}>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join the Denver circle</p>

        <button className="btn-google" onClick={handleGoogle} disabled={loading} type="button">
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">or</span>
          <div className="auth-divider-line" />
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {globalErr && <div className="auth-error-banner">{globalErr}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">Full Name</label>
            <input
              id="signup-name"
              className={`form-input ${errors.name ? 'error' : ''}`}
              type="text"
              placeholder=""
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email Address</label>
            <input
              id="signup-email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-phone">
              Phone <span style={{ color: 'var(--white-muted)', fontWeight: 'normal' }}>(optional)</span>
            </label>
            <input
              id="signup-phone"
              className={`form-input ${errors.phone ? 'error' : ''}`}
              type="tel"
              placeholder=""
              value={phone}
              onChange={e => setPhone(e.target.value)}
              autoComplete="tel"
            />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm">Confirm Password</label>
            <input
              id="signup-confirm"
              className={`form-input ${errors.confirm ? 'error' : ''}`}
              type="password"
              placeholder="Repeat password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
            {errors.confirm && <span className="form-error">{errors.confirm}</span>}
          </div>

          <button
            id="signup-submit-btn"
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '4px' }}
            disabled={loading}
          >
            {loading ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-link-row" style={{ marginTop: '20px' }}>
          Already have an account?{' '}
          <Link
            to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="auth-link"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
