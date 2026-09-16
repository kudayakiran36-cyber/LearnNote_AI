import React, { useState } from 'react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import Alert from '../components/Alert';
import { BookOpen, Key, ArrowRight, UserCheck } from 'lucide-react';

export default function LoginPage({ onNavigateRegister }) {
  const { login, demoLogin, error } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setLocalError('Please enter both your User ID / Email and password.');
      return;
    }
    setSubmitting(true);
    setLocalError(null);
    try {
      await login(identifier, password);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoClick = async (key) => {
    setSubmitting(true);
    setLocalError(null);
    try {
      await demoLogin(key);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto', padding: '0 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div 
          className="brand-icon" 
          style={{ width: '48px', height: '48px', margin: '0 auto 1rem auto', borderRadius: 'var(--radius-lg)' }}
        >
          <BookOpen size={24} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Welcome to LearnNote AI
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
          Your personal AI-powered learning and quizzing workspace
        </p>
      </div>

      {(localError || error) && (
        <Alert type="danger" message={localError || error} />
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">User ID or Email</label>
            <input
              type="text"
              className="form-input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. python_demo or user@example.com"
              autoComplete="username"
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={submitting}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <button
            onClick={onNavigateRegister}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--primary)', 
              fontWeight: 600, 
              cursor: 'pointer',
              padding: 0 
            }}
          >
            Create an account
          </button>
        </div>
      </div>

      {/* 1-Click Demo Accounts for Trial */}
      <div className="card" style={{ backgroundColor: '#fcfdff', borderColor: '#c7d2fe' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <UserCheck size={18} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            1-Click Demo Login for Trial
          </h3>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Instantly explore pre-populated notes, question banks, and quiz history:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {Object.entries(DEMO_CREDENTIALS).map(([key, demo]) => (
            <button
              key={key}
              type="button"
              className="demo-launch-btn"
              onClick={() => handleDemoClick(key)}
              disabled={submitting}
            >
              <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                  {demo.name}
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.35, wordBreak: 'break-word' }}>
                  {demo.description}
                </div>
              </div>
              <span 
                className="badge badge-primary" 
                style={{ fontSize: '0.725rem', padding: '0.25rem 0.6rem', flexShrink: 0, alignSelf: 'center' }}
              >
                Launch
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
