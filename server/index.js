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
const mockProfiles = {
  'user-1': {
    id: 'user-1',
    subjects: [
      { id: 'math', name: 'Mathematics', level: 2, masteryScore: 40 }
    ],
    currentRoadmap: ['topic-1', 'topic-2'],
    streak: 5,
    lastActiveAt: new Date()
  }
};

app.get('/api/student/:id/profile', (req, res) => {
  const profile = mockProfiles[req.params.id] || mockProfiles['user-1'];
  res.json(profile);
});

app.post('/api/student/:id/topics', (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }
  const profile = mockProfiles[req.params.id] || mockProfiles['user-1'];
  // Formatting topic to match existing style (kebab-case)
  const formattedTopic = topic.toLowerCase().replace(/\s+/g, '-');
  if (!profile.currentRoadmap.includes(formattedTopic)) {
    profile.currentRoadmap.push(formattedTopic);
  }
  res.json({ success: true, roadmap: profile.currentRoadmap });
});

// AI Exercises
app.post('/api/exercises/generate', async (req, res) => {
  const { topic, level, type, history } = req.body;
  if (!topic || !level || !type) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const exercise = await aiService.generateExercise(topic, level, type, history);
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

app.post('/api/student/:id/session/complete', (req, res) => {
  const { topic, correctCount, totalQuestions } = req.body;
  const profile = mockProfiles[req.params.id] || mockProfiles['user-1'];
  
  let subject = profile.subjects.find(s => s.id === topic);
  if (!subject) {
    subject = { id: topic, name: topic.replace('-', ' ').toUpperCase(), level: 1, masteryScore: 0 };
    profile.subjects.push(subject);
  }

  const sessionPercentage = (correctCount / totalQuestions) * 100;
  // Add 40% of the session score to mastery so users can level up after a few good sessions
  const masteryGained = Math.round(sessionPercentage * 0.4); 
  
  subject.masteryScore += masteryGained;

  let leveledUp = false;
  let oldLevel = subject.level;
  let newLevel = subject.level;

  if (subject.masteryScore >= 100) {
    if (subject.level < 3) {
      subject.masteryScore = 0;
      subject.level += 1;
      leveledUp = true;
      newLevel = subject.level;
    } else {
      subject.masteryScore = 100; // maxed out at Advanced 100%
    }
  }

  const getLevelName = (lvl) => {
    if (lvl === 1) return 'Beginner';
    if (lvl === 2) return 'Intermediate';
    return 'Advanced';
  };

  res.json({
    success: true,
    masteryScore: subject.masteryScore,
    leveledUp,
    oldLevelName: getLevelName(oldLevel),
    newLevelName: getLevelName(newLevel)
  });
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
