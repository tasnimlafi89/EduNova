import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ExerciseSkeleton } from '../components/ui/Skeleton';
import { useNotification } from '../components/ui/Notification';
import { api } from '../api';

export const Learn = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const notify = useNotification();
  const [exercise, setExercise] = useState(null);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [level, setLevel] = useState(1);
  const [askedQuestions, setAskedQuestions] = useState([]);
  
  // Session tracking
  const MAX_QUESTIONS_MAP = { 1: 3, 2: 5, 3: 7 };
  const [maxQuestions, setMaxQuestions] = useState(3);
  const [sessionCount, setSessionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionResult, setSessionResult] = useState(null);
  const [completing, setCompleting] = useState(false);

  // Response time tracking
  const questionStartTime = useRef(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // Start timer when exercise loads
  useEffect(() => {
    if (exercise && !evaluation) {
      questionStartTime.current = Date.now();
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - questionStartTime.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [exercise, evaluation]);

  // Stop timer on evaluation
  useEffect(() => {
    if (evaluation) clearInterval(timerRef.current);
  }, [evaluation]);

  const loadProfileAndExercise = async () => {
    setLoading(true);
    const profile = await api.getProfile('user-1');
    const subject = profile.subjects.find(s => s.id === topicId);
    const currentLevel = subject ? subject.level : 1;
    setLevel(currentLevel);
    setMaxQuestions(MAX_QUESTIONS_MAP[currentLevel] || 3);
    
    // Start session timer on backend
    await api.startSession('user-1', topicId);
    
    await loadExercise(currentLevel, []);
  };

  useEffect(() => {
    loadProfileAndExercise();
  }, [topicId]);

  const loadExercise = async (lvl = level, currentHistory = askedQuestions) => {
    const targetMax = MAX_QUESTIONS_MAP[lvl] || 3;
    if (sessionCount >= targetMax) return;
    
    setLoading(true);
    setEvaluation(null);
    setAnswer('');
    setShowHint(false);
    
    const types = ['open-ended', 'MCQ'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const data = await api.generateExercise(topicId, lvl, type, currentHistory);
    setExercise(data);
    setAskedQuestions([...currentHistory, data.question]);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setEvaluating(true);
    
    const responseTimeMs = Date.now() - questionStartTime.current;
    
    const data = await api.evaluateAnswer(
      exercise.question, answer, topicId, level, 'user-1',
      responseTimeMs, exercise.difficulty || level
    );
    
    if (data.isCorrect) {
      setCorrectCount(prev => prev + 1);
      notify.success('Correct!', 'Great job on that answer!');
    }
    setEvaluation(data);
    setEvaluating(false);
  };

  const handleNext = () => {
    setSessionCount(prev => prev + 1);
    loadExercise();
  };

  const handleRetry = () => {
    setEvaluation(null);
    setAnswer('');
    questionStartTime.current = Date.now();
  };

  const handleFinishSession = async () => {
    setCompleting(true);
    const result = await api.completeSession('user-1', topicId, correctCount, maxQuestions);
    setSessionResult(result);
    setCompleting(false);
    
    if (result.leveledUp) {
      notify.achievement('Level Up!', `You advanced to ${result.newLevelName}!`);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
  };

  // Session result screens
  if (sessionResult) {
    if (sessionResult.leveledUp) {
      return (
        <div className="max-w-4xl mx-auto px-8 py-12 w-full text-center mt-16 animate-cosmic-zoom">
          <div className="relative inline-block mb-6">
            <span className="material-symbols-outlined text-8xl text-secondary animate-float" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            <div className="absolute inset-0 blur-2xl bg-secondary/20 rounded-full" />
          </div>
          <h1 className="font-headline text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-secondary to-primary">Level Up!</h1>
          <p className="text-on-surface text-xl mb-2">Congratulations!</p>
          <p className="text-on-surface-variant mb-6">
            You upgraded from <span className="text-white font-bold">{sessionResult.oldLevelName}</span> to{' '}
            <span className="text-secondary font-bold">{sessionResult.newLevelName}</span> in{' '}
            <span className="capitalize">{topicId.replace(/-/g, ' ')}</span>.
          </p>
          {sessionResult.feedback && (
            <div className="bg-primary/10 border border-primary/20 text-primary p-4 rounded-xl mb-8 max-w-2xl mx-auto text-left animate-cosmic-slide">
              <span className="material-symbols-outlined align-middle mr-2 text-sm">tips_and_updates</span>
              <span className="text-sm font-medium">{sessionResult.feedback}</span>
            </div>
          )}
          <Button variant="primary" onClick={() => navigate('/dashboard')} className="btn-ripple">Return to Dashboard</Button>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto px-8 py-12 w-full text-center mt-16 animate-cosmic-fade">
        <span className="material-symbols-outlined text-6xl text-primary mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
        <h1 className="font-headline text-4xl font-bold text-white mb-6">Session Complete!</h1>
        
        {/* Score summary cards */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
          <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
            <div className="text-2xl font-black text-secondary">{correctCount}</div>
            <div className="text-xs text-on-surface-variant">Correct</div>
          </div>
          <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
            <div className="text-2xl font-black text-primary">{maxQuestions}</div>
            <div className="text-xs text-on-surface-variant">Total</div>
          </div>
          <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
            <div className="text-2xl font-black text-tertiary">{sessionResult.masteryScore}%</div>
            <div className="text-xs text-on-surface-variant">Mastery</div>
          </div>
        </div>

        {sessionResult.feedback && (
          <div className="bg-surface-container border border-outline-variant/10 text-on-surface-variant p-4 rounded-xl mb-8 max-w-2xl mx-auto text-left animate-cosmic-slide">
            <span className="material-symbols-outlined align-middle mr-2 text-sm text-secondary">analytics</span>
            <span className="text-sm">{sessionResult.feedback}</span>
          </div>
        )}
        <Button variant="primary" onClick={() => navigate('/dashboard')} className="btn-ripple">Return to Dashboard</Button>
      </div>
    );
  }

  if (loading) return <ExerciseSkeleton />;

  const progressPct = ((sessionCount) / maxQuestions) * 100;

  return (
    <div className="max-w-4xl mx-auto px-8 py-10 w-full animate-cosmic-fade">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/dashboard')} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-all hover:scale-105">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="font-headline text-2xl font-bold text-white capitalize">{topicId.replace(/-/g, ' ')}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-on-surface-variant">Question {sessionCount + 1} of {maxQuestions}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">Level {level}</span>
          </div>
        </div>
        {/* Timer */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/10">
          <span className="material-symbols-outlined text-secondary text-lg">timer</span>
          <span className="text-sm font-mono text-secondary font-bold">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-surface-container-highest rounded-full h-1.5 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="space-y-6 stagger-children">
        {/* Question Card */}
        <Card className="border-t-4 border-t-primary animate-cosmic-slide">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-headline text-lg text-white font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">quiz</span>
              Exercise
            </h2>
          </div>
          <p className="text-on-surface text-lg leading-relaxed mb-6">{exercise.question}</p>
          
          {/* MCQ Options */}
          {exercise.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {exercise.options.map((opt, i) => (
                <button 
                  key={i} 
                  onClick={() => !evaluating && !evaluation && setAnswer(opt)}
                  className={`p-4 rounded-xl text-left border-2 transition-all duration-200 ${
                    answer === opt 
                      ? 'bg-secondary/15 border-secondary text-white scale-[1.02] shadow-[0_0_15px_rgba(165,231,255,0.1)]' 
                      : 'bg-surface-container border-outline-variant/10 text-on-surface-variant hover:bg-surface-container-high hover:border-outline-variant/20'
                  } ${evaluation ? 'pointer-events-none' : ''}`}
                >
                  <span className="text-xs font-bold text-on-surface-variant mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Open-ended */}
          {!exercise.options && (
            <textarea 
              className="w-full h-32 bg-surface-container-highest border-2 border-transparent rounded-2xl p-5 text-on-surface focus:border-secondary/50 focus:shadow-[0_0_20px_rgba(165,231,255,0.1)] transition-all outline-none resize-none"
              placeholder="Type your answer here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={evaluating || evaluation}
            />
          )}
          
          {/* Hint */}
          {showHint && exercise.hint && (
            <div className="p-4 bg-tertiary/8 border border-tertiary/20 rounded-xl flex gap-3 text-tertiary animate-cosmic-slide mt-4">
              <span className="material-symbols-outlined text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
              <p className="text-sm">{exercise.hint}</p>
            </div>
          )}

          {/* Actions */}
          {!evaluation && (
            <div className="flex justify-between items-center mt-6">
              <button 
                onClick={() => setShowHint(true)}
                className={`text-secondary text-sm flex items-center gap-2 transition-all ${showHint ? 'opacity-40 cursor-not-allowed' : 'hover:text-white hover:gap-3'}`}
                disabled={showHint}
              >
                <span className="material-symbols-outlined text-lg">lightbulb</span> 
                {showHint ? 'Hint Shown' : 'Need Hint?'}
              </button>
              <Button variant="primary" onClick={handleSubmit} disabled={!answer.trim() || evaluating} className="btn-ripple">
                {evaluating ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Analyzing...
                  </span>
                ) : 'Submit Answer'}
              </Button>
            </div>
          )}
        </Card>

        {/* Evaluation Result */}
        {evaluation && (
          <Card className={`border-l-4 ${!evaluation.isRelevant ? 'border-l-error' : evaluation.isCorrect ? 'border-l-secondary' : 'border-l-tertiary'} bg-surface-container/50 animate-cosmic-slide`}>
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                !evaluation.isRelevant ? 'bg-error/15' : evaluation.isCorrect ? 'bg-secondary/15' : 'bg-tertiary/15'
              }`}>
                <span className={`material-symbols-outlined text-2xl ${
                  !evaluation.isRelevant ? 'text-error' : evaluation.isCorrect ? 'text-secondary' : 'text-tertiary'
                }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {!evaluation.isRelevant ? 'warning' : evaluation.isCorrect ? 'check_circle' : 'info'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-headline text-white font-bold">
                    {!evaluation.isRelevant ? 'Off-topic Detected' : evaluation.isCorrect ? 'Correct!' : 'Not Quite'}
                  </h3>
                  {evaluation.weightedScore !== undefined && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      Score: {evaluation.weightedScore}
                    </span>
                  )}
                  <span className="text-xs text-on-surface-variant">⏱ {formatTime(elapsedSeconds)}</span>
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-4">{evaluation.feedback}</p>
                {evaluation.correction && evaluation.isRelevant && (
                  <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 mb-4">
                    <span className="text-xs text-primary font-bold uppercase block mb-1">Suggested Correction</span>
                    <p className="text-on-surface text-sm">{evaluation.correction}</p>
                  </div>
                )}
                
                <div className="mt-4 flex justify-end gap-3">
                  {!evaluation.isCorrect && (
                    <Button variant="secondary" onClick={handleRetry} className="text-sm py-2 px-4">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">refresh</span> Retry
                      </span>
                    </Button>
                  )}
                  {sessionCount + 1 >= maxQuestions ? (
                    <Button variant="primary" onClick={handleFinishSession} disabled={completing} className="btn-ripple">
                      {completing ? 'Completing...' : 'Finish Session'}
                    </Button>
                  ) : (
                    <Button variant={evaluation.isCorrect ? "primary" : "secondary"} onClick={handleNext} className="btn-ripple">
                      Next Exercise →
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
