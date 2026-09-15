import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Alert from '../components/Alert';
import { HelpCircle, Play, CheckSquare, Layers } from 'lucide-react';

export default function QuizConfigPage({ onQuizStarted, defaultTopic }) {
  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState(defaultTopic ? [defaultTopic] : []);
  const [questionCount, setQuestionCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTopics() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.quiz.getTopics();
        setTopics(data);
        if (defaultTopic && !selectedTopics.includes(defaultTopic)) {
          setSelectedTopics([defaultTopic]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTopics();
  }, [defaultTopic]);

  const toggleTopic = (topicName) => {
    if (selectedTopics.includes(topicName)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topicName));
    } else {
      setSelectedTopics([...selectedTopics, topicName]);
    }
  };

  const selectAllTopics = () => {
    if (selectedTopics.length === topics.length) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics(topics.map((t) => t.topic));
    }
  };

  // Calculate available questions for current selection
  const matchingTopics = topics.filter((t) =>
    selectedTopics.length === 0 ? true : selectedTopics.includes(t.topic)
  );
  const totalAvailableQuestions = matchingTopics.reduce((acc, t) => acc + (t.question_count || 0), 0);

  const handleStartQuiz = async () => {
    setError(null);
    setStarting(true);
    try {
      const response = await api.quiz.start({
        topics: selectedTopics.length > 0 ? selectedTopics : undefined,
        question_count: questionCount,
      });
      onQuizStarted(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
        Loading quiz configuration...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configure Quiz</h1>
          <p className="page-subtitle">
            Quizzes randomly select from your stored question bank and score deterministically without calling AI at runtime.
          </p>
        </div>
      </div>

      {error && <Alert type="danger" message={error} />}

      {topics.length === 0 ? (
        <div className="empty-state">
          <HelpCircle className="empty-state-icon" />
          <h3 className="empty-state-title">No Stored Questions Available</h3>
          <p className="empty-state-desc">
            You need to create at least one knowledge note with questions before taking a quiz.
          </p>
        </div>
      ) : (
        <div className="card">
          {/* Step 1: Select Topics */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                1. Select Topic(s)
              </label>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={selectAllTopics}
              >
                {selectedTopics.length === topics.length ? 'Deselect All' : 'Select All Topics'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
              {topics.map((t) => {
                const isSelected = selectedTopics.includes(t.topic);
                return (
                  <div
                    key={t.topic}
                    onClick={() => toggleTopic(t.topic)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                        {t.topic}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {t.question_count} stored questions
                      </div>
                    </div>
                    {isSelected && <CheckSquare size={16} style={{ color: 'var(--primary)' }} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Question Count */}
          <div style={{ marginBottom: '2rem' }}>
            <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              2. Number of Questions
            </label>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[5, 10, 15, 20].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`btn ${questionCount === count ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Available Questions Counter */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
              <Layers size={18} style={{ color: 'var(--primary)' }} />
              <span>Available matching questions: <strong>{totalAvailableQuestions}</strong></span>
            </div>

            {totalAvailableQuestions < questionCount && totalAvailableQuestions > 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--warning-text)', fontWeight: 600 }}>
                (Quiz will use all {totalAvailableQuestions} available)
              </span>
            )}
          </div>

          {/* Start Quiz CTA */}
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={handleStartQuiz}
            disabled={starting || totalAvailableQuestions === 0}
            style={{ width: '100%' }}
          >
            {starting ? 'Starting Quiz Attempt...' : `Start Quiz (${Math.min(totalAvailableQuestions, questionCount)} Questions)`}
            {!starting && <Play size={18} />}
          </button>
        </div>
      )}
    </div>
  );
}
