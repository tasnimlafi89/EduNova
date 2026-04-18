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
      console.error('Error generating exercise, using smart fallback.');
      const t = topic.toLowerCase();
      let q = `What is the primary significance of ${topic.replace('-', ' ')} in modern science?`;
      let hint = `Consider the fundamental laws governing ${topic.replace('-', ' ')}.`;
      let options = undefined;
      let correct = 'It describes the fundamental nature of the system.';
      
      if (t.includes('quantum') || t.includes('particle') || t.includes('wave')) {
        q = type === 'MCQ' 
          ? "Which of the following best describes the principle of Wave-Particle Duality?"
          : "Explain how observation affects a quantum system according to the Copenhagen interpretation.";
        hint = "Think about Thomas Young's double-slit experiment.";
        if (type === 'MCQ') {
          options = [
            "Particles only behave as waves when observed.",
            "Light and matter exhibit properties of both waves and particles.",
            "Energy is continuous and never quantized.",
            "Electrons orbit the nucleus in fixed, predictable paths."
          ];
          correct = options[1];
        } else {
          correct = "Observation causes the wave function to collapse into a definite state.";
        }
      } else if (t.includes('relativity') || t.includes('gravity') || t.includes('space')) {
        q = type === 'MCQ'
          ? "According to General Relativity, what causes gravity?"
          : "Describe the relationship between mass and energy as proposed by Einstein.";
        hint = "It's not just a pulling force; it has to do with the fabric of space itself.";
        if (type === 'MCQ') {
          options = [
            "The electromagnetic attraction between massive objects.",
            "The curvature of spacetime caused by mass and energy.",
            "The rapid expansion of the universe.",
            "Quantum entanglement of gravitons."
          ];
          correct = options[1];
        } else {
          correct = "Mass and energy are interchangeable, expressed by E=mc^2.";
        }
      } else if (t.includes('algebra') || t.includes('math')) {
        q = type === 'MCQ' 
          ? "What is the determinant of a 2x2 matrix with rows [a, b] and [c, d]?"
          : "Explain the geometric meaning of an eigenvector.";
        hint = type === 'MCQ' ? "Multiply the diagonals and subtract." : "Think about transformations that don't change direction.";
        if (type === 'MCQ') {
          options = ["a*b - c*d", "a*d - b*c", "a*c - b*d", "a+d - b+c"];
          correct = options[1];
        } else {
          correct = "An eigenvector's direction remains unchanged when a linear transformation is applied.";
        }
      }

      return {
        question: q,
        options: options,
        correctAnswer: correct,
        hint: hint
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
      console.error('Error evaluating answer, using smart fallback.');
      const t = topic.toLowerCase();
      const a = answer.toLowerCase();
      
      // Basic relevance check
      const topicKeywords = t.split('-');
      const isRelevant = a.length > 5 && (topicKeywords.some(kw => a.includes(kw)) || a.includes('wave') || a.includes('particle') || a.includes('space') || a.includes('time') || a.includes('energy') || a.includes('mass') || a.includes('matrix') || a.includes('force') || a.includes('concept'));
      
      if (!isRelevant) {
        return {
          score: 0,
          isCorrect: false,
          isRelevant: false,
          feedback: "Your answer doesn't seem to relate to the question or the topic at hand. Please try to focus on the scientific concepts requested.",
          correction: "Re-read the question and use the hint if you're stuck."
        };
      }

      // Basic correctness check
      let isCorrect = false;
      let score = 40;
      let feedback = "You're on the right track, but missing some key concepts.";
      
      if (a.includes('both') || a.includes('collapse') || a.includes('e=mc2') || a.includes('e=mc^2') || a.includes('curvature') || a.includes('spacetime') || a.includes('ad - bc') || a.includes('direction') || a.includes('a*d - b*c') || a.includes('light and matter')) {
        isCorrect = true;
        score = 95;
        feedback = "Excellent! Your answer captures the core scientific principles perfectly.";
      } else if (a.length > 40) {
        isCorrect = true;
        score = 75;
        feedback = "Good explanation, but it could be more precise with scientific terminology.";
      }

      return {
        score: score,
        isCorrect: isCorrect,
        isRelevant: true,
        feedback: feedback,
        correction: isCorrect ? null : "Review the fundamental definitions related to this topic."
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
