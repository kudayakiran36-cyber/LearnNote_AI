import React, { useState } from 'react';
import { api } from '../services/api';
import Alert from '../components/Alert';
import { 
  Sparkles, 
  FileText, 
  Upload, 
  Check, 
  X, 
  HelpCircle, 
  BookOpen, 
  Save, 
  Edit3, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export default function CreateKnowledgePage({ onNoteCreated, setActivePage }) {
  const [activeTab, setActiveTab] = useState('topic'); // 'topic', 'text', 'upload'

  // Input states
  const [topicInput, setTopicInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Processing & Error states
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Preview state (before DB persistence)
  const [preview, setPreview] = useState(null);
  const [isEditingPreview, setIsEditingPreview] = useState(false);

  // Editable fields in preview
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editExplanation, setEditExplanation] = useState('');
  const [editTags, setEditTags] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError(null);
    setGenerating(true);

    try {
      let data;
      if (activeTab === 'topic') {
        if (!topicInput.trim()) {
          throw new Error('Please enter a topic to generate knowledge.');
        }
        data = await api.notes.generatePreview({
          mode: 'topic',
          topic: topicInput.trim(),
          subject: subjectInput.trim() || undefined,
        });
      } else if (activeTab === 'text') {
        if (!textInput.trim() || textInput.trim().length < 20) {
          throw new Error('Please paste at least 20 characters of learning material.');
        }
        data = await api.notes.generatePreview({
          mode: 'text',
          text: textInput.trim(),
          subject: subjectInput.trim() || undefined,
          topic: topicInput.trim() || undefined,
        });
      } else if (activeTab === 'upload') {
        if (!selectedFile) {
          throw new Error('Please select a PDF or image file to upload.');
        }
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (subjectInput.trim()) formData.append('subject', subjectInput.trim());
        if (topicInput.trim()) formData.append('topic', topicInput.trim());

        data = await api.notes.uploadFile(formData);
      }

      setPreview(data);
      // Initialize edit fields
      setEditTitle(data.title);
      setEditSubject(data.subject);
      setEditTopic(data.topic);
      setEditSummary(data.summary);
      setEditExplanation(data.detailed_explanation);
      setEditTags((data.tags || []).join(', '));
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!preview) return;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: editTitle.trim(),
        subject: editSubject.trim(),
        topic: editTopic.trim(),
        summary: editSummary.trim(),
        content: {
          core_concepts: preview.core_concepts || [],
          detailed_explanation: editExplanation,
          examples: preview.examples || [],
          common_mistakes: preview.common_mistakes || [],
          key_takeaways: preview.key_takeaways || [],
          sources: preview.sources || [],
        },
        tags: editTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        questions: preview.questions || [],
        source_type: activeTab,
        source_reference: selectedFile ? selectedFile.name : (topicInput || 'AI Generated'),
      };

      const savedNote = await api.notes.create(payload);
      if (onNoteCreated) {
        onNoteCreated(savedNote.id);
      } else {
        setActivePage('library');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Knowledge</h1>
          <p className="page-subtitle">
            Provide a topic, paste study notes, or upload documents. AI converts them into structured notes and a reusable question bank.
          </p>
        </div>
      </div>

      {error && <Alert type="danger" message={error} />}

      {!preview ? (
        <div className="card">
          {/* Mode Switcher Tabs */}
          <div className="tab-nav">
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'topic' ? 'active' : ''}`}
              onClick={() => setActiveTab('topic')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} />
                <span>Topic Mode</span>
              </span>
            </button>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTab('text')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={16} />
                <span>Pasted Text</span>
              </span>
            </button>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Upload size={16} />
                <span>PDF / Image Upload</span>
              </span>
            </button>
          </div>

          <form onSubmit={handleGenerate}>
            {/* Topic Mode */}
            {activeTab === 'topic' && (
              <div>
                <div className="form-group">
                  <label className="form-label">Topic to Learn *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="e.g. Python Decorators and Generators, React Virtual DOM, SQL Window Functions"
                    disabled={generating}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Subject (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    placeholder="e.g. Python Programming, Frontend Development, Databases"
                    disabled={generating}
                  />
                  <div className="form-hint">Provides domain context for question calibration.</div>
                </div>
              </div>
            )}

            {/* Pasted Text Mode */}
            {activeTab === 'text' && (
              <div>
                <div className="form-group">
                  <label className="form-label">Paste Study Material or Article Text *</label>
                  <textarea
                    className="form-textarea"
                    rows={8}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste textbook excerpts, lecture transcripts, code explanations, or documentation..."
                    disabled={generating}
                    required
                  />
                  <div className="form-hint">AI will extract key concepts, build clear explanations, and generate question sets.</div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Topic Title (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      placeholder="e.g. Memory Management in C++"
                      disabled={generating}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      placeholder="e.g. Systems Programming"
                      disabled={generating}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Document Upload Mode */}
            {activeTab === 'upload' && (
              <div>
                <div className="form-group">
                  <label className="form-label">Select Document or Image *</label>
                  <input
                    type="file"
                    className="form-input"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    disabled={generating}
                    required
                  />
                  <div className="form-hint">
                    Supported formats: PDF, PNG, JPG, WEBP (Max 10 MB).
                  </div>
                </div>

                {selectedFile && (
                  <div style={{ marginBottom: '1rem', padding: '0.6rem 0.85rem', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                    Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Topic (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      placeholder="Override or specify topic name"
                      disabled={generating}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      placeholder="e.g. Data Structures"
                      disabled={generating}
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={generating}
              >
                {generating ? (
                  <span>Generating Knowledge & Question Bank...</span>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Structured Knowledge</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Preview & Verification State (Section 9 & 37) */
        <div>
          <Alert type="info">
            <div style={{ fontSize: '0.875rem' }}>
              <strong>Responsible AI Review:</strong> Please review and adjust the AI-generated structured note and question bank below before saving to your library.
            </div>
          </Alert>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={20} style={{ color: 'var(--primary)' }} />
                <h2 className="card-title">Generated Learning Note</h2>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setIsEditingPreview(!isEditingPreview)}
              >
                <Edit3 size={14} />
                <span>{isEditingPreview ? 'Finish Editing' : 'Edit Note Content'}</span>
              </button>
            </div>

            {/* Editable or Display View */}
            {isEditingPreview ? (
              <div>
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
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span className="badge badge-primary">{editSubject}</span>
                  <span className="badge badge-neutral">{editTopic}</span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  {editTitle}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                  {editSummary}
                </p>

                {preview.core_concepts && preview.core_concepts.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                      Core Concepts
                    </h4>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {preview.core_concepts.map((c, i) => (
                        <li key={i} style={{ marginBottom: '0.25rem' }}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                    Explanation Preview
                  </h4>
                  <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                    {editExplanation}
                  </div>
                </div>

                {editTags && (
                  <div className="tag-list">
                    {editTags.split(',').map((t, i) => (
                      <span key={i} className="tag-pill">#{t.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Generated Question Bank Preview */}
          <div className="card" style={{ marginBottom: '1.75rem' }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={20} style={{ color: 'var(--primary)' }} />
                <h2 className="card-title">
                  Generated Question Bank ({preview.questions?.length || 0} Questions)
                </h2>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              These questions will be stored in your database and reused during deterministic quiz sessions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
              {preview.questions?.map((q, idx) => (
                <div key={idx} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Q{idx + 1}. {q.question}</span>
                    <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {q.question_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--success-text)', fontWeight: 600 }}>
                    Answer: {q.correct_answer}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons: Cancel vs Save to Database */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => setPreview(null)}
              disabled={saving}
            >
              <X size={16} />
              <span>Discard & Retry</span>
            </button>

            <button 
              className="btn btn-primary btn-lg"
              onClick={handleSaveToDatabase}
              disabled={saving}
            >
              {saving ? 'Saving to Knowledge Library...' : 'Save Knowledge to Library'}
              {!saving && <Save size={18} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
