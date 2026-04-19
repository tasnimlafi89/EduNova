import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'mock-key',
});

const MODEL = 'claude-3-5-sonnet-20241022';

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
        model: MODEL,
        max_tokens: 1000,
        temperature: 0.7,
        system: "You are an expert AI tutor. Generate an educational exercise. You MUST reply ONLY with valid JSON in the exact structure: { \"question\": \"...\", \"options\": [\"...\", \"...\"], \"correctAnswer\": \"...\", \"hint\": \"...\" }. Do not include markdown formatting or extra text outside the JSON.",
        messages: [
          {
            role: 'user',
            content: `Topic: ${topic}\nDifficulty Level: ${level} (1-5)\nQuestion Type: ${type} (e.g. MCQ, open-ended)\n${history.length > 0 ? `\nDo NOT repeat these questions:\n${history.join('\n')}` : ''}`
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
            { q: "Which property does wave-particle duality describe?", options: ["Light and matter can act as both waves and particles.", "Only waves exist.", "Particles only have mass.", "Light is strictly a wave."], hint: "Think about the word 'duality'." },
            { q: "What is the smallest unit of energy called?", options: ["Quantum", "Joule", "Calorie", "Watt"], hint: "The name of this field of physics gives it away." }
          ],
          2: [
            { q: "Explain the Heisenberg Uncertainty Principle in simple terms.", hint: "It deals with knowing both the position and momentum of a particle." },
            { q: "What does it mean for energy to be 'quantized'?", hint: "Think about stepping up stairs instead of walking up a ramp." },
            { q: "Describe how a quantum computer differs from a classical one.", hint: "Think about qubits vs. bits and superposition." }
          ],
          3: [
            { q: "Describe how quantum entanglement violates local realism.", hint: "Consider Bell's theorem and instantaneous state collapse across distances." },
            { q: "Explain the mathematical significance of the wave function collapse in the Copenhagen interpretation.", hint: "Focus on the transition from a superposition of states to a single eigenstate." },
            { q: "How does decoherence differ from wave function collapse?", hint: "Think about the environment's role in losing quantum coherence." }
          ]
        },
        relativity: {
          1: [
            { q: "Who developed the theory of relativity?", options: ["Isaac Newton", "Albert Einstein", "Niels Bohr", "Galileo Galilei"], hint: "He is famous for the equation E=mc^2." },
            { q: "What does the 'c' stand for in E=mc^2?", options: ["Speed of light", "Energy", "Mass", "Acceleration"], hint: "It's the fastest speed possible in the universe." },
            { q: "What happens to time as you approach the speed of light?", options: ["Time slows down", "Time speeds up", "Time stops completely", "Nothing changes"], hint: "This is called time dilation." }
          ],
          2: [
            { q: "What is time dilation?", hint: "Think about how time passes for someone traveling close to the speed of light compared to someone at rest." },
            { q: "Explain how gravity is viewed in General Relativity.", hint: "It's not just a pull, but a warping of something." },
            { q: "What is a light cone and why is it important?", hint: "It defines what events can causally influence each other." }
          ],
          3: [
            { q: "How does the equivalence principle link accelerating reference frames to gravitational fields?", hint: "Imagine being in a closed box accelerating upwards." },
            { q: "Explain the concept of a geodesic in curved spacetime.", hint: "It's the generalization of a straight line in curved space." },
            { q: "What is frame-dragging and how was it experimentally confirmed?", hint: "Think about Gravity Probe B and rotating massive objects." }
          ]
        },
        algebra: {
          1: [
            { q: "What is the value of x in 2x + 4 = 10?", options: ["3", "2", "4", "6"], hint: "Subtract 4 from both sides first." },
            { q: "What does a linear equation look like on a graph?", options: ["A straight line", "A curve", "A circle", "A parabola"], hint: "The name gives it away." },
            { q: "What is the slope of the line y = 3x + 1?", options: ["3", "1", "0", "-3"], hint: "In y = mx + b, the slope is m." }
          ],
          2: [
            { q: "Explain what a matrix is used for in linear algebra.", hint: "Think about systems of equations and transformations." },
            { q: "What does the determinant of a 2x2 matrix tell us geometrically?", hint: "It relates to the area scaling factor of a linear transformation." },
            { q: "What is a vector space and how does it differ from regular space?", hint: "Think about closure under addition and scalar multiplication." }
          ],
          3: [
            { q: "Describe the relationship between eigenvalues and matrix diagonalizability.", hint: "Think about the basis of eigenvectors." },
            { q: "Explain how Singular Value Decomposition (SVD) generalizes the eigendecomposition.", hint: "Consider non-square matrices and orthonormal bases." },
            { q: "How does the Rank-Nullity theorem constrain solutions to Ax = 0?", hint: "Think about the dimensions of the column space and null space." }
          ]
        }
      };

      let category = null;
      if (t.includes('quantum') || t.includes('particle') || t.includes('wave')) category = 'quantum';
      else if (t.includes('relativity') || t.includes('gravity') || t.includes('space')) category = 'relativity';
      else if (t.includes('algebra') || t.includes('math') || t.includes('linear')) category = 'algebra';

      const safeLevel = level > 3 ? 3 : (level < 1 ? 1 : level);
      const cleanTopic = topic.replace(/-/g, ' ');
      
      let possibleQuestions;
      
      if (category && db[category]) {
        possibleQuestions = db[category][safeLevel];
      } else {
        // Dynamic fallback for any topic
        const levelDescriptors = {
          1: ['fundamental', 'basic', 'introductory'],
          2: ['intermediate', 'applied', 'analytical'],
          3: ['advanced', 'theoretical', 'complex']
        };
        const desc = levelDescriptors[safeLevel] || levelDescriptors[1];
        
        possibleQuestions = [
          { q: `What is the ${desc[0]} definition of ${cleanTopic}?`, options: [`The core study of ${cleanTopic} and its principles`, `A branch of culinary arts`, `A type of geological formation`, `An ancient musical instrument`], hint: `Think about what ${cleanTopic} fundamentally means as a field of study.` },
          { q: `Explain the most important ${desc[1]} principle in ${cleanTopic}.`, hint: `Consider the foundational rules that govern ${cleanTopic}.` },
          { q: `How does ${cleanTopic} apply to real-world scenarios?`, hint: `Think of industries or daily situations where ${cleanTopic} is used.` },
          { q: `Describe a ${desc[2]} concept within ${cleanTopic}.`, hint: `Go beyond the surface-level understanding of ${cleanTopic}.` },
          { q: `Which of the following best relates to ${cleanTopic}?`, options: [`A key principle of ${cleanTopic}`, `The boiling point of water`, `Photosynthesis in plants`, `Musical chord progressions`], hint: `Choose the option that directly relates to ${cleanTopic}.` },
          { q: `What historical development was most significant for ${cleanTopic}?`, hint: `Think about key discoveries or publications that shaped ${cleanTopic}.` },
          { q: `Compare and contrast two key approaches in ${cleanTopic}.`, hint: `Consider different schools of thought or methodologies in ${cleanTopic}.` }
        ];
      }
      
      // Filter by type
      if (type === 'MCQ') {
        const mcqs = possibleQuestions.filter(p => p.options);
        if (mcqs.length > 0) possibleQuestions = mcqs;
      } else {
        const opens = possibleQuestions.filter(p => !p.options);
        if (opens.length > 0) possibleQuestions = opens;
      }

      // Filter out previously asked
      let unaskedQuestions = possibleQuestions.filter(p => !history.includes(p.q));
      if (unaskedQuestions.length === 0) unaskedQuestions = possibleQuestions;

      const selected = unaskedQuestions[Math.floor(Math.random() * unaskedQuestions.length)];

      return {
        question: selected.q,
        options: selected.options,
        correctAnswer: selected.options ? selected.options[0] : "AI graded concept.",
        hint: selected.hint,
        difficulty: safeLevel
      };
    }
  },

  async evaluateAnswer(question, answer, topic, level) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
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
      
      const topicKeywords = t.split('-').concat(t.split(' '));
      const isRelevant = a.length > 5 && (
        topicKeywords.some(kw => kw.length > 2 && a.includes(kw)) || 
        a.includes('concept') || a.includes('principle') || a.includes('theory') ||
        a.includes('energy') || a.includes('force') || a.includes('system')
      );
      
      if (!isRelevant) {
        return {
          score: 0,
          isCorrect: false,
          isRelevant: false,
          feedback: "Your answer doesn't seem to relate to the question or the topic. Please focus on the scientific concepts requested.",
          correction: "Re-read the question and use the hint if you're stuck."
        };
      }

      let isCorrect = false;
      let score = 40;
      let feedback = "You're on the right track, but missing some key concepts.";
      
      if (a.length > 80 && (a.includes('because') || a.includes('therefore') || a.includes('means that'))) {
        isCorrect = true;
        score = 90;
        feedback = "Well-structured answer with good reasoning. Minor details could be improved.";
      } else if (a.length > 40) {
        isCorrect = true;
        score = 72;
        feedback = "Decent explanation. Try to include more specific terminology and reasoning.";
      }

      return { score, isCorrect, isRelevant: true, feedback, correction: isCorrect ? null : "Review fundamental definitions." };
    }
  },

  async tutorReply(studentContext, conversationHistory, newMessage) {
    try {
      const messages = conversationHistory.map(msg => ({
        role: msg.role === 'student' ? 'user' : 'assistant',
        content: msg.content
      }));

      messages.push({ role: 'user', content: newMessage });

      const weakInfo = studentContext.weakAreas ? `\nKnown weak areas: ${studentContext.weakAreas}` : '';
      const topicsInfo = studentContext.studentTopics ? `\nStudent's topics: ${studentContext.studentTopics.join(', ')}` : '';

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1500,
        temperature: 0.7,
        system: `You are a patient, encouraging AI tutor for the EduNova learning platform. 
The student's current topic focus is ${studentContext.topic}, at level ${studentContext.level}.
Recent scores: ${(studentContext.recentScores || []).join(', ') || 'N/A'}.${weakInfo}${topicsInfo}

Rules:
1. Give clear, structured responses with headings when appropriate.
2. Stay strictly on the requested topic.
3. Adapt complexity to the student's level.
4. If they ask a follow-up, build on previous context.
5. Include a mini-quiz question at the end when explaining a concept.
6. Use step-by-step explanations for complex topics.
7. Never just give raw answers — guide the student to understand WHY.`,
        messages
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Error getting tutor reply:', error);
      return "Hello! I'm your AI tutor. I'm currently in demo mode, but I can still help! Ask me about any topic you're studying and I'll do my best to explain it clearly. Try asking a specific question about one of your study topics!";
    }
  },

  async summarizeText(text, topic) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1000,
        temperature: 0.3,
        system: "You are an AI study assistant. Summarize the following study material into a concise revision sheet with key points, definitions, and important facts. Format with bullet points.",
        messages: [
          { role: 'user', content: `Topic: ${topic}\n\nMaterial:\n${text}` }
        ]
      });
      return response.content[0].text;
    } catch (error) {
      console.error('Error summarizing text:', error);
      return `📋 Summary of uploaded material for topic: ${topic}\n\n• Document uploaded successfully\n• Content is available for review\n• AI summarization will be available when the API is connected\n\nKey action: Review the original material and practice with exercises.`;
    }
  }
};
