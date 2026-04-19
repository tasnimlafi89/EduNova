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
  async generateExercise(topic, level, type, history = []) {
    const cacheKey = `${topic}-${level}-${type}`;
    const cached = exerciseCache.get(cacheKey);
    
    // Bypass cache if we need a unique question based on history
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL) && history.length === 0) {
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
      
      // Define a structure: level -> type -> array of possible questions
      const db = {
        quantum: {
          1: [
            { q: "What is a basic particle of light called?", options: ["Photon", "Electron", "Proton", "Neutron"], hint: "It starts with P and carries electromagnetic force." },
            { q: "Which property does wave-particle duality describe?", options: ["Light and matter can act as both waves and particles.", "Only waves exist.", "Particles only have mass.", "Light is strictly a wave."], hint: "Think about the word 'duality'." }
          ],
          2: [
            { q: "Explain the Heisenberg Uncertainty Principle in simple terms.", hint: "It deals with knowing both the position and momentum of a particle." },
            { q: "What does it mean for energy to be 'quantized'?", hint: "Think about stepping up stairs instead of walking up a ramp." }
          ],
          3: [
            { q: "Describe how quantum entanglement violates local realism.", hint: "Consider Bell's theorem and instantaneous state collapse across distances." },
            { q: "Explain the mathematical significance of the wave function collapse in the Copenhagen interpretation.", hint: "Focus on the transition from a superposition of states to a single eigenstate." }
          ]
        },
        relativity: {
          1: [
            { q: "Who developed the theory of relativity?", options: ["Isaac Newton", "Albert Einstein", "Niels Bohr", "Galileo Galilei"], hint: "He is famous for the equation E=mc^2." },
            { q: "What does the 'c' stand for in E=mc^2?", options: ["Speed of light", "Energy", "Mass", "Acceleration"], hint: "It's the fastest speed possible in the universe." }
          ],
          2: [
            { q: "What is time dilation?", hint: "Think about how time passes for someone traveling close to the speed of light compared to someone at rest." },
            { q: "Explain how gravity is viewed in General Relativity.", hint: "It's not just a pull, but a warping of something." }
          ],
          3: [
            { q: "How does the equivalence principle link accelerating reference frames to gravitational fields?", hint: "Imagine being in a closed box accelerating upwards." },
            { q: "Explain the concept of a geodesic in curved spacetime.", hint: "It's the generalization of a straight line in curved space." }
          ]
        },
        algebra: {
          1: [
            { q: "What is the value of x in 2x + 4 = 10?", options: ["3", "2", "4", "6"], hint: "Subtract 4 from both sides first." },
            { q: "What does a linear equation look like on a graph?", options: ["A straight line", "A curve", "A circle", "A parabola"], hint: "The name gives it away." }
          ],
          2: [
            { q: "Explain what a matrix is used for in linear algebra.", hint: "Think about systems of equations and transformations." },
            { q: "What does the determinant of a 2x2 matrix tell us geometrically?", hint: "It relates to the area scaling factor of a linear transformation." }
          ],
          3: [
            { q: "Describe the relationship between eigenvalues and matrix diagonalizability.", hint: "Think about the basis of eigenvectors." },
            { q: "Explain how Singular Value Decomposition (SVD) generalizes the eigendecomposition.", hint: "Consider non-square matrices and orthonormal bases." }
          ]
        }
      };

      let category = 'quantum';
      if (t.includes('relativity') || t.includes('gravity') || t.includes('space')) category = 'relativity';
      if (t.includes('algebra') || t.includes('math')) category = 'algebra';

      // Pick question based on level. If level > 3, use 3. If missing, use 1.
      const safeLevel = level > 3 ? 3 : (level < 1 ? 1 : level);
      
      let possibleQuestions = db[category][safeLevel];
      
      // Try to filter by type if MCQ or open-ended requested (best effort)
      if (type === 'MCQ') {
        const mcqs = possibleQuestions.filter(p => p.options);
        if (mcqs.length > 0) possibleQuestions = mcqs;
      } else {
        const opens = possibleQuestions.filter(p => !p.options);
        if (opens.length > 0) possibleQuestions = opens;
      }

      // Filter out questions already in history
      let unaskedQuestions = possibleQuestions.filter(p => !history.includes(p.q));
      
      // If we ran out of unique questions for this level, just pick any from the possible ones
      if (unaskedQuestions.length === 0) {
        unaskedQuestions = possibleQuestions;
      }

      // Randomly pick one
      const selected = unaskedQuestions[Math.floor(Math.random() * unaskedQuestions.length)];

      return {
        question: selected.q,
        options: selected.options,
        correctAnswer: selected.options ? selected.options[0] : "AI graded concept.",
        hint: selected.hint
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
