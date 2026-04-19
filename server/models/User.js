import mongoose from 'mongoose';

// ── Sub-schemas ─────────────────────────────────────────────────

const questionStatSchema = new mongoose.Schema({
  topicId:      { type: String, required: true },
  questionText: { type: String, required: true },
  questionKey:  { type: String, required: true },
  attempts:     { type: Number, default: 0 },
  correct:      { type: Number, default: 0 },
  difficulty:   { type: Number, default: 1 },
  lastAttempt:  { type: Date },
  nextReview:   { type: Date }
}, { _id: false });

const topicHistoryEntry = new mongoose.Schema({
  accuracy:      { type: Number },
  weightedScore: { type: Number },
  timestamp:     { type: Date, default: Date.now }
}, { _id: false });

const topicStatSchema = new mongoose.Schema({
  topicId:       { type: String, required: true },
  totalAttempts: { type: Number, default: 0 },
  totalCorrect:  { type: Number, default: 0 },
  accuracy:      { type: Number, default: 0 },
  weightedScore: { type: Number, default: 0 },
  level:         { type: Number, default: 1 },
  lastAttempt:   { type: Date },
  history:       [topicHistoryEntry]
}, { _id: false });

const subjectSchema = new mongoose.Schema({
  id:           { type: String, required: true },
  name:         { type: String, required: true },
  level:        { type: Number, default: 1 },
  masteryScore: { type: Number, default: 0 }
}, { _id: false });

const activitySchema = new mongoose.Schema({
  type:            { type: String, enum: ['exercise', 'upload', 'chat'], default: 'exercise' },
  topicId:         { type: String },
  isCorrect:       { type: Boolean },
  score:           { type: Number },
  questionPreview: { type: String },
  timestamp:       { type: Date, default: Date.now }
}, { _id: false });

const sessionTimerSchema = new mongoose.Schema({
  topicId:   { type: String, required: true },
  totalMs:   { type: Number, default: 0 },
  startedAt: { type: Number, default: null }   // epoch ms or null
}, { _id: false });

const taskSchema = new mongoose.Schema({
  id:               { type: String, required: true },
  title:            { type: String, required: true },
  category:         { type: String, enum: ['STUDY', 'REVISION', 'GENERAL'], default: 'GENERAL' },
  isCompleted:      { type: Boolean, default: false },
  completedAt:      { type: Date },
  dueDate:          { type: Date },
  createdAt:        { type: Date, default: Date.now },
  notificationSent: { type: Boolean, default: false }
}, { _id: false });

const materialSchema = new mongoose.Schema({
  id:         { type: String, required: true },
  filename:   { type: String, required: true },
  topicId:    { type: String, default: 'general' },
  summary:    { type: String, default: '' },
  uploadDate: { type: Date, default: Date.now },
  size:       { type: Number, default: 0 },
  status:     { type: String, default: 'PROCESSED' }
}, { _id: false });

const badgeSchema = new mongoose.Schema({
  id:       { type: String, required: true },
  name:     { type: String, required: true },
  icon:     { type: String, default: 'emoji_events' },
  earnedAt: { type: Date, default: Date.now }
}, { _id: false });

// ── Main User schema ────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email:    { type: String, default: '' },
  name:     { type: String, default: 'Navigator' },
  imageUrl: { type: String, default: '' },

  // Learning data
  subjects:       [subjectSchema],
  currentRoadmap: [{ type: String }],
  streak:         { type: Number, default: 0 },
  lastActiveAt:   { type: Date, default: Date.now },

  // Detailed tracking
  questionStats: [questionStatSchema],
  topicStats:    [topicStatSchema],
  activityLog:   [activitySchema],
  sessionTimers: [sessionTimerSchema],

  // Productivity
  tasks:     [taskSchema],
  materials: [materialSchema],

  // Gamification
  badges: [badgeSchema]

}, { timestamps: true });

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Convert the Mongoose document to the flat profile object
 * that the frontend and adaptiveService expect.
 */
userSchema.methods.toProfile = function () {
  const obj = this.toObject({ virtuals: true });

  // Convert topicStats array → object keyed by topicId
  const topicStatsObj = {};
  for (const ts of obj.topicStats || []) {
    topicStatsObj[ts.topicId] = ts;
  }

  // Convert questionStats array → object keyed by questionKey
  const questionStatsObj = {};
  for (const qs of obj.questionStats || []) {
    questionStatsObj[qs.questionKey] = qs;
  }

  // Convert sessionTimers array → object keyed by topicId
  const sessionTimersObj = {};
  for (const st of obj.sessionTimers || []) {
    sessionTimersObj[st.topicId] = { totalMs: st.totalMs, startedAt: st.startedAt };
  }

  return {
    id: obj.clerkId,
    name: obj.name,
    email: obj.email,
    imageUrl: obj.imageUrl,
    subjects: obj.subjects || [],
    currentRoadmap: obj.currentRoadmap || [],
    streak: obj.streak || 0,
    lastActiveAt: obj.lastActiveAt,
    questionStats: questionStatsObj,
    topicStats: topicStatsObj,
    activityLog: obj.activityLog || [],
    sessionTimers: sessionTimersObj,
    tasks: obj.tasks || [],
    materials: obj.materials || [],
    badges: obj.badges || [],
  };
};

/**
 * Sync the flat profile object back into the Mongoose document.
 * Call this after adaptiveService mutates the profile in-memory.
 */
userSchema.methods.syncFromProfile = function (profile) {
  // topicStats object → array
  this.topicStats = Object.entries(profile.topicStats || {}).map(([topicId, ts]) => ({
    topicId,
    ...ts
  }));

  // questionStats object → array
  this.questionStats = Object.entries(profile.questionStats || {}).map(([questionKey, qs]) => ({
    questionKey,
    ...qs
  }));

  // sessionTimers object → array
  this.sessionTimers = Object.entries(profile.sessionTimers || {}).map(([topicId, st]) => ({
    topicId,
    totalMs: st.totalMs || 0,
    startedAt: st.startedAt || null
  }));

  // Direct arrays
  this.subjects = profile.subjects || [];
  this.currentRoadmap = profile.currentRoadmap || [];
  this.activityLog = (profile.activityLog || []).slice(-50);
  this.tasks = profile.tasks || [];
  this.materials = profile.materials || [];
  this.badges = profile.badges || [];
  this.streak = profile.streak || 0;
  this.lastActiveAt = profile.lastActiveAt || new Date();
};

export const User = mongoose.model('User', userSchema);
