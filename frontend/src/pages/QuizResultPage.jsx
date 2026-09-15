import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  BookOpen, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export default function QuizResultPage({ result, onRetakeQuiz, onOpenNote, setActivePage }) {
  const { 
    score, 
    total_questions, 
    percentage, 
    correct_count, 
    incorrect_count, 
    topic_scope,
    answers = [] 
  } = result;

  const isHighScorer = percentage >= 80;
  const isPassing = percentage >= 60;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Score Summary Card */}
      <div 
        className="card" 
        style={{ 
          textAlign: 'center', 
          padding: '2.5rem 1.5rem', 
          marginBottom: '2rem',
          background: isHighScorer 
            ? 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)' 
            : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
        }}
      >
        <div 
          style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            margin: '0 auto 1rem auto',
            backgroundColor: isHighScorer ? '#dcfce7' : '#e0e7ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isHighScorer ? '#16a34a' : 'var(--primary)'
          }}
        >
          <Award size={32} />
        </div>

        <div style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
          {topic_scope || 'General Learning Quiz'}
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          {percentage}%
        </h1>

        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: isHighScorer ? '#15803d' : (isPassing ? 'var(--primary)' : '#b45309'), marginBottom: '1.5rem' }}>
          {isHighScorer ? 'Outstanding retention! You have mastered this material.' : isPassing ? 'Solid work! Review missed items below to reinforce gaps.' : 'Needs revision. Review the explanations below.'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success-text)' }}>
              {correct_count}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Correct</div>
          </div>
          <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }} />
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger-text)' }}>
              {incorrect_count}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Incorrect</div>
          </div>
          <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }} />
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {total_questions}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total</div>
          </div>
        </div>

        {/* Action CTAs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onRetakeQuiz}>
            <RotateCcw size={16} />
            <span>Take Another Quiz</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setActivePage('progress')}>
            <TrendingUp size={16} />
            <span>View Progress</span>
          </button>
        </div>
      </div>

      {/* Question-by-Question Detailed Review */}
      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)' }}>
        Detailed Answer Review
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {answers.map((ans, idx) => (
          <div 
            key={idx}
            className="card"
            style={{ 
              borderColor: ans.is_correct ? 'var(--success-border)' : 'var(--danger-border)',
              backgroundColor: ans.is_correct ? '#fdfffe' : '#fffcfc'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                {ans.is_correct ? (
                  <CheckCircle2 size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                ) : (
                  <XCircle size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                )}
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Question {idx + 1} ({ans.question_type.replace('_', ' ')})
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {ans.question}
                  </h3>
                </div>
              </div>

              {ans.note_id && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onOpenNote(ans.note_id)}
                  title="Review Topic Note"
                >
                  <BookOpen size={12} />
                  <span>Review Note</span>
                </button>
              )}
            </div>

            {/* Answer Comparison */}
            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Your Answer:</span>
                  <span style={{ fontWeight: 600, color: ans.is_correct ? 'var(--success-text)' : 'var(--danger-text)' }}>
                    {ans.selected_answer || '(No answer provided)'}
                  </span>
                </div>

                {!ans.is_correct && (
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Correct Answer:</span>
                    <span style={{ fontWeight: 700, color: 'var(--success-text)' }}>
                      {ans.correct_answer}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Explanation */}
            <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              <strong>Explanation:</strong> {ans.explanation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
