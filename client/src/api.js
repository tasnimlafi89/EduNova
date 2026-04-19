const API_URL = 'http://localhost:5000/api';

// ── Token store ─────────────────────────────────────────────
// The Clerk token is set by the AuthProvider on mount
let _getToken = null;

export function setTokenGetter(fn) {
  _getToken = fn;
}

async function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (_getToken) {
    try {
      const token = await _getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch { /* no-op if not signed in */ }
  }
  return headers;
}

async function authFetch(url, options = {}) {
  const headers = await authHeaders();
  // For FormData (file uploads), don't set Content-Type — browser will set it
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }
  const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  if (res.status === 401) {
    // Token expired or user not signed in
    console.warn('Authentication required');
  }
  return res.json();
}

// ── API methods ─────────────────────────────────────────────

export const api = {
  // Profile (uses the authenticated user — no ID needed)
  getProfile: () => authFetch(`${API_URL}/student/profile`),

  // Backward-compatible profile (the :id is ignored server-side, Clerk ID is used)
  getProfileById: (studentId) => authFetch(`${API_URL}/student/${studentId}/profile`),

  // Topics
  addTopic: (studentId, topic) =>
    authFetch(`${API_URL}/student/${studentId}/topics`, {
      method: 'POST',
      body: JSON.stringify({ topic })
    }),

  // Exercises
  generateExercise: (topic, level, type, history = []) =>
    authFetch(`${API_URL}/exercises/generate`, {
      method: 'POST',
      body: JSON.stringify({ topic, level, type, history })
    }),

  evaluateAnswer: (question, studentAnswer, topic, level, studentId, responseTimeMs = 0, difficulty = 1) =>
    authFetch(`${API_URL}/exercises/evaluate`, {
      method: 'POST',
      body: JSON.stringify({ question, studentAnswer, topic, level, responseTimeMs, difficulty })
    }),

  // Sessions
  startSession: (studentId, topic) =>
    authFetch(`${API_URL}/student/${studentId}/session/start`, {
      method: 'POST',
      body: JSON.stringify({ topic })
    }),

  completeSession: (studentId, topic, correctCount, totalQuestions) =>
    authFetch(`${API_URL}/student/${studentId}/session/complete`, {
      method: 'POST',
      body: JSON.stringify({ topic, correctCount, totalQuestions })
    }),

  // Chat
  chatMessage: (message, context, history, studentId = '') =>
    authFetch(`${API_URL}/chat/message`, {
      method: 'POST',
      body: JSON.stringify({ message, context, history })
    }),

  // Progress
  getProgress: (studentId) => authFetch(`${API_URL}/progress/${studentId}`),

  // Tasks
  getTasks: (studentId) => authFetch(`${API_URL}/student/${studentId}/tasks`),

  createTask: (studentId, title, category = 'GENERAL', dueDate = null) =>
    authFetch(`${API_URL}/student/${studentId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ title, category, dueDate })
    }),

  updateTask: (studentId, taskId, updates) =>
    authFetch(`${API_URL}/student/${studentId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),

  deleteTask: (studentId, taskId) =>
    authFetch(`${API_URL}/student/${studentId}/tasks/${taskId}`, {
      method: 'DELETE'
    }),

  // File Upload
  uploadMaterial: async (studentId, file, topic) => {
    const formData = new FormData();
    formData.append('material', file);
    formData.append('topic', topic);
    return authFetch(`${API_URL}/student/${studentId}/upload`, {
      method: 'POST',
      body: formData
    });
  },

  getMaterials: (studentId) => authFetch(`${API_URL}/student/${studentId}/materials`),

  // Badges
  getBadges: (studentId) => authFetch(`${API_URL}/student/${studentId}/badges`),

  // Onboarding
  evaluateOnboarding: (answers) =>
    authFetch(`${API_URL}/onboarding/evaluate`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    }),

  // Auth sync — called after Clerk sign-in to create/update the DB profile
  syncUser: (email, name, imageUrl) =>
    authFetch(`${API_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, name, imageUrl })
    })
};
