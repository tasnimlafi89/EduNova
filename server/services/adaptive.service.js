export const adaptiveService = {
  /**
   * Data Schema Requirement:
   * 
   * In a real DB, you'd have these tables/collections:
   * 
   * QuestionStats {
   *   studentId: string,
   *   topicId: string,
   *   questionText: string, // or questionId
   *   attempts: number,
   *   correct: number,
   *   lastAttempt: Date,
   *   nextReview: Date // for spaced repetition
   * }
   * 
   * TopicStats {
   *   studentId: string,
   *   topicId: string,
   *   totalAttempts: number,
   *   totalCorrect: number,
   *   accuracy: number, // 0-100
   *   level: number, // 1 (Beginner), 2 (Intermediate), 3 (Advanced)
   *   history: Array<{ accuracy: number, timestamp: Date }> // to track progression/regression
   * }
   */

  // Core Algorithms

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
   * Records a single question attempt and updates stats
   * Integrates spaced repetition logic for the specific question
   */
  recordAttempt(profile, topicId, questionText, isCorrect) {
    // 1. Initialize data structures if they don't exist
    if (!profile.questionStats) profile.questionStats = {};
    if (!profile.topicStats) profile.topicStats = {};
    if (!profile.topicStats[topicId]) {
      profile.topicStats[topicId] = {
        totalAttempts: 0,
        totalCorrect: 0,
        accuracy: 0,
        level: 1,
        history: []
      };
    }

    const questionKey = Buffer.from(questionText).toString('base64').substring(0, 50); // mock ID
    if (!profile.questionStats[questionKey]) {
      profile.questionStats[questionKey] = {
        topicId,
        questionText,
        attempts: 0,
        correct: 0,
        lastAttempt: null,
        nextReview: null
      };
    }

    // 2. Update Question Stats
    const qStat = profile.questionStats[questionKey];
    qStat.attempts += 1;
    if (isCorrect) qStat.correct += 1;
    qStat.lastAttempt = new Date();

    // Spaced repetition logic: if correct, push review date further out. If wrong, review sooner.
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const intervalMultiplier = isCorrect ? 3 : 0.5; // correct -> wait 3 days, wrong -> wait 12 hours
    const currentInterval = qStat.nextReview ? (qStat.nextReview.getTime() - qStat.lastAttempt.getTime()) : ONE_DAY;
    
    qStat.nextReview = new Date(qStat.lastAttempt.getTime() + (currentInterval * intervalMultiplier));

    // 3. Update Topic Stats
    const tStat = profile.topicStats[topicId];
    tStat.totalAttempts += 1;
    if (isCorrect) tStat.totalCorrect += 1;
    
    tStat.accuracy = this.computeAccuracy(tStat.totalCorrect, tStat.totalAttempts);
    tStat.level = this.classifyLevel(tStat.accuracy);
    
    // Save history snapshot every 5 attempts to track trends
    if (tStat.totalAttempts % 5 === 0) {
      tStat.history.push({ accuracy: tStat.accuracy, timestamp: new Date() });
    }

    return {
      updatedTopicLevel: tStat.level,
      updatedAccuracy: tStat.accuracy
    };
  },

  /**
   * Generates actionable feedback by analyzing trends and accuracy
   */
  generateFeedback(profile, topicId) {
    if (!profile.topicStats || !profile.topicStats[topicId]) {
      return "Keep practicing to generate personalized feedback!";
    }

    const tStat = profile.topicStats[topicId];
    const history = tStat.history;

    let trend = "stable";
    if (history.length >= 2) {
      const recent = history[history.length - 1].accuracy;
      const older = history[history.length - 2].accuracy;
      if (recent > older + 10) trend = "improving";
      else if (recent < older - 10) trend = "regressing";
    }

    let feedback = "";
    if (tStat.accuracy < 40) {
      feedback = `You are struggling with ${topicId}. Practice more basic fundamentals before moving to advanced concepts. `;
    } else if (tStat.accuracy < 70) {
      feedback = `You're making steady progress in ${topicId}! You grasp the basics, but complex applications might still be tricky. `;
    } else {
      feedback = `Excellent mastery of ${topicId}. You're ready for the hardest challenges. `;
    }

    if (trend === "improving") feedback += "Your trend shows rapid improvement—keep it up!";
    else if (trend === "regressing") feedback += "Your recent accuracy has dropped slightly. Let's do a review session.";

    return feedback;
  },

  /**
   * Prioritizes which topic to study next based on spaced repetition and weakness
   */
  getAdaptiveRecommendation(profile) {
    if (!profile.questionStats) return null;

    const now = new Date();
    const dueQuestions = Object.values(profile.questionStats)
      .filter(q => q.nextReview && q.nextReview <= now)
      .sort((a, b) => a.accuracy - b.accuracy); // prioritize weakest

    // If there are specific questions due for review, suggest that topic
    if (dueQuestions.length > 0) {
      return {
        topicId: dueQuestions[0].topicId,
        reason: "Reviewing weak areas and spaced repetition due."
      };
    }

    // Otherwise find the topic with the lowest overall accuracy
    if (profile.topicStats) {
      const weakTopics = Object.entries(profile.topicStats)
        .sort(([,a], [,b]) => a.accuracy - b.accuracy);
      
      if (weakTopics.length > 0) {
        return {
          topicId: weakTopics[0][0],
          reason: "Prioritizing your weakest subject for balanced growth."
        };
      }
    }

    return null;
  }
};
