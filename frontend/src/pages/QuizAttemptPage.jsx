import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
import { 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  Send, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';

export default function QuizAttemptPage({ quizSession, onQuizCompleted, onCancelQuiz }) {
  const { attempt_id, questions, warning, total_questions } = quizSession;

  const [currentIndex, setCurrentIndex] = useState(0);
  // Answers map: { [question_id]: selected_answer }
  const [answers, setAnswers] = useState(() => {
    const cached = sessionStorage.getItem(`quiz_answers_${attempt_id}`);
    return cached ? JSON.parse(cached) : {};
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Sync to sessionStorage to protect against accidental refreshes
  useEffect(() => {
    sessionStorage.setItem(`quiz_answers_${attempt_id}`, JSON.stringify(answers));
  }, [answers, attempt_id]);

  const currentQ = questions[currentIndex];
  const currentAnswer = answers[currentQ.id] || '';

  const handleSelectAnswer = (ans) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: ans,
    }));
  };

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const progressPercent = Math.round(((currentIndex + 1) / total_questions) * 100);

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    setError(null);
    setIsSubmitModalOpen(false);

    try {
      const payload = {
        answers: questions.map((q) => ({
          question_id: q.id,
          selected_answer: answers[q.id] || '',
        })),
      };

      const result = await api.quiz.submit(attempt_id, payload);
      // Clear cache
      sessionStorage.removeItem(`quiz_answers_${attempt_id}`);
      onQuizCompleted(result);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="quiz-container">
      {/* Top Header / Exit */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => {
            if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
              sessionStorage.removeItem(`quiz_answers_${attempt_id}`);
              onCancelQuiz();
            }
          }}
        >
          <ArrowLeft size={14} />
          <span>Exit Quiz</span>
        </button>

        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Answered {answeredCount} of {total_questions}
        </div>
      </div>

      {warning && <Alert type="warning" message={warning} style={{ marginBottom: '1rem' }} />}
      {error && <Alert type="danger" message={error} style={{ marginBottom: '1rem' }} />}

      {/* Progress Bar */}
      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Question Card */}
      <div className="card" style={{ padding: '2rem 1.75rem', marginBottom: '1.5rem' }}>
        {/* Question Meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>
              Question {currentIndex + 1} of {total_questions}
            </span>
            <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
              {currentQ.question_type.replace('_', ' ')}
            </span>
          </div>

          {currentQ.note_title && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              From: {currentQ.note_title}
            </span>
          )}
        </div>

        {/* Question Text */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.75rem', lineHeight: 1.4 }}>
          {currentQ.question}
        </h2>

        {/* Dynamic Inputs based on question_type */}

        {/* 1. Multiple Choice (MCQ) */}
        {currentQ.question_type === 'mcq' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {currentQ.options?.map((opt, i) => {
              const isSelected = currentAnswer === opt;
              return (
                <div
                  key={i}
                  className={`quiz-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectAnswer(opt)}
                >
                  <div className="quiz-option-radio" />
                  <span style={{ fontSize: '0.95rem', fontWeight: isSelected ? 600 : 400, color: 'var(--text-main)' }}>
                    {opt}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. True / False */}
        {currentQ.question_type === 'true_false' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
            {['True', 'False'].map((val) => {
              const isSelected = currentAnswer.toLowerCase() === val.toLowerCase();
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSelectAnswer(val)}
                  style={{
                    padding: '1.5rem',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                    backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--bg-card)',
                    color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {val}
                </button>
              );
            })}
          </div>
        )}

        {/* 3. Fill in the Blank */}
        {currentQ.question_type === 'fill_blank' && (
          <div style={{ marginTop: '1rem' }}>
            <label className="form-label">Type your answer below:</label>
            <input
              type="text"
              className="form-input"
              value={currentAnswer}
              onChange={(e) => handleSelectAnswer(e.target.value)}
              placeholder="Enter missing term or keyword..."
              style={{ fontSize: '1.05rem', padding: '0.85rem' }}
              autoFocus
            />
            <div className="form-hint">
              Case-insensitive deterministic match. Punctuation at the end will be ignored.
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation & Question Jumper */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0 || submitting}
        >
          <ArrowLeft size={16} />
          <span>Previous</span>
        </button>

        {currentIndex < total_questions - 1 ? (
          <button
            className="btn btn-primary"
            onClick={() => setCurrentIndex((prev) => Math.min(total_questions - 1, prev + 1))}
            disabled={submitting}
          >
            <span>Next</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => setIsSubmitModalOpen(true)}
            disabled={submitting}
            style={{ backgroundColor: 'var(--success)' }}
          >
            <Send size={16} />
            <span>Submit Quiz</span>
          </button>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Ready to Submit Quiz?"
      >
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          You have answered <strong>{answeredCount}</strong> of <strong>{total_questions}</strong> questions.
          {answeredCount < total_questions && (
            <span style={{ display: 'block', color: 'var(--danger-text)', marginTop: '0.5rem', fontWeight: 600 }}>
              Warning: You have {total_questions - answeredCount} unanswered question(s). Unanswered questions will be counted as incorrect.
            </span>
          )}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setIsSubmitModalOpen(false)} disabled={submitting}>
            Review Answers
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmitQuiz} 
            disabled={submitting}
            style={{ backgroundColor: 'var(--success)' }}
          >
            {submitting ? 'Scoring Answers...' : 'Confirm & Submit'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
