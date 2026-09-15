import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Alert from '../components/Alert';
import { 
  User, 
  Key, 
  Trash2, 
  ShieldAlert, 
  CheckCircle,
  Database,
  Cpu
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Password update form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // Delete account confirmation
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.settings.get();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.settings.updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you ABSOLUTELY sure you want to permanently delete your account and all learning notes? This action is irreversible.')) {
      return;
    }
    setDeleting(true);
    try {
      await api.settings.deleteAccount();
      logout();
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Workspace Settings</h1>
          <p className="page-subtitle">
            Manage your account credentials, security preferences, and workspace storage.
          </p>
        </div>
      </div>

      {error && <Alert type="danger" message={error} />}

      {/* Demo Account Indicator & Safety Banner */}
      {user?.is_demo && (
        <Alert type="warning">
          <div>
            <strong>Evaluation Demo Account:</strong> You are logged into an official judge evaluation account. 
            Destructive actions (such as account deletion and password changes) are restricted to keep the prepared evaluation dataset intact for all judges.
          </div>
        </Alert>
      )}

      {/* Account Profile Card */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <User size={20} style={{ color: 'var(--primary)' }} />
          <h2 className="card-title">User Profile</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>User ID</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{user?.unique_id}</span>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Email Address</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{user?.email}</span>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Account Type</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              {user?.is_demo ? 'Official Demo Account' : 'Standard User Account'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>AI Provider</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              Groq (llama-3.3-70b-versatile)
            </span>
          </div>
        </div>
      </div>

      {/* Password Change Card */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Key size={20} style={{ color: 'var(--primary)' }} />
          <h2 className="card-title">Change Password</h2>
        </div>

        {passwordMsg && <Alert type="success" message={passwordMsg} />}
        {passwordError && <Alert type="danger" message={passwordError} />}

        <form onSubmit={handlePasswordUpdate}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              disabled={updatingPassword || user?.is_demo}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              disabled={updatingPassword || user?.is_demo}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-input"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={updatingPassword || user?.is_demo}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={updatingPassword || user?.is_demo}
            >
              {updatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="card" style={{ borderColor: 'var(--danger-border)', backgroundColor: '#fffdfd' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <ShieldAlert size={20} style={{ color: 'var(--danger)' }} />
          <h2 className="card-title" style={{ color: 'var(--danger-text)' }}>Danger Zone</h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Permanently delete your account and all associated knowledge notes, question banks, and quiz history.
        </p>

        <button
          type="button"
          className="btn btn-outline-danger btn-sm"
          onClick={handleDeleteAccount}
          disabled={deleting || user?.is_demo}
        >
          <Trash2 size={14} />
          <span>{deleting ? 'Deleting...' : 'Delete My Account'}</span>
        </button>
      </div>
    </div>
  );
}
