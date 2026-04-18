const API_URL = 'http://localhost:5000/api';

export const api = {
  // Mock login to just go to dashboard
  login: async () => {
    const res = await fetch(`${API_URL}/auth/login`, { method: 'POST' });
    return res.json();
  },

  getProfile: async (studentId) => {
    const res = await fetch(`${API_URL}/student/${studentId}/profile`);
    return res.json();
  },

  addTopic: async (studentId, topic) => {
    const res = await fetch(`${API_URL}/student/${studentId}/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });
    return res.json();
  },

  generateExercise: async (topic, level, type) => {
    const res = await fetch(`${API_URL}/exercises/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, level, type })
    });
    return res.json();
  },

  evaluateAnswer: async (question, studentAnswer, topic, level, studentId) => {
    const res = await fetch(`${API_URL}/exercises/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, studentAnswer, topic, level, studentId })
    });
    return res.json();
  },

  chatMessage: async (message, context, history) => {
    const res = await fetch(`${API_URL}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context, history })
    });
    return res.json();
  },

  getProgress: async (studentId) => {
    const res = await fetch(`${API_URL}/progress/${studentId}`);
    return res.json();
  },

  evaluateOnboarding: async (answers) => {
    const res = await fetch(`${API_URL}/onboarding/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });
    return res.json();
  }
};
