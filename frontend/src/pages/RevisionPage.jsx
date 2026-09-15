import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Alert from '../components/Alert';
import { 
  RotateCcw, 
  Check, 
  Play, 
  BookOpen, 
  Clock, 
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function RevisionPage({ onOpenNote, onStartQuizTopic }) {
  const [revisionData, setRevisionData] = useState({ due_count: 0, items: [] });
  const [thresholdDays, setThresholdDays] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const loadRevisionQueue = async (days = thresholdDays) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.revision.get(days);
      setRevisionData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevisionQueue(thresholdDays);
  }, [thresholdDays]);

  const handleMarkReviewed = async (noteId, title) => {
    try {
      await api.revision.markReviewed(noteId);
      setActionMessage(`Marked "${title}" as reviewed!`);
      // Update local state without full reload
      setRevisionData((prev) => ({
        ...prev,
        due_count: Math.max(0, prev.due_count - 1),
        items: prev.items.filter((i) => i.id !== noteId),
      }));
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Date-Based Revision</h1>
          <p className="page-subtitle">
            Combats the forgetting curve. Notes that have never been tested or haven't been reviewed recently are queued here.
          </p>
        </div>

        {/* Threshold selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Due after:</span>
          <select
            className="form-select"
            value={thresholdDays}
            onChange={(e) => setThresholdDays(Number(e.target.value))}
            style={{ width: 'auto', padding: '0.4rem 0.75rem' }}
          >
            <option value={1}>1 day</option>
            <option value={3}>3 days</option>
            <option value={7}>7 days (1 week)</option>
            <option value={14}>14 days (2 weeks)</option>
            <option value={30}>30 days (1 month)</option>
          </select>
        </div>
      </div>

      {actionMessage && <Alert type="success" message={actionMessage} />}
      {error && <Alert type="danger" message={error} />}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          Checking revision queue...
        </div>
      ) : revisionData.items.length === 0 ? (
        <div className="empty-state">
          <Check className="empty-state-icon" style={{ color: 'var(--success)' }} />
          <h3 className="empty-state-title">All Caught Up!</h3>
          <p className="empty-state-desc">
            You have no notes due for revision based on the {thresholdDays}-day window. Keep up the consistent practice!
          </p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Showing <strong>{revisionData.due_count}</strong> note(s) needing attention:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {revisionData.items.map((item) => (
              <div 
                key={item.id} 
                className="card"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className="badge badge-primary">{item.subject}</span>
                    <span className="badge badge-neutral">{item.topic}</span>
                    {item.status === 'never_reviewed' ? (
                      <span className="badge badge-warning">Never Reviewed</span>
                    ) : (
                      <span className="badge badge-neutral" style={{ color: '#b45309', backgroundColor: '#fef3c7' }}>
                        Last reviewed {item.days_since_reviewed} day{item.days_since_reviewed !== 1 ? 's' : ''} ago
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.summary}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onOpenNote(item.id)}
                    title="Study Note"
                  >
                    <BookOpen size={14} />
                    <span>Study</span>
                  </button>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onStartQuizTopic(item.topic)}
                    title="Practice Quiz on this topic"
                  >
                    <Play size={14} />
                    <span>Quiz</span>
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleMarkReviewed(item.id, item.title)}
                    title="Mark as reviewed today"
                  >
                    <Check size={14} />
                    <span>Mark Reviewed</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
