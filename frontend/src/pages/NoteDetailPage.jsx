import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
import { 
  BookOpen, 
  HelpCircle, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Calendar, 
  Play, 
  ArrowLeft, 
  Check, 
  Save, 
  X,
  Tag,
  AlertCircle
} from 'lucide-react';

export default function NoteDetailPage({ noteId, onBack, onStartQuizTopic }) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('note'); // 'note' or 'questions'

  // Edit Note Modal state
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editExplanation, setEditExplanation] = useState('');
  const [editTags, setEditTags] = useState('');

  // Edit Question Modal state
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('mcq');
  const [qOptions, setQOptions] = useState('');
  const [qCorrect, setQCorrect] = useState('');
  const [qExplanation, setQExplanation] = useState('');

  // Regenerating questions state
  const [regenerating, setRegenerating] = useState(false);

  const loadNote = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.notes.get(noteId);
      setNote(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNote();
  }, [noteId]);

  const openEditNoteModal = () => {
    if (!note) return;
    setEditTitle(note.title);
    setEditSubject(note.subject);
    setEditTopic(note.topic);
    setEditSummary(note.summary);
    setEditExplanation(note.content?.detailed_explanation || '');
    setEditTags((note.tags || []).join(', '));
    setIsEditNoteOpen(true);
  };

  const handleSaveNoteEdit = async () => {
    try {
      const updated = await api.notes.update(noteId, {
        title: editTitle.trim(),
        subject: editSubject.trim(),
        topic: editTopic.trim(),
        summary: editSummary.trim(),
        content: {
          ...note.content,
          detailed_explanation: editExplanation,
        },
        tags: editTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
      });
      setNote(updated);
      setIsEditNoteOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditQuestionModal = (q) => {
    setEditingQuestion(q);
    setQText(q.question);
    setQType(q.question_type);
    setQOptions((q.options || []).join('\n'));
    setQCorrect(q.correct_answer);
    setQExplanation(q.explanation);
  };

  const handleSaveQuestionEdit = async () => {
    if (!editingQuestion) return;
    try {
      const opts = qType === 'mcq' ? qOptions.split('\n').map((o) => o.trim()).filter(Boolean) : null;
      const updatedQ = await api.questions.update(editingQuestion.id, {
        question: qText.trim(),
        question_type: qType,
        options: opts,
        correct_answer: qCorrect.trim(),
        explanation: qExplanation.trim(),
      });
      setNote({
        ...note,
        questions: note.questions.map((q) => (q.id === updatedQ.id ? updatedQ : q)),
      });
      setEditingQuestion(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.questions.delete(qId);
      setNote({
        ...note,
        questions: note.questions.filter((q) => q.id !== qId),
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRegenerateQuestions = async () => {
    if (!window.confirm('Regenerating will replace all existing questions for this note with a fresh question bank. Continue?')) {
      return;
    }
    setRegenerating(true);
    try {
      const newQuestions = await api.notes.regenerateQuestions(noteId);
      setNote({
        ...note,
        questions: newQuestions,
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
        Loading note details...
      </div>
    );
  }

  if (error || !note) {
    return (
      <div>
        <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={14} />
          <span>Back to Library</span>
        </button>
        <Alert type="danger" message={error || 'Note not found.'} />
      </div>
    );
  }

  const content = note.content || {};

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back button & Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={14} />
          <span>Back to Library</span>
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={openEditNoteModal}>
            <Edit3 size={14} />
            <span>Edit Note</span>
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => onStartQuizTopic(note.topic)}
          >
            <Play size={14} />
            <span>Quiz on this Note</span>
          </button>
        </div>
      </div>

      {/* Note Header Title & Meta */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <span className="badge badge-primary">{note.subject}</span>
          <span className="badge badge-neutral">{note.topic}</span>
          {note.last_reviewed_at ? (
            <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={12} />
              Reviewed {new Date(note.last_reviewed_at).toLocaleDateString()}
            </span>
          ) : (
            <span className="badge badge-warning">Never Reviewed</span>
          )}
        </div>

        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem', lineHeight: 1.25 }}>
          {note.title}
        </h1>

        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {note.summary}
        </p>

        {note.tags && note.tags.length > 0 && (
          <div className="tag-list" style={{ marginTop: '1rem' }}>
            {note.tags.map((t) => (
              <span key={t} className="tag-pill">#{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tab Navigation: Study Note vs Question Bank */}
      <div className="tab-nav">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'note' ? 'active' : ''}`}
          onClick={() => setActiveTab('note')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BookOpen size={16} />
            <span>Structured Note</span>
          </span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <HelpCircle size={16} />
            <span>Question Bank ({note.questions?.length || 0})</span>
          </span>
        </button>
      </div>

      {/* Tab 1: Structured Note Content */}
      {activeTab === 'note' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Core Concepts */}
          {content.core_concepts && content.core_concepts.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                Core Foundational Concepts
              </h3>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-main)', lineHeight: 1.7 }}>
                {content.core_concepts.map((concept, idx) => (
                  <li key={idx}>{concept}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Explanation */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Detailed Explanation
            </h3>
            <div style={{ color: 'var(--text-main)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {content.detailed_explanation}
            </div>
          </div>

          {/* Practical Examples */}
          {content.examples && content.examples.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                Practical Examples & Code
              </h3>
              {content.examples.map((ex, idx) => (
                <div key={idx} style={{ marginBottom: idx < content.examples.length - 1 ? '1rem' : 0 }}>
                  <pre style={{ margin: 0 }}>{ex}</pre>
                </div>
              ))}
            </div>
          )}

          {/* Common Mistakes & Pitfalls */}
          {content.common_mistakes && content.common_mistakes.length > 0 && (
            <div className="card" style={{ backgroundColor: '#fffbfb', borderColor: '#fecaca' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <AlertCircle size={18} style={{ color: '#dc2626' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#991b1b' }}>
                  Common Mistakes & Pitfalls
                </h3>
              </div>
              <ul style={{ paddingLeft: '1.25rem', color: '#7f1d1d', lineHeight: 1.7 }}>
                {content.common_mistakes.map((mistake, idx) => (
                  <li key={idx}>{mistake}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Takeaways */}
          {content.key_takeaways && content.key_takeaways.length > 0 && (
            <div className="card" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#166534' }}>
                Key Revision Takeaways
              </h3>
              <ul style={{ paddingLeft: '1.25rem', color: '#14532d', lineHeight: 1.7 }}>
                {content.key_takeaways.map((takeaway, idx) => (
                  <li key={idx}>{takeaway}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sources */}
          {content.sources && content.sources.length > 0 && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0 0.5rem' }}>
              <strong>Sources & References:</strong> {content.sources.join(' • ')}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Question Bank Manager */}
      {activeTab === 'questions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.925rem', color: 'var(--text-muted)' }}>
              Reusable question bank stored in database. You can edit, delete, or regenerate them.
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleRegenerateQuestions}
              disabled={regenerating}
            >
              <RefreshCw size={14} className={regenerating ? 'spin' : ''} />
              <span>{regenerating ? 'Regenerating...' : 'Regenerate Question Bank'}</span>
            </button>
          </div>

          {note.questions?.length === 0 ? (
            <div className="empty-state">
              <HelpCircle className="empty-state-icon" />
              <h3 className="empty-state-title">No Questions Stored</h3>
              <p className="empty-state-desc">Generate a fresh question bank for this note.</p>
              <button className="btn btn-primary" onClick={handleRegenerateQuestions} disabled={regenerating}>
                Generate Questions
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {note.questions.map((q, idx) => (
                <div key={q.id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Question {idx + 1}
                        </span>
                        <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                          {q.question_type.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {q.question}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => openEditQuestionModal(q)}
                        title="Edit Question"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button 
                        className="btn btn-outline-danger btn-sm" 
                        onClick={() => handleDeleteQuestion(q.id)}
                        title="Delete Question"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* MCQ Options Display */}
                  {q.question_type === 'mcq' && q.options && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {q.options.map((opt, i) => (
                        <div 
                          key={i}
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.85rem',
                            backgroundColor: opt.trim() === q.correct_answer.trim() ? 'var(--success-subtle)' : 'var(--bg-subtle)',
                            border: `1px solid ${opt.trim() === q.correct_answer.trim() ? 'var(--success-border)' : 'var(--border-color)'}`,
                            color: opt.trim() === q.correct_answer.trim() ? 'var(--success-text)' : 'var(--text-main)',
                            fontWeight: opt.trim() === q.correct_answer.trim() ? 600 : 400,
                          }}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Correct Answer & Explanation */}
                  <div style={{ backgroundColor: 'var(--bg-hover)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--success-text)', marginBottom: '0.2rem' }}>
                      Correct Answer: {q.correct_answer}
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}>
                      {q.explanation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Note Modal */}
      <Modal isOpen={isEditNoteOpen} onClose={() => setIsEditNoteOpen(false)} title="Edit Knowledge Note">
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            type="text"
            className="form-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input
              type="text"
              className="form-input"
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Topic</label>
            <input
              type="text"
              className="form-input"
              value={editTopic}
              onChange={(e) => setEditTopic(e.target.value)}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Summary</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={editSummary}
            onChange={(e) => setEditSummary(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Detailed Explanation</label>
          <textarea
            className="form-textarea"
            rows={6}
            value={editExplanation}
            onChange={(e) => setEditExplanation(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Tags (comma-separated)</label>
          <input
            type="text"
            className="form-input"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button className="btn btn-secondary" onClick={() => setIsEditNoteOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveNoteEdit}>Save Changes</button>
        </div>
      </Modal>

      {/* Edit Question Modal */}
      <Modal 
        isOpen={!!editingQuestion} 
        onClose={() => setEditingQuestion(null)} 
        title="Edit Question"
      >
        <div className="form-group">
          <label className="form-label">Question Text</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={qText}
            onChange={(e) => setQText(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Question Type</label>
          <select
            className="form-select"
            value={qType}
            onChange={(e) => setQType(e.target.value)}
          >
            <option value="mcq">Multiple Choice (MCQ)</option>
            <option value="true_false">True / False</option>
            <option value="fill_blank">Fill in the Blank</option>
          </select>
        </div>

        {qType === 'mcq' && (
          <div className="form-group">
            <label className="form-label">Options (one per line)</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={qOptions}
              onChange={(e) => setQOptions(e.target.value)}
              placeholder="Option 1&#10;Option 2&#10;Option 3&#10;Option 4"
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Correct Answer</label>
          <input
            type="text"
            className="form-input"
            value={qCorrect}
            onChange={(e) => setQCorrect(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Explanation</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={qExplanation}
            onChange={(e) => setQExplanation(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button className="btn btn-secondary" onClick={() => setEditingQuestion(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveQuestionEdit}>Save Question</button>
        </div>
      </Modal>
    </div>
  );
}
