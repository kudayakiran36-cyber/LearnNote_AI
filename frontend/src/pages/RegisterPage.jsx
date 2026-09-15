import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import { BookOpen, UserPlus, Info } from 'lucide-react';

export default function RegisterPage({ onNavigateLogin }) {
  const { register, error } = useAuth();
  const [uniqueId, setUniqueId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uniqueId.trim() || !email.trim() || !password) {
      setLocalError('All fields are required.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setLocalError(null);
    try {
      await register(uniqueId.trim(), email.trim(), password);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '3rem auto', padding: '0 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div 
          className="brand-icon" 
          style={{ width: '48px', height: '48px', margin: '0 auto 1rem auto', borderRadius: 'var(--radius-lg)' }}
        >
          <BookOpen size={24} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Create Your Account
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
          Start building structured AI knowledge notes and personalized quizzes
        </p>
      </div>

      {/* Explicit MVP Notice as required by Section 5 */}
      <Alert type="info">
        <div style={{ fontSize: '0.85rem' }}>
          <strong>Notice:</strong> Email verification is currently unavailable in this MVP release. 
          Please ensure your email address is entered correctly. Account recovery is manual and support-based.
        </div>
      </Alert>

      {(localError || error) && (
        <Alert type="danger" message={localError || error} />
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Unique User ID</label>
            <input
              type="text"
              className="form-input"
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value)}
              placeholder="e.g. dev_jordan"
              disabled={submitting}
              required
            />
            <div className="form-hint">Used for identification and login (min 3 characters).</div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              disabled={submitting}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={submitting}
          >
            {submitting ? 'Creating Account...' : 'Register Account'}
            {!submitting && <UserPlus size={16} />}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <button
            onClick={onNavigateLogin}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--primary)', 
              fontWeight: 600, 
              cursor: 'pointer',
              padding: 0 
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
