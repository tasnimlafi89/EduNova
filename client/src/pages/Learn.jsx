import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { api } from '../api';

export const Learn = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [level, setLevel] = useState(1);
  const [askedQuestions, setAskedQuestions] = useState([]);
  
  // Session tracking
  // Beginner: 3, Intermediate: 5, Advanced: 7
  const MAX_QUESTIONS = level === 1 ? 3 : level === 2 ? 5 : 7;
  const [sessionCount, setSessionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionResult, setSessionResult] = useState(null);
  const [completing, setCompleting] = useState(false);

  const loadProfileAndExercise = async () => {
    setLoading(true);
    const profile = await api.getProfile('user-1');
    const subject = profile.subjects.find(s => s.id === topicId);
    const currentLevel = subject ? subject.level : 1;
    setLevel(currentLevel);
    await loadExercise(currentLevel, []);
  };

  useEffect(() => {
    loadProfileAndExercise();
  }, [topicId]);

  const loadExercise = async (lvl = level, currentHistory = askedQuestions) => {
    const targetMax = lvl === 1 ? 3 : lvl === 2 ? 5 : 7;
    if (sessionCount >= targetMax) return;
    
    setLoading(true);
    setEvaluation(null);
    setAnswer('');
    setShowHint(false);
    
    // Vary question types
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
    
    const data = await api.evaluateAnswer(exercise.question, answer, topicId, level, 'user-1');
    if (data.isCorrect) {
      setCorrectCount(prev => prev + 1);
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
    // keep answer so they can edit it
  };

  const handleFinishSession = async () => {
    setCompleting(true);
    const count = sessionCount + 1; // plus the one we just finished
    const result = await api.completeSession('user-1', topicId, correctCount, MAX_QUESTIONS);
    setSessionResult(result);
    setCompleting(false);
  };

  if (sessionResult) {
    if (sessionResult.leveledUp) {
      return (
        <div className="max-w-4xl mx-auto px-8 py-12 w-full text-center mt-20 animate-in zoom-in">
          <span className="material-symbols-outlined text-8xl text-secondary mb-6 animate-bounce">workspace_premium</span>
          <h1 className="font-headline text-5xl font-black text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-secondary to-primary">Level Up!</h1>
          <p className="text-on-surface text-xl mb-2">Congratulations!</p>
          <p className="text-on-surface-variant mb-6">You've mastered this stage and upgraded from <span className="text-white font-bold">{sessionResult.oldLevelName}</span> to <span className="text-secondary font-bold">{sessionResult.newLevelName}</span> in {topicId.replace('-', ' ')}.</p>
          {sessionResult.feedback && (
            <div className="bg-primary/10 border border-primary/20 text-primary p-4 rounded-xl mb-8 max-w-2xl mx-auto text-left">
              <span className="material-symbols-outlined align-middle mr-2 text-sm">tips_and_updates</span>
              <span className="text-sm font-medium">{sessionResult.feedback}</span>
            </div>
          )}
          <Button variant="primary" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto px-8 py-12 w-full text-center mt-20 animate-in fade-in">
        <span className="material-symbols-outlined text-6xl text-primary mb-4">task_alt</span>
        <h1 className="font-headline text-4xl font-bold text-white mb-4">Study Session Complete!</h1>
        <p className="text-on-surface-variant mb-2">You scored {correctCount} out of {MAX_QUESTIONS} correct.</p>
        <p className="text-on-surface-variant mb-6">Your overall mastery for this topic is now <span className="text-secondary font-bold">{sessionResult.masteryScore}%</span>.</p>
        {sessionResult.feedback && (
          <div className="bg-surface-container border border-outline-variant/10 text-on-surface-variant p-4 rounded-xl mb-8 max-w-2xl mx-auto text-left">
            <span className="material-symbols-outlined align-middle mr-2 text-sm text-secondary">analytics</span>
            <span className="text-sm">{sessionResult.feedback}</span>
          </div>
        )}
        <Button variant="primary" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 mt-32">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-secondary border-t-transparent animate-spin mx-auto mb-4 shadow-[0_0_15px_#a5e7ff]"></div>
          <p className="text-secondary font-bold tracking-widest uppercase text-sm">Generating Cosmic Problem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-12 w-full">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/dashboard')} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="font-headline text-3xl font-bold text-white capitalize">{topicId.replace('-', ' ')}</h1>
          <p className="text-sm text-secondary font-medium mt-1">Session Progress: {sessionCount + 1} / {MAX_QUESTIONS}</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-t-4 border-t-primary">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline text-xl text-white font-bold">Dynamic Exercise</h2>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">Level {level}</span>
          </div>
          <p className="text-on-surface text-lg leading-relaxed mb-6">{exercise.question}</p>
          
          {exercise.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {exercise.options.map((opt, i) => (
                <button 
                  key={i} 
                  onClick={() => !evaluating && !evaluation && setAnswer(opt)}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    answer === opt 
                      ? 'bg-secondary/20 border-secondary text-white' 
                      : 'bg-surface-container border-outline-variant/10 text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {!exercise.options && (
              <textarea 
                className="w-full h-32 bg-surface-container-highest border-none rounded-2xl p-6 text-on-surface focus:ring-2 focus:ring-secondary transition-all outline-none resize-none"
                placeholder="Type your hypothesis here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={evaluating || evaluation}
              />
            )}
            
            {showHint && exercise.hint && (
              <div className="p-4 bg-tertiary/10 border border-tertiary/30 rounded-xl flex gap-3 text-tertiary animate-in fade-in">
                <span className="material-symbols-outlined text-sm mt-0.5">lightbulb</span>
                <p className="text-sm">{exercise.hint}</p>
              </div>
            )}

            {!evaluation && (
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => setShowHint(true)}
                  className={`text-secondary text-sm flex items-center gap-2 transition-colors ${showHint ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}
                  disabled={showHint}
                >
                  <span className="material-symbols-outlined text-lg">science</span> Need Hint?
                </button>
                <Button variant="primary" onClick={handleSubmit} disabled={!answer.trim() || evaluating}>
                  {evaluating ? 'Analyzing...' : 'Submit'}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {evaluation && (
          <Card className={`border-l-4 ${!evaluation.isRelevant ? 'border-l-error' : evaluation.isCorrect ? 'border-l-secondary' : 'border-l-tertiary'} bg-surface-container/50 animate-in fade-in slide-in-from-bottom-4`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black ${
                !evaluation.isRelevant ? 'bg-error/20 text-error' : evaluation.isCorrect ? 'bg-secondary/20 text-secondary' : 'bg-tertiary/20 text-tertiary'
              }`}>
                {!evaluation.isRelevant ? '!' : evaluation.score}
              </div>
              <div className="flex-1">
                <h3 className="font-headline text-white font-bold mb-2">
                  {!evaluation.isRelevant ? 'Off-topic Detected' : 'AI Feedback'}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-4">{evaluation.feedback}</p>
                {evaluation.correction && evaluation.isRelevant && (
                  <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 mb-4">
                    <span className="text-xs text-primary font-bold uppercase block mb-1">Suggested Correction</span>
                    <p className="text-on-surface text-sm">{evaluation.correction}</p>
                  </div>
                )}
                
                <div className="mt-6 flex justify-end gap-3">
                  {!evaluation.isCorrect && (
                    <Button variant="secondary" onClick={handleRetry}>Retry</Button>
                  )}
                  {sessionCount + 1 >= MAX_QUESTIONS ? (
                    <Button variant="primary" onClick={handleFinishSession} disabled={completing}>
                      {completing ? 'Completing...' : 'Finish Session'}
                    </Button>
                  ) : (
                    <Button variant={evaluation.isCorrect ? "primary" : "outline"} onClick={handleNext}>Next Exercise</Button>
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
