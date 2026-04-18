import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { aiService } from './services/ai.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Auth
app.post('/api/auth/register', (req, res) => {
  res.json({ message: 'User registered successfully (Mock)' });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ token: 'mock-token-123', userId: 'user-1' });
});

// Student Profile
app.get('/api/student/:id/profile', (req, res) => {
  res.json({
    id: req.params.id,
    subjects: [
      { id: 'math', name: 'Mathematics', level: 2, masteryScore: 40 }
    ],
    currentRoadmap: ['topic-1', 'topic-2'],
    streak: 5,
    lastActiveAt: new Date()
  });
});

// AI Exercises
app.post('/api/exercises/generate', async (req, res) => {
  const { topic, level, type } = req.body;
  if (!topic || !level || !type) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const exercise = await aiService.generateExercise(topic, level, type);
  res.json(exercise);
});

app.post('/api/exercises/evaluate', async (req, res) => {
  const { question, studentAnswer, topic, level } = req.body;
  if (!question || !studentAnswer) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const evaluation = await aiService.evaluateAnswer(question, studentAnswer, topic, level);
  res.json(evaluation);
});

// AI Chat
app.post('/api/chat/message', async (req, res) => {
  const { studentId, message, context, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const reply = await aiService.tutorReply(context || { topic: 'General', level: 1, recentScores: [] }, history || [], message);
  res.json({ reply });
});

app.get('/api/progress/:studentId', (req, res) => {
  res.json({
    studentId: req.params.studentId,
    mastery: 75,
    timeSpent: '12h 30m',
    weakZones: ['Quantum Entanglement']
  });
});

app.post('/api/onboarding/evaluate', (req, res) => {
  res.json({ initialLevel: 2, assignedRoadmap: ['intro-quantum', 'wave-particle'] });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
