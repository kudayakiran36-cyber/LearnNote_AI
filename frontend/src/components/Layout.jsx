import React from 'react';
import Navbar from './Navbar';

export default function Layout({ children, activePage, setActivePage }) {
  return (
    <div className="app-container">
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main className="main-content">
        {children}
      </main>
      <footer className="app-footer">
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>LearnNote AI — AI-Powered Structured Learning & Quiz Workspace</span>
          <span style={{ color: 'var(--text-subtle)' }}>AI creates knowledge • App tests and tracks</span>
        </div>
      </footer>
    </div>
  );
}
