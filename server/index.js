import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { aiService } from './services/ai.service.js';
import { adaptiveService } from './services/adaptive.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// File upload config
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ==========================================
// AUTH
// ==========================================
app.post('/api/auth/register', (req, res) => {
  res.json({ message: 'User registered successfully (Mock)' });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ token: 'mock-token-123', userId: 'user-1' });
});

// ==========================================
// STUDENT PROFILES (in-memory mock)
// ==========================================
const mockProfiles = {
  'user-1': {
    id: 'user-1',
    subjects: [],
    currentRoadmap: [],
    streak: 5,
    lastActiveAt: new Date(),
    // Enhanced tracking fields
    questionStats: {},
    topicStats: {},
    activityLog: [],
    sessionTimers: {},
    tasks: [],
    materials: [],
    badges: [
      { id: 'first-login', name: 'First Steps', icon: 'rocket_launch', earnedAt: new Date() }
    ],
    notifications: []
  }
};

app.get('/api/student/:id/profile', (req, res) => {
  const profile = mockProfiles[req.params.id] || mockProfiles['user-1'];
  res.json(profile);
});

// ==========================================
// TOPIC MANAGEMENT
// ==========================================
app.post('/api/student/:id/topics', (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }
  const profile = mockProfiles[req.params.id] || mockProfiles['user-1'];
  const formattedTopic = topic.toLowerCase().replace(/\s+/g, '-');
  if (!profile.currentRoadmap.includes(formattedTopic)) {
    profile.currentRoadmap.push(formattedTopic);
    // Auto-create a study task
    profile.tasks.push({
      id: `task-${Date.now()}`,
      title: `Start studying: ${topic}`,
      category: 'STUDY',
      isCompleted: false,
      createdAt: new Date(),
      dueDate: new Date(Date.now() + 86400000),
      notificationSent: false
    });
  }
  res.json({ success: true, roadmap: profile.currentRoadmap });
});

// ==========================================
// AI EXERCISES (enhanced with response time tracking)
// ==========================================
app.post('/api/exercises/generate', async (req, res) => {
  const { topic, level, type, history } = req.body;
  if (!topic || !level || !type) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  const exercise = await aiService.generateExercise(topic, level, type, history);
  // Attach timestamp so frontend can compute response time
  exercise.generatedAt = Date.now();
  res.json(exercise);
});

app.post('/api/exercises/evaluate', async (req, res) => {
  const { question, studentAnswer, topic, level, studentId, responseTimeMs, difficulty } = req.body;
  if (!question || !studentAnswer) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const evaluation = await aiService.evaluateAnswer(question, studentAnswer, topic, level);
  
  if (studentId && mockProfiles[studentId]) {
    const result = adaptiveService.recordAttempt(
      mockProfiles[studentId], 
      topic, 
      question, 
      evaluation.isCorrect, 
      responseTimeMs || 0,
      difficulty || level
    );
    evaluation.weightedScore = result.weightedScore;
  }

  res.json(evaluation);
});

// ==========================================
// SESSION MANAGEMENT
// ==========================================
app.post('/api/student/:id/session/start', (req, res) => {
  const { topic } = req.body;
  const profile = mockProfiles[req.params.id] || mockProfiles['user-1'];
  
  if (!profile.sessionTimers) profile.sessionTimers = {};
  profile.sessionTimers[topic] = {
    ...(profile.sessionTimers[topic] || { totalMs: 0 }),
    startedAt: Date.now()
  };
  
  res.json({ success: true, startedAt: Date.now() });
});

app.post('/api/student/:id/session/complete', (req, res) => {
  const { topic, correctCount, totalQuestions } = req.body;
  const profile = mockProfiles[req.params.id] || mockProfiles['user-1'];
  
  // Track session time
  if (profile.sessionTimers && profile.sessionTimers[topic] && profile.sessionTimers[topic].startedAt) {
    const elapsed = Date.now() - profile.sessionTimers[topic].startedAt;
    profile.sessionTimers[topic].totalMs = (profile.sessionTimers[topic].totalMs || 0) + elapsed;
    profile.sessionTimers[topic].startedAt = null;
  }

  let subject = profile.subjects.find(s => s.id === topic);
  if (!subject) {
    subject = { id: topic, name: topic.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), level: 1, masteryScore: 0 };
    profile.subjects.push(subject);
  }

  let leveledUp = false;
  let oldLevel = subject.level;
  let newLevel = subject.level;

  if (profile.topicStats && profile.topicStats[topic]) {
    const stat = profile.topicStats[topic];
    subject.masteryScore = stat.accuracy;
    
    if (stat.accuracy >= 100 && subject.level < 3) {
      subject.level += 1;
      stat.level = subject.level;
      leveledUp = true;
      newLevel = subject.level;
      
      // Award badge on level up
      const badgeId = `level-${newLevel}-${topic}`;
      if (!profile.badges.find(b => b.id === badgeId)) {
        profile.badges.push({
          id: badgeId,
          name: `${getLevelName(newLevel)} in ${topic.replace(/-/g, ' ')}`,
          icon: newLevel === 3 ? 'military_tech' : 'school',
          earnedAt: new Date()
        });
      }
    }
  } else {
    const sessionPercentage = (correctCount / totalQuestions) * 100;
    subject.masteryScore = Math.min(100, Math.round(sessionPercentage));
  }

  // Update streak
  const today = new Date().toDateString();
  if (profile.lastActiveAt && new Date(profile.lastActiveAt).toDateString() !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (new Date(profile.lastActiveAt).toDateString() === yesterday.toDateString()) {
      profile.streak = (profile.streak || 0) + 1;
    } else {
      profile.streak = 1;
    }
  }
  profile.lastActiveAt = new Date();

  // Check streak badges
  if (profile.streak >= 7 && !profile.badges.find(b => b.id === 'streak-7')) {
    profile.badges.push({ id: 'streak-7', name: 'Week Warrior', icon: 'local_fire_department', earnedAt: new Date() });
  }

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

function getLevelName(lvl) {
  if (lvl === 1) return 'Beginner';
  if (lvl === 2) return 'Intermediate';
  return 'Advanced';
}

// ==========================================
// AI CHAT (enhanced with context injection)
// ==========================================
app.post('/api/chat/message', async (req, res) => {
  const { studentId, message, context, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Inject adaptive context if we have a profile
  let enrichedContext = context || { topic: 'General', level: 1, recentScores: [] };
  if (studentId && mockProfiles[studentId]) {
    const profile = mockProfiles[studentId];
    const recommendation = adaptiveService.getAdaptiveRecommendation(profile);
    enrichedContext = {
      ...enrichedContext,
      weakAreas: recommendation?.reason || 'none detected',
      weakTopic: recommendation?.topicId || null,
      studentTopics: profile.currentRoadmap,
    };
  }

  const reply = await aiService.tutorReply(enrichedContext, history || [], message);
  res.json({ reply });
});

// ==========================================
// REAL PROGRESS (powered by adaptive service)
// ==========================================
app.get('/api/progress/:studentId', (req, res) => {
  const profile = mockProfiles[req.params.studentId] || mockProfiles['user-1'];
  const analytics = adaptiveService.getProgressAnalytics(profile);
  
  res.json({
    studentId: req.params.studentId,
    ...analytics
  });
});

// ==========================================
// TODO / TASK MANAGEMENT
// ==========================================
app.get('/api/student/:id/tasks', (req, res) => {
  const profile = mockProfiles[req.params.id] || mockProfiles['user-1'];
  if (!profile.tasks) profile.tasks = [];
  res.json({ tasks: profile.tasks });
});

app.post('/api/student/:id/tasks', (req, res) => {
  const { title, category, dueDate } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  
  const profile = mockProfiles[req.params.id] || mockProfiles['user-1'];
  if (!profile.tasks) profile.tasks = [];
  
  const task = {
    id: `task-${Date.now()}`,
    title,
    category: category || 'GENERAL',
    isCompleted: false,
    createdAt: new Date(),
    dueDate: dueDate ? new Date(dueDate) : null,
    notificationSent: false
  };
  
  profile.tasks.push(task);
  res.json({ success: true, task });
});

app.patch('/api/student/:id/tasks/:taskId', (req, res) => {
  const profile = mockProfiles[req.params.id] || mockProfiles['user-1'];
  const task = (profile.tasks || []).find(t => t.id === req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  
  if (req.body.title !== undefined) task.title = req.body.title;
  if (req.body.category !== undefined) task.category = req.body.category;
  if (req.body.isCompleted !== undefined) {
    task.isCompleted = req.body.isCompleted;
    if (task.isCompleted) task.completedAt = new Date();
  }
  if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
  
  res.json({ success: true, task });
});

app.delete('/api/student/:id/tasks/:taskId', (req, res) => {
  const profile = mockProfiles[req.params.id] || mockProfiles['user-1'];
  profile.tasks = (profile.tasks || []).filter(t => t.id !== req.params.taskId);
  res.json({ success: true });
});

// ==========================================
// FILE UPLOAD & MATERIALS
// ==========================================
app.post('/api/student/:id/upload', upload.single('material'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const profile = mockProfiles[req.params.id] || mockProfiles['user-1'];
  if (!profile.materials) profile.materials = [];
  
  // Extract text from the file (simplified — in production use pdf-parse)
  let textContent = '';
  try {
    textContent = req.file.buffer.toString('utf8').substring(0, 5000);
  } catch {
    textContent = `Content of ${req.file.originalname} (binary file — needs pdf-parse for proper extraction)`;
  }

  const summary = await aiService.summarizeText(textContent, req.body.topic || 'General');
  
  const material = {
    id: `mat-${Date.now()}`,
    filename: req.file.originalname,
    topicId: req.body.topic || 'general',
    summary,
    uploadDate: new Date(),
    size: req.file.size,
    status: 'PROCESSED'
  };
  
  profile.materials.push(material);
  
  // Log activity
  if (!profile.activityLog) profile.activityLog = [];
  profile.activityLog.push({
    type: 'upload',
    topicId: material.topicId,
    timestamp: new Date(),
    questionPreview: `Uploaded: ${req.file.originalname}`
  });
  
  res.json({ success: true, material });
});

app.get('/api/student/:id/materials', (req, res) => {
  const profile = mockProfiles[req.params.id] || mockProfiles['user-1'];
  res.json({ materials: profile.materials || [] });
});

// ==========================================
// BADGES & GAMIFICATION
// ==========================================
app.get('/api/student/:id/badges', (req, res) => {
  const profile = mockProfiles[req.params.id] || mockProfiles['user-1'];
  res.json({ badges: profile.badges || [] });
});

// ==========================================
// ONBOARDING
// ==========================================
app.post('/api/onboarding/evaluate', (req, res) => {
  res.json({ initialLevel: 2, assignedRoadmap: ['intro-quantum', 'wave-particle'] });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
