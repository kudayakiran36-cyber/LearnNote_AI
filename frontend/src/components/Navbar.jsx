import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  LayoutDashboard, 
  Library, 
  HelpCircle, 
  BarChart2, 
  RotateCcw, 
  Settings, 
  LogOut,
  Sparkles
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'library', label: 'Knowledge', icon: Library },
    { id: 'create', label: 'Create', icon: Sparkles },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
    { id: 'progress', label: 'Progress', icon: BarChart2 },
    { id: 'revision', label: 'Revision', icon: RotateCcw },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div 
          className="brand-link" 
          onClick={() => setActivePage('dashboard')} 
          style={{ cursor: 'pointer' }}
        >
          <div className="brand-icon">
            <BookOpen size={18} />
          </div>
          <span>LearnNote<span style={{ color: 'var(--primary)' }}>.AI</span></span>
        </div>

        <nav className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActivePage(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user && (
            <div className="user-badge">
              <span>{user.unique_id}</span>
              {user.is_demo && <span className="demo-pill">Demo</span>}
            </div>
          )}
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={logout} 
            title="Log Out"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
