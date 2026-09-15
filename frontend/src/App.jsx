import React, { useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import KnowledgeLibraryPage from './pages/KnowledgeLibraryPage';
import CreateKnowledgePage from './pages/CreateKnowledgePage';
import NoteDetailPage from './pages/NoteDetailPage';
import QuizConfigPage from './pages/QuizConfigPage';
import QuizAttemptPage from './pages/QuizAttemptPage';
import QuizResultPage from './pages/QuizResultPage';
import ProgressPage from './pages/ProgressPage';
import RevisionPage from './pages/RevisionPage';
import SettingsPage from './pages/SettingsPage';
import { api } from './services/api';

function AppContent() {
  const { user, loading } = useAuth();

  // Navigation state
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [activePage, setActivePage] = useState('dashboard');
  
  // Specific entity states
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [activeQuizSession, setActiveQuizSession] = useState(null);
  const [activeQuizResult, setActiveQuizResult] = useState(null);
  const [preselectedTopic, setPreselectedTopic] = useState(null);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="brand-icon" style={{ width: '56px', height: '56px', margin: '0 auto 1rem auto' }}>
            🎓
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>Loading LearnNote AI...</h2>
        </div>
      </div>
    );
  }

  // If unauthenticated, show Login or Register
  if (!user) {
    if (authView === 'register') {
      return <RegisterPage onNavigateLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onNavigateRegister={() => setAuthView('register')} />;
  }

  // Handler helpers
  const handleOpenNote = (noteId) => {
    setSelectedNoteId(noteId);
    setActivePage('note-detail');
  };

  const handleStartQuizTopic = (topicName) => {
    setPreselectedTopic(topicName);
    setActivePage('quiz');
  };

  const handleQuizStarted = (session) => {
    setActiveQuizSession(session);
    setActivePage('quiz-attempt');
  };

  const handleQuizCompleted = (result) => {
    setActiveQuizResult(result);
    setActiveQuizSession(null);
    setActivePage('quiz-result');
  };

  const handleReviewPastQuiz = async (attemptId) => {
    try {
      const result = await api.quiz.getResult(attemptId);
      setActiveQuizResult(result);
      setActivePage('quiz-result');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {activePage === 'dashboard' && (
        <DashboardPage 
          setActivePage={setActivePage} 
          onOpenNote={handleOpenNote}
          onStartQuizTopic={handleStartQuizTopic}
        />
      )}

      {activePage === 'library' && (
        <KnowledgeLibraryPage 
          onOpenNote={handleOpenNote}
          onEditNote={handleOpenNote}
          setActivePage={setActivePage}
        />
      )}

      {activePage === 'create' && (
        <CreateKnowledgePage 
          onNoteCreated={(newId) => handleOpenNote(newId)}
          setActivePage={setActivePage}
        />
      )}

      {activePage === 'note-detail' && (
        <NoteDetailPage 
          noteId={selectedNoteId}
          onBack={() => setActivePage('library')}
          onStartQuizTopic={handleStartQuizTopic}
        />
      )}

      {activePage === 'quiz' && (
        <QuizConfigPage 
          onQuizStarted={handleQuizStarted}
          defaultTopic={preselectedTopic}
        />
      )}

      {activePage === 'quiz-attempt' && activeQuizSession && (
        <QuizAttemptPage 
          quizSession={activeQuizSession}
          onQuizCompleted={handleQuizCompleted}
          onCancelQuiz={() => setActivePage('quiz')}
        />
      )}

      {activePage === 'quiz-result' && activeQuizResult && (
        <QuizResultPage 
          result={activeQuizResult}
          onRetakeQuiz={() => setActivePage('quiz')}
          onOpenNote={handleOpenNote}
          setActivePage={setActivePage}
        />
      )}

      {activePage === 'progress' && (
        <ProgressPage 
          onReviewQuizResult={handleReviewPastQuiz}
          setActivePage={setActivePage}
        />
      )}

      {activePage === 'revision' && (
        <RevisionPage 
          onOpenNote={handleOpenNote}
          onStartQuizTopic={handleStartQuizTopic}
        />
      )}

      {activePage === 'settings' && (
        <SettingsPage />
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
