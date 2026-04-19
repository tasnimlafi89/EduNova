const API_URL = 'http://localhost:5000/api';

export const api = {
  // Auth
  login: async () => {
    const res = await fetch(`${API_URL}/auth/login`, { method: 'POST' });
    return res.json();
  },

  // Profile
  getProfile: async (studentId) => {
    const res = await fetch(`${API_URL}/student/${studentId}/profile`);
    return res.json();
  },

  // Topics
  addTopic: async (studentId, topic) => {
    const res = await fetch(`${API_URL}/student/${studentId}/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });
    return res.json();
  },

  // Exercises
  generateExercise: async (topic, level, type, history = []) => {
    const res = await fetch(`${API_URL}/exercises/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, level, type, history })
    });
    return res.json();
  },

  evaluateAnswer: async (question, studentAnswer, topic, level, studentId, responseTimeMs = 0, difficulty = 1) => {
    const res = await fetch(`${API_URL}/exercises/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, studentAnswer, topic, level, studentId, responseTimeMs, difficulty })
    });
    return res.json();
  },

  // Sessions
  startSession: async (studentId, topic) => {
    const res = await fetch(`${API_URL}/student/${studentId}/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });
    return res.json();
  },

  completeSession: async (studentId, topic, correctCount, totalQuestions) => {
    const res = await fetch(`${API_URL}/student/${studentId}/session/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, correctCount, totalQuestions })
    });
    return res.json();
  },

  // Chat
  chatMessage: async (message, context, history, studentId = 'user-1') => {
    const res = await fetch(`${API_URL}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context, history, studentId })
    });
    return res.json();
  },

  // Progress (real data)
  getProgress: async (studentId) => {
    const res = await fetch(`${API_URL}/progress/${studentId}`);
    return res.json();
  },

  // Tasks / Todo
  getTasks: async (studentId) => {
    const res = await fetch(`${API_URL}/student/${studentId}/tasks`);
    return res.json();
  },

  createTask: async (studentId, title, category = 'GENERAL', dueDate = null) => {
    const res = await fetch(`${API_URL}/student/${studentId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, dueDate })
    });
    return res.json();
  },

  updateTask: async (studentId, taskId, updates) => {
    const res = await fetch(`${API_URL}/student/${studentId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  deleteTask: async (studentId, taskId) => {
    const res = await fetch(`${API_URL}/student/${studentId}/tasks/${taskId}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // File Upload
  uploadMaterial: async (studentId, file, topic) => {
    const formData = new FormData();
    formData.append('material', file);
    formData.append('topic', topic);
    
    const res = await fetch(`${API_URL}/student/${studentId}/upload`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  getMaterials: async (studentId) => {
    const res = await fetch(`${API_URL}/student/${studentId}/materials`);
    return res.json();
  },

  // Badges
  getBadges: async (studentId) => {
    const res = await fetch(`${API_URL}/student/${studentId}/badges`);
    return res.json();
  },

  // Onboarding
  evaluateOnboarding: async (answers) => {
    const res = await fetch(`${API_URL}/onboarding/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });
    return res.json();
  }
};
