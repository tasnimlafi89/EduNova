export const adaptiveService = {
  // ==========================================
  // CORE ALGORITHMS
  // ==========================================

  /**
   * Calculate weighted score:
   * score = (accuracy * 0.6) + (speed * 0.2) + (difficulty_weight * 0.2)
   */
  calculateWeightedScore(isCorrect, responseTimeMs, difficulty = 1) {
    const accuracyScore = isCorrect ? 100 : 0;

    // Speed: 30s is the max. Faster = higher score. Wrong answers get 0 speed credit.
    let speedScore = 0;
    if (isCorrect && responseTimeMs > 0) {
      speedScore = Math.max(0, 100 - ((responseTimeMs / 30000) * 100));
    }

    // Difficulty weight: normalize 1-3 to 0-100
    const difficultyWeight = ((difficulty || 1) / 3) * 100;

    const weighted = (accuracyScore * 0.6) + (speedScore * 0.2) + (difficultyWeight * 0.2);
    return Math.round(Math.min(100, Math.max(0, weighted)));
  },

  /**
   * Calculate accuracy percentage
   */
  computeAccuracy(correct, attempts) {
    if (attempts === 0) return 0;
    return Math.round((correct / attempts) * 100);
  },

  /**
   * Classify knowledge level based on accuracy
   * 0-40% -> Beginner (1)
   * 40-70% -> Intermediate (2)
   * 70-100% -> Advanced (3)
   */
  classifyLevel(accuracy) {
    if (accuracy < 40) return 1;
    if (accuracy < 70) return 2;
    return 3;
  },

  /**
   * Confidence estimation: how "reliable" is the student's score?
   * Based on number of attempts and consistency.
   */
  estimateConfidence(topicStat) {
    if (!topicStat || topicStat.totalAttempts < 3) return 'low';
    
    const history = topicStat.history || [];
    if (history.length < 2) return topicStat.totalAttempts >= 5 ? 'medium' : 'low';
    
    // Check variance in recent history
    const recentScores = history.slice(-5).map(h => h.accuracy);
    const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const variance = recentScores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / recentScores.length;
    
    if (variance < 100 && topicStat.totalAttempts >= 10) return 'high';
    if (variance < 400 && topicStat.totalAttempts >= 5) return 'medium';
    return 'low';
  },

  /**
   * Knowledge decay: reduce accuracy if the student hasn't practiced recently.
   * Decay rate: 2% per day of inactivity after 3 days.
   */
  applyKnowledgeDecay(topicStat) {
    if (!topicStat || !topicStat.lastAttempt) return topicStat;
    
    const daysSinceLastAttempt = (Date.now() - new Date(topicStat.lastAttempt).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastAttempt > 3) {
      const decayDays = daysSinceLastAttempt - 3;
      const decayPct = Math.min(30, decayDays * 2); // cap at 30%
      topicStat.decayedAccuracy = Math.max(0, Math.round(topicStat.accuracy - decayPct));
    } else {
      topicStat.decayedAccuracy = topicStat.accuracy;
    }
    
    return topicStat;
  },

  /**
   * Trend analysis: improving, declining, or stable.
   */
  detectTrend(history) {
    if (!history || history.length < 3) return 'stable';
    const recent = history.slice(-3).map(h => h.accuracy);
    if (recent[0] < recent[1] && recent[1] < recent[2]) return 'improving';
    if (recent[0] > recent[1] && recent[1] > recent[2]) return 'declining';
    return 'stable';
  },

  // ==========================================
  // DATA RECORDING
  // ==========================================

  /**
   * Records a single question attempt with weighted scoring and response time.
   */
  recordAttempt(profile, topicId, questionText, isCorrect, responseTimeMs = 0, difficulty = 1) {
    // 1. Initialize data structures
    if (!profile.questionStats) profile.questionStats = {};
    if (!profile.topicStats) profile.topicStats = {};
    if (!profile.activityLog) profile.activityLog = [];
    if (!profile.sessionTimers) profile.sessionTimers = {};
    
    if (!profile.topicStats[topicId]) {
      profile.topicStats[topicId] = {
        totalAttempts: 0,
        totalCorrect: 0,
        accuracy: 0,
        weightedScore: 0,
        level: 1,
        history: [],
        lastAttempt: null
      };
    }

    const questionKey = Buffer.from(questionText).toString('base64').substring(0, 50);
    if (!profile.questionStats[questionKey]) {
      profile.questionStats[questionKey] = {
        topicId,
        questionText,
        attempts: 0,
        correct: 0,
        lastAttempt: null,
        nextReview: null,
        difficulty: difficulty
      };
    }

    // 2. Update Question Stats
    const qStat = profile.questionStats[questionKey];
    qStat.attempts += 1;
    if (isCorrect) qStat.correct += 1;
    qStat.lastAttempt = new Date();
    qStat.difficulty = difficulty;

    // Spaced repetition
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const intervalMultiplier = isCorrect ? 3 : 0.5;
    const currentInterval = qStat.nextReview 
      ? (new Date(qStat.nextReview).getTime() - qStat.lastAttempt.getTime()) 
      : ONE_DAY;
    qStat.nextReview = new Date(qStat.lastAttempt.getTime() + Math.abs(currentInterval * intervalMultiplier));

    // 3. Update Topic Stats with weighted scoring
    const tStat = profile.topicStats[topicId];
    tStat.totalAttempts += 1;
    if (isCorrect) tStat.totalCorrect += 1;
    tStat.lastAttempt = new Date();
    
    tStat.accuracy = this.computeAccuracy(tStat.totalCorrect, tStat.totalAttempts);
    
    // Rolling weighted score
    const ws = this.calculateWeightedScore(isCorrect, responseTimeMs, difficulty);
    tStat.weightedScore = Math.round(
      (tStat.weightedScore * (tStat.totalAttempts - 1) + ws) / tStat.totalAttempts
    );
    
    tStat.level = this.classifyLevel(tStat.accuracy);

    // History snapshot every 3 attempts for finer trend tracking
    if (tStat.totalAttempts % 3 === 0) {
      tStat.history.push({ 
        accuracy: tStat.accuracy, 
        weightedScore: tStat.weightedScore,
        timestamp: new Date() 
      });
    }

    // 4. Activity log
    profile.activityLog.push({
      type: 'exercise',
      topicId,
      isCorrect,
      score: ws,
      timestamp: new Date(),
      questionPreview: questionText.substring(0, 60)
    });

    // Keep only last 50 activity items
    if (profile.activityLog.length > 50) {
      profile.activityLog = profile.activityLog.slice(-50);
    }

    return {
      updatedTopicLevel: tStat.level,
      updatedAccuracy: tStat.accuracy,
      weightedScore: ws
    };
  },

  // ==========================================
  // FEEDBACK & RECOMMENDATIONS
  // ==========================================

  /**
   * Generates actionable feedback by analyzing trends and accuracy.
   */
  generateFeedback(profile, topicId) {
    if (!profile.topicStats || !profile.topicStats[topicId]) {
      return "Keep practicing to generate personalized feedback!";
    }

    const tStat = profile.topicStats[topicId];
    const trend = this.detectTrend(tStat.history);
    const confidence = this.estimateConfidence(tStat);
    const cleanTopic = topicId.replace(/-/g, ' ');

    let feedback = "";
    if (tStat.accuracy < 40) {
      feedback = `You are building your foundation in ${cleanTopic}. Focus on understanding core concepts before tackling complex problems. `;
    } else if (tStat.accuracy < 70) {
      feedback = `You're making solid progress in ${cleanTopic}! You understand the basics well — try pushing into more challenging applications. `;
    } else {
      feedback = `Excellent mastery of ${cleanTopic}. You're ready for the most advanced challenges. `;
    }

    if (trend === 'improving') feedback += "📈 Your recent trend shows strong improvement — keep the momentum!";
    else if (trend === 'declining') feedback += "📉 Your recent accuracy has dipped. A focused review session could help.";
    
    if (confidence === 'low') feedback += " (More practice needed to confirm your level.)";

    return feedback;
  },

  /**
   * Prioritizes which topic to study next.
   */
  getAdaptiveRecommendation(profile) {
    if (!profile.questionStats) return null;

    const now = new Date();
    const dueQuestions = Object.values(profile.questionStats)
      .filter(q => q.nextReview && new Date(q.nextReview) <= now)
      .sort((a, b) => (a.correct / Math.max(1, a.attempts)) - (b.correct / Math.max(1, b.attempts)));

    if (dueQuestions.length > 0) {
      return {
        topicId: dueQuestions[0].topicId,
        reason: "Spaced repetition review is due for weak areas."
      };
    }

    if (profile.topicStats) {
      const weakTopics = Object.entries(profile.topicStats)
        .sort(([, a], [, b]) => a.accuracy - b.accuracy);
      
      if (weakTopics.length > 0) {
        return {
          topicId: weakTopics[0][0],
          reason: "Prioritizing your weakest subject for balanced growth."
        };
      }
    }

    return null;
  },

  /**
   * Gets a full analytics snapshot for the progress page.
   */
  getProgressAnalytics(profile) {
    const topicStats = profile.topicStats || {};
    const activityLog = profile.activityLog || [];
    const sessionTimers = profile.sessionTimers || {};

    // Topic mastery breakdown
    const topicBreakdown = Object.entries(topicStats).map(([topicId, stat]) => {
      this.applyKnowledgeDecay(stat);
      return {
        topicId,
        name: topicId.replace(/-/g, ' '),
        accuracy: stat.accuracy,
        decayedAccuracy: stat.decayedAccuracy ?? stat.accuracy,
        weightedScore: stat.weightedScore || 0,
        level: stat.level,
        totalAttempts: stat.totalAttempts,
        totalCorrect: stat.totalCorrect,
        trend: this.detectTrend(stat.history),
        confidence: this.estimateConfidence(stat),
        lastAttempt: stat.lastAttempt
      };
    }).sort((a, b) => a.accuracy - b.accuracy);

    // Overall mastery
    const totalCorrect = Object.values(topicStats).reduce((s, t) => s + t.totalCorrect, 0);
    const totalAttempts = Object.values(topicStats).reduce((s, t) => s + t.totalAttempts, 0);
    const overallMastery = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    // Total study time
    const totalMs = Object.values(sessionTimers).reduce((s, t) => s + (t.totalMs || 0), 0);
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    const timeSpent = totalMs > 0 ? `${hours}h ${minutes}m` : '0h 0m';

    // Weak zones
    const weakZones = topicBreakdown
      .filter(t => t.accuracy < 50 && t.totalAttempts >= 2)
      .map(t => t.name);

    // Recent activity (last 10)
    const recentActivity = activityLog.slice(-10).reverse();

    // Weekly trend data (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en', { weekday: 'short' });
      
      const dayActivities = activityLog.filter(a => {
        const aDate = new Date(a.timestamp);
        return aDate.toDateString() === d.toDateString();
      });
      
      const dayCorrect = dayActivities.filter(a => a.isCorrect).length;
      const dayTotal = dayActivities.length;
      
      weeklyData.push({
        day: dayStr,
        score: dayTotal > 0 ? Math.round((dayCorrect / dayTotal) * 100) : 0,
        sessions: dayTotal
      });
    }

    return {
      overallMastery,
      timeSpent,
      totalAttempts,
      weakZones,
      topicBreakdown,
      recentActivity,
      weeklyData,
      recommendation: this.getAdaptiveRecommendation(profile)
    };
  }
};
