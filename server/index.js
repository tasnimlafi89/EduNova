import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { aiService } from './services/ai.service.js';
import { adaptiveService } from './services/adaptive.service.js';

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
  const { question, studentAnswer, topic, level, studentId } = req.body;
  if (!question || !studentAnswer) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const evaluation = await aiService.evaluateAnswer(question, studentAnswer, topic, level);
  
  if (studentId && mockProfiles[studentId]) {
    // Record attempt for knowledge tracking
    adaptiveService.recordAttempt(mockProfiles[studentId], topic, question, evaluation.isCorrect);
  }

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

  // Update masteryScore based on the new adaptive logic (which stores accuracy in topicStats)
  let leveledUp = false;
  let oldLevel = subject.level;
  let newLevel = subject.level;

  if (profile.topicStats && profile.topicStats[topic]) {
    const stat = profile.topicStats[topic];
    subject.masteryScore = stat.accuracy; // Sync accuracy to masteryScore
    
    // Level up logic remains intact but utilizes new accuracy
    if (stat.accuracy >= 100 && subject.level < 3) {
      subject.level += 1;
      stat.level = subject.level;
      leveledUp = true;
      newLevel = subject.level;
    }
  } else {
    // Fallback if no questions were actually evaluated
    const sessionPercentage = (correctCount / totalQuestions) * 100;
    subject.masteryScore = Math.min(100, Math.round(sessionPercentage));
  }

  const getLevelName = (lvl) => {
    if (lvl === 1) return 'Beginner';
    if (lvl === 2) return 'Intermediate';
    return 'Advanced';
  };

  // Generate personalized feedback
  const feedback = adaptiveService.generateFeedback(profile, topic);

  res.json({
    success: true,
    masteryScore: subject.masteryScore,
    leveledUp,
    oldLevelName: getLevelName(oldLevel),
    newLevelName: getLevelName(newLevel),
    feedback
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
