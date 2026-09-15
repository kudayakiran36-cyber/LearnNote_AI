import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Alert from '../components/Alert';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  BookOpen, 
  HelpCircle, 
  Trash2, 
  Edit3, 
  Calendar, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function KnowledgeLibraryPage({ onOpenNote, onEditNote, setActivePage }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  // Metadata for filter dropdowns
  const [availableTopics, setAvailableTopics] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  const loadNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.notes.list({
        q: searchQuery,
        topic: selectedTopic || undefined,
        tag: selectedTag || undefined,
        sort: sortOrder,
      });
      setNotes(data);

      // Extract unique topics and tags for filters
      const topics = new Set();
      const tags = new Set();
      data.forEach((n) => {
        if (n.topic) topics.add(n.topic);
        n.tags?.forEach((t) => tags.add(t));
      });
      if (availableTopics.length === 0) setAvailableTopics(Array.from(topics));
      if (availableTags.length === 0) setAvailableTags(Array.from(tags));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [selectedTopic, selectedTag, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadNotes();
  };

  const handleDelete = async (noteId, noteTitle, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${noteTitle}" and its question bank?`)) {
      return;
    }
    try {
      await api.notes.delete(noteId);
      setNotes(notes.filter((n) => n.id !== noteId));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Knowledge Library</h1>
          <p className="page-subtitle">
            Search, filter, and review all your structured learning modules and generated question banks.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setActivePage('create')}
        >
          <Sparkles size={16} />
          <span>Create Knowledge</span>
        </button>
      </div>

      {error && <Alert type="danger" message={error} />}

      {/* Filter and Search Controls */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Keyword Search */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, summary, topic..."
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          {/* Topic Filter */}
          <div style={{ flex: '0 1 180px' }}>
            <select
              className="form-select"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="">All Topics</option>
              {availableTopics.map((top) => (
                <option key={top} value={top}>{top}</option>
              ))}
            </select>
          </div>

          {/* Tag Filter */}
          <div style={{ flex: '0 1 180px' }}>
            <select
              className="form-select"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              <option value="">All Tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div style={{ flex: '0 1 160px' }}>
            <select
              className="form-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Notes List / Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading knowledge modules...
        </div>
      ) : notes.length === 0 ? (
        <div className="empty-state">
          <BookOpen className="empty-state-icon" />
          <h3 className="empty-state-title">No Knowledge Notes Found</h3>
          <p className="empty-state-desc">
            {searchQuery || selectedTopic || selectedTag
              ? 'No notes matched your search criteria. Try adjusting your filters.'
              : 'Your library is currently empty. Convert a topic, text, or PDF into structured knowledge.'}
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setActivePage('create')}
          >
            Create Knowledge Now
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {notes.map((note) => (
            <div 
              key={note.id}
              className="card interactive"
              onClick={() => onOpenNote(note.id)}
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className="badge badge-primary">{note.subject || 'General'}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={12} />
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem', lineHeight: 1.3 }}>
                  {note.title}
                </h3>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {note.summary}
                </p>

                {note.tags && note.tags.length > 0 && (
                  <div className="tag-list" style={{ marginBottom: '1rem' }}>
                    {note.tags.slice(0, 4).map((t) => (
                      <span key={t} className="tag-pill">#{t}</span>
                    ))}
                    {note.tags.length > 4 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>+{note.tags.length - 4}</span>
                    )}
                  </div>
                )}
              </div>

              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <HelpCircle size={14} style={{ color: 'var(--primary)' }} />
                  {note.question_count} questions
                </span>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditNote(note.id);
                    }}
                    title="Edit Note"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={(e) => handleDelete(note.id, note.title, e)}
                    title="Delete Note"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
