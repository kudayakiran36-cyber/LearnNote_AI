import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Alert from '../components/Alert';
import { 
  Sparkles, 
  HelpCircle, 
  BookOpen, 
  Clock, 
  ArrowRight, 
  Award, 
  RotateCcw, 
  CheckCircle,
  FileText,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage({ setActivePage, onOpenNote, onStartQuizTopic }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [progress, setProgress] = useState(null);
  const [revisionItems, setRevisionItems] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [notesData, progressData, revData] = await Promise.all([
          api.notes.list({ sort: 'newest' }),
          api.progress.get(),
          api.revision.get(3),
        ]);
        setRecentNotes(notesData.slice(0, 5));
        setProgress(progressData);
        setRevisionItems(revData.items || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Loading learning workspace...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.unique_id}
          </h1>
          <p className="page-subtitle">
            AI structures your knowledge. Test your retention with deterministic quizzes and track long-term progress.
          </p>
        </div>

        {/* Quick Top Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-primary"
            onClick={() => setActivePage('create')}
          >
            <Sparkles size={16} />
            <span>Create Knowledge</span>
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setActivePage('quiz')}
          >
            <HelpCircle size={16} />
            <span>Take Quiz</span>
          </button>
        </div>
      </div>

      {error && <Alert type="danger" message={error} />}

      {/* Spaced Revision Alert Prompt if items exist */}
      {revisionItems.length > 0 && (
        <div 
          className="card" 
          style={{ 
            backgroundColor: '#fffbeb', 
            borderColor: '#fde68a', 
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <RotateCcw size={22} style={{ color: '#d97706' }} />
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.95rem' }}>
                {revisionItems.length} Knowledge Note{revisionItems.length > 1 ? 's' : ''} Due for Revision
              </div>
              <div style={{ fontSize: '0.85rem', color: '#b45309' }}>
                Keep memories fresh by revisiting material that hasn't been tested recently.
              </div>
            </div>
          </div>
          <button 
            className="btn btn-sm btn-secondary"
            onClick={() => setActivePage('revision')}
            style={{ backgroundColor: '#ffffff', borderColor: '#fde68a' }}
          >
            <span>Review Revision Queue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Progress Summary Metrics */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            <BookOpen size={16} />
            <span>Total Notes</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {recentNotes.length > 0 ? recentNotes.length : 0}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            <HelpCircle size={16} />
            <span>Questions Answered</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {progress?.total_questions_answered || 0}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            <CheckCircle size={16} />
            <span>Quizzes Completed</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {progress?.total_quizzes || 0}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            <Award size={16} />
            <span>Average Score</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
            {progress?.average_score_percentage ? `${progress.average_score_percentage}%` : '0%'}
          </div>
        </div>
      </div>

      {/* Main Sections: Recent Notes and Recent Quizzes */}
      <div className="grid-2">
        {/* Recent Notes */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} style={{ color: 'var(--primary)' }} />
              <h2 className="card-title">Recent Notes</h2>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActivePage('library')}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {recentNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: '1rem' }}>You have not created any knowledge notes yet.</p>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setActivePage('create')}
              >
                Create your first note
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentNotes.map((note) => (
                <div 
                  key={note.id}
                  onClick={() => onOpenNote(note.id)}
                  style={{ 
                    padding: '0.85rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--bg-card)'
                  }}
                  className="interactive"
                >
                  <div style={{ maxWidth: '85%' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      {note.title}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">{note.topic}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {note.question_count} questions
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--text-subtle)' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Quiz Activity */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} style={{ color: 'var(--primary)' }} />
              <h2 className="card-title">Recent Quiz Activity</h2>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActivePage('progress')}
            >
              <span>View Stats</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {(!progress?.recent_quizzes || progress.recent_quizzes.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: '1rem' }}>No quizzes attempted yet.</p>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setActivePage('quiz')}
              >
                Configure a quiz
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {progress.recent_quizzes.slice(0, 5).map((q) => (
                <div 
                  key={q.id}
                  style={{ 
                    padding: '0.85rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--bg-card)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.15rem' }}>
                      {q.topic_scope || 'General Practice'}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={12} />
                      <span>{new Date(q.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{q.score} / {q.total_questions} correct</span>
                    </div>
                  </div>
                  <span 
                    className={`badge ${q.percentage >= 80 ? 'badge-success' : q.percentage >= 60 ? 'badge-primary' : 'badge-warning'}`}
                    style={{ fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    {q.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
