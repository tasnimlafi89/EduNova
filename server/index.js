import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { aiService } from './services/ai.service.js';
import { adaptiveService } from './services/adaptive.service.js';
import { connectDB, findOrCreateUser } from './services/db.service.js';
import { clerkAuth, requireSignedIn, getClerkUserId } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Global middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(clerkAuth);                       // Verify Clerk JWT on every request

// File upload config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }  // 10 MB
});

// ── Helper: get profile from DB ─────────────────────────────────
async function loadProfile(req) {
  const clerkId = getClerkUserId(req);
  if (!clerkId) return null;
  const user = await findOrCreateUser(clerkId);
  return { user, profile: user.toProfile() };
}

async function saveUser(user, profile) {
  user.syncFromProfile(profile);
  await user.save();
}

// ================================================================
// AUTH — Clerk handles this, but keep a sync endpoint
// ================================================================
app.post('/api/auth/login', requireSignedIn, async (req, res) => {
  const clerkId = getClerkUserId(req);
  const user = await findOrCreateUser(clerkId, {
    email: req.body.email,
    name: req.body.name,
    imageUrl: req.body.imageUrl
  });
  res.json({ userId: clerkId, name: user.name });
});

// ================================================================
// STUDENT PROFILE
// ================================================================
app.get('/api/student/profile', requireSignedIn, async (req, res) => {
  const data = await loadProfile(req);
  if (!data) return res.status(401).json({ error: 'Unauthorized' });
  res.json(data.profile);
});

// Keep backward-compat with /api/student/:id/profile
app.get('/api/student/:id/profile', requireSignedIn, async (req, res) => {
  const data = await loadProfile(req);
  if (!data) return res.status(401).json({ error: 'Unauthorized' });
  res.json(data.profile);
});

// ================================================================
// TOPIC MANAGEMENT
// ================================================================
app.post('/api/student/:id/topics', requireSignedIn, async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic is required' });

  const data = await loadProfile(req);
  if (!data) return res.status(401).json({ error: 'Unauthorized' });
  const { user, profile } = data;

  const formattedTopic = topic.toLowerCase().replace(/\s+/g, '-');
  if (!profile.currentRoadmap.includes(formattedTopic)) {
    profile.currentRoadmap.push(formattedTopic);
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

  await saveUser(user, profile);
  res.json({ success: true, roadmap: profile.currentRoadmap });
});

// ================================================================
// AI EXERCISES
// ================================================================
app.post('/api/exercises/generate', requireSignedIn, async (req, res) => {
  const { topic, level, type, history } = req.body;
  if (!topic || !level || !type) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  const exercise = await aiService.generateExercise(topic, level, type, history);
  exercise.generatedAt = Date.now();
  res.json(exercise);
});

app.post('/api/exercises/evaluate', requireSignedIn, async (req, res) => {
  const { question, studentAnswer, topic, level, responseTimeMs, difficulty } = req.body;
  if (!question || !studentAnswer) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const evaluation = await aiService.evaluateAnswer(question, studentAnswer, topic, level);

  const data = await loadProfile(req);
  if (data) {
    const { user, profile } = data;
    const result = adaptiveService.recordAttempt(
      profile, topic, question, evaluation.isCorrect,
      responseTimeMs || 0, difficulty || level
    );
    evaluation.weightedScore = result.weightedScore;
    await saveUser(user, profile);
  }

  res.json(evaluation);
});

// ================================================================
// SESSION MANAGEMENT
// ================================================================
app.post('/api/student/:id/session/start', requireSignedIn, async (req, res) => {
  const { topic } = req.body;
  const data = await loadProfile(req);
  if (!data) return res.status(401).json({ error: 'Unauthorized' });
  const { user, profile } = data;

  if (!profile.sessionTimers) profile.sessionTimers = {};
  profile.sessionTimers[topic] = {
    ...(profile.sessionTimers[topic] || { totalMs: 0 }),
    startedAt: Date.now()
  };

  await saveUser(user, profile);
  res.json({ success: true, startedAt: Date.now() });
});

app.post('/api/student/:id/session/complete', requireSignedIn, async (req, res) => {
  const { topic, correctCount, totalQuestions } = req.body;
  const data = await loadProfile(req);
  if (!data) return res.status(401).json({ error: 'Unauthorized' });
  const { user, profile } = data;

  // Track session time
  if (profile.sessionTimers?.[topic]?.startedAt) {
    const elapsed = Date.now() - profile.sessionTimers[topic].startedAt;
    profile.sessionTimers[topic].totalMs = (profile.sessionTimers[topic].totalMs || 0) + elapsed;
    profile.sessionTimers[topic].startedAt = null;
  }

  let subject = profile.subjects.find(s => s.id === topic);
  if (!subject) {
    subject = {
      id: topic,
      name: topic.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      level: 1,
      masteryScore: 0
    };
    profile.subjects.push(subject);
  }

  let leveledUp = false;
  let oldLevel = subject.level;
  let newLevel = subject.level;

  if (profile.topicStats?.[topic]) {
    const stat = profile.topicStats[topic];
    subject.masteryScore = stat.accuracy;

    if (stat.accuracy >= 100 && subject.level < 3) {
      subject.level += 1;
      stat.level = subject.level;
      leveledUp = true;
      newLevel = subject.level;

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

  if (profile.streak >= 7 && !profile.badges.find(b => b.id === 'streak-7')) {
    profile.badges.push({ id: 'streak-7', name: 'Week Warrior', icon: 'local_fire_department', earnedAt: new Date() });
  }

  const feedback = adaptiveService.generateFeedback(profile, topic);

  await saveUser(user, profile);
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

// ================================================================
// AI CHAT
// ================================================================
app.post('/api/chat/message', requireSignedIn, async (req, res) => {
  const { message, context, history } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  let enrichedContext = context || { topic: 'General', level: 1, recentScores: [] };
  const data = await loadProfile(req);
  if (data) {
    const recommendation = adaptiveService.getAdaptiveRecommendation(data.profile);
    enrichedContext = {
      ...enrichedContext,
      weakAreas: recommendation?.reason || 'none detected',
      weakTopic: recommendation?.topicId || null,
      studentTopics: data.profile.currentRoadmap,
    };
  }

  const reply = await aiService.tutorReply(enrichedContext, history || [], message);
  res.json({ reply });
});

// ================================================================
// PROGRESS
// ================================================================
app.get('/api/progress/:studentId', requireSignedIn, async (req, res) => {
  const data = await loadProfile(req);
  if (!data) return res.status(401).json({ error: 'Unauthorized' });
  const analytics = adaptiveService.getProgressAnalytics(data.profile);
  res.json({ studentId: data.profile.id, ...analytics });
});

// ================================================================
// TASKS
// ================================================================
app.get('/api/student/:id/tasks', requireSignedIn, async (req, res) => {
  const data = await loadProfile(req);
  if (!data) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ tasks: data.profile.tasks || [] });
});

app.post('/api/student/:id/tasks', requireSignedIn, async (req, res) => {
  const { title, category, dueDate } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const data = await loadProfile(req);
  if (!data) return res.status(401).json({ error: 'Unauthorized' });
  const { user, profile } = data;

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

  await saveUser(user, profile);
  res.json({ success: true, task });
});

app.patch('/api/student/:id/tasks/:taskId', requireSignedIn, async (req, res) => {
  const data = await loadProfile(req);
  if (!data) return res.status(401).json({ error: 'Unauthorized' });
  const { user, profile } = data;

  const task = profile.tasks.find(t => t.id === req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (req.body.title !== undefined) task.title = req.body.title;
  if (req.body.category !== undefined) task.category = req.body.category;
  if (req.body.isCompleted !== undefined) {
    task.isCompleted = req.body.isCompleted;
    if (task.isCompleted) task.completedAt = new Date();
  }
  if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;

  await saveUser(user, profile);
  res.json({ success: true, task });
});

app.delete('/api/student/:id/tasks/:taskId', requireSignedIn, async (req, res) => {
  const data = await loadProfile(req);
  if (!data) return res.status(401).json({ error: 'Unauthorized' });
  const { user, profile } = data;

  profile.tasks = profile.tasks.filter(t => t.id !== req.params.taskId);
  await saveUser(user, profile);
  res.json({ success: true });
});

// ================================================================
// FILE UPLOAD & MATERIALS
// ================================================================
app.post('/api/student/:id/upload', requireSignedIn, upload.single('material'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const data = await loadProfile(req);
  if (!data) return res.status(401).json({ error: 'Unauthorized' });
  const { user, profile } = data;

  let textContent = '';
  try {
    textContent = req.file.buffer.toString('utf8').substring(0, 5000);
  } catch {
    textContent = `Content of ${req.file.originalname} (binary file)`;
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
  profile.activityLog.push({
    type: 'upload',
    topicId: material.topicId,
    timestamp: new Date(),
    questionPreview: `Uploaded: ${req.file.originalname}`
  });

  await saveUser(user, profile);
  res.json({ success: true, material });
});

app.get('/api/student/:id/materials', requireSignedIn, async (req, res) => {
  const data = await loadProfile(req);
  if (!data) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ materials: data.profile.materials || [] });
});

// ================================================================
// BADGES
// ================================================================
app.get('/api/student/:id/badges', requireSignedIn, async (req, res) => {
  const data = await loadProfile(req);
  if (!data) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ badges: data.profile.badges || [] });
});

// ================================================================
// ONBOARDING
// ================================================================
app.post('/api/onboarding/evaluate', (req, res) => {
  res.json({ initialLevel: 2, assignedRoadmap: ['intro-quantum', 'wave-particle'] });
});

// ================================================================
// START SERVER
// ================================================================
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 EduNova API running on port ${PORT}`);
  });
}

startServer();
