import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Alert from '../components/Alert';
import { 
  BarChart2, 
  Award, 
  HelpCircle, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export default function ProgressPage({ onReviewQuizResult, setActivePage }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProgress() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.progress.get();
        setProgress(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProgress();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
        Loading progress analytics...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Learning Progress</h1>
          <p className="page-subtitle">
            Empirical retention statistics calculated strictly from your completed quiz attempts and stored answers.
          </p>
        </div>
      </div>

      {error && <Alert type="danger" message={error} />}

      {/* Aggregate Stats Tiles */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Award size={16} />
            <span>Average Score</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>
            {progress?.average_score_percentage || 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
            Across all quiz attempts
          </div>
        </div>

        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle size={16} />
            <span>Quizzes Completed</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>
            {progress?.total_quizzes || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
            Recorded sessions
          </div>
        </div>

        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <HelpCircle size={16} />
            <span>Questions Answered</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>
            {progress?.total_questions_answered || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
            Total problem attempts
          </div>
        </div>

        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <TrendingUp size={16} />
            <span>Correct Answers</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--success-text)' }}>
            {progress?.total_correct_answers || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
            Accurate responses
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Topic-Level Performance Breakdown */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Topic Mastery Performance</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Calculated from your answer history to help prioritize areas needing review:
          </p>

          {(!progress?.topic_performance || progress.topic_performance.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              Take your first quiz to see topic accuracy breakdowns.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {progress.topic_performance.map((tp) => (
                <div key={tp.topic}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-main)' }}>
                        {tp.topic}
                      </span>
                      <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                        ({tp.correct_count}/{tp.total_answered} answered)
                      </span>
                    </div>
                    <span 
                      style={{ 
                        fontWeight: 800, 
                        fontSize: '0.9rem',
                        color: tp.accuracy_percentage >= 80 ? 'var(--success-text)' : tp.accuracy_percentage >= 60 ? 'var(--primary)' : 'var(--warning-text)'
                      }}
                    >
                      {tp.accuracy_percentage}%
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${tp.accuracy_percentage}%`,
                        backgroundColor: tp.accuracy_percentage >= 80 ? 'var(--success)' : tp.accuracy_percentage >= 60 ? 'var(--primary)' : 'var(--warning)',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.4s ease'
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Full Recent Quiz History */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Completed Quiz Sessions</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Historical quiz records preserved independently of note deletions:
          </p>

          {(!progress?.recent_quizzes || progress.recent_quizzes.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              No quiz history recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
              {progress.recent_quizzes.map((q) => (
                <div 
                  key={q.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      {q.topic_scope || 'General Practice'}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={12} />
                      <span>{new Date(q.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{q.score} / {q.total_questions} correct</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span 
                      className={`badge ${q.percentage >= 80 ? 'badge-success' : q.percentage >= 60 ? 'badge-primary' : 'badge-warning'}`}
                      style={{ fontSize: '0.85rem', fontWeight: 700 }}
                    >
                      {q.percentage}%
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onReviewQuizResult(q.id)}
                      title="Review Answers"
                    >
                      <span>Review</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
