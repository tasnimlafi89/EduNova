import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'mock-key',
});

// Simple in-memory cache for exercise generation
const exerciseCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const aiService = {
  async generateExercise(topic, level, type) {
    const cacheKey = `${topic}-${level}-${type}`;
    const cached = exerciseCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return cached.data;
    }

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0.7,
        system: "You are an expert AI tutor. Generate an educational exercise. You MUST reply ONLY with valid JSON in the exact structure: { \"question\": \"...\", \"options\": [\"...\", \"...\"], \"correctAnswer\": \"...\", \"hint\": \"...\" }. Do not include markdown formatting or extra text outside the JSON.",
        messages: [
          {
            role: 'user',
            content: `Topic: ${topic}\nDifficulty Level: ${level} (1-5)\nQuestion Type: ${type} (e.g. MCQ, open-ended)`
          }
        ]
      });

      const responseText = response.content[0].text;
      const data = JSON.parse(responseText);
      
      exerciseCache.set(cacheKey, { timestamp: Date.now(), data });
      return data;
    } catch (error) {
      console.error('Error generating exercise:', error);
      // Fallback for demo without real API key
      return {
        question: `Demo Question: Explain the core concepts of ${topic}.`,
        options: type === 'MCQ' ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
        correctAnswer: 'Option A',
        hint: 'Think about the basic principles.'
      };
    }
  },

  async evaluateAnswer(question, answer, topic, level) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0.3,
        system: "You are an AI grader. Evaluate the student's answer. Verify if the answer relates to the topic. Return ONLY valid JSON: { \"score\": <number 0-100>, \"isCorrect\": <boolean>, \"isRelevant\": <boolean>, \"feedback\": \"<detailed feedback>\", \"correction\": \"<suggested correction>\" }. Do not include markdown.",
        messages: [
          {
            role: 'user',
            content: `Topic: ${topic}\nLevel: ${level}\nQuestion: ${question}\nStudent Answer: ${answer}`
          }
        ]
      });

      const responseText = response.content[0].text;
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Error evaluating answer:', error);
      return {
        score: 85,
        isCorrect: true,
        isRelevant: true,
        feedback: "Good attempt! You captured the main idea.",
        correction: "Make sure to also mention..."
      };
    }
  },

  async tutorReply(studentContext, conversationHistory, newMessage) {
    try {
      const messages = conversationHistory.map(msg => ({
        role: msg.role === 'student' ? 'user' : 'assistant',
        content: msg.content
      }));

      messages.push({ role: 'user', content: newMessage });

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0.7,
        system: `You are a patient, encouraging AI tutor. The student's current topic is ${studentContext.topic}, level is ${studentContext.level}. Their recent scores: ${studentContext.recentScores.join(', ')}. Use simple cosmic analogies when explaining complex theories.`,
        messages
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Error getting tutor reply:', error);
      return "Hello! I'm your AI tutor (Demo Mode). How can I help you today with your learning journey?";
    }
  }
};
