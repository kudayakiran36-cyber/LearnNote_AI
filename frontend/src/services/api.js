// LearnNote AI — Frontend API Client

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('learnnote_token');
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If payload is not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type'] && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('learnnote_token');
    localStorage.removeItem('learnnote_user');
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Your session has expired. Please log in again.');
  }

  if (response.status === 204) {
    return null;
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data?.detail || (typeof data === 'string' ? data : 'An unexpected error occurred.');
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (data) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request('/auth/me'),
  },

  notes: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      if (params.q) query.append('q', params.q);
      if (params.topic) query.append('topic', params.topic);
      if (params.tag) query.append('tag', params.tag);
      if (params.sort) query.append('sort', params.sort);
      const qs = query.toString();
      return request(`/notes${qs ? `?${qs}` : ''}`);
    },
    get: (id) => request(`/notes/${id}`),
    create: (payload) =>
      request('/notes', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id, payload) =>
      request(`/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id) =>
      request(`/notes/${id}`, {
        method: 'DELETE',
      }),
    generatePreview: (payload) =>
      request('/notes/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    uploadFile: (formData) =>
      request('/notes/upload', {
        method: 'POST',
        body: formData,
      }),
    regenerateQuestions: (id) =>
      request(`/notes/${id}/regenerate-questions`, {
        method: 'POST',
      }),
  },

  questions: {
    update: (id, payload) =>
      request(`/questions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id) =>
      request(`/questions/${id}`, {
        method: 'DELETE',
      }),
  },

  quiz: {
    getTopics: () => request('/quiz/topics'),
    start: (payload) =>
      request('/quiz/start', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    submit: (attemptId, payload) =>
      request(`/quiz/${attemptId}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getResult: (attemptId) => request(`/quiz/${attemptId}/result`),
    getHistory: () => request('/quiz/history'),
  },

  progress: {
    get: () => request('/progress'),
  },

  revision: {
    get: (days = 3) => request(`/revision?days=${days}`),
    markReviewed: (noteId) =>
      request(`/revision/${noteId}/mark-reviewed`, {
        method: 'POST',
      }),
  },

  settings: {
    get: () => request('/settings'),
    updatePassword: (payload) =>
      request('/settings/password', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    deleteAccount: () =>
      request('/account', {
        method: 'DELETE',
      }),
  },
};
