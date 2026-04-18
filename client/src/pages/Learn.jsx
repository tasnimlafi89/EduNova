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
  
  // Session tracking
  const MAX_QUESTIONS = 3;
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    loadExercise();
  }, [topicId]);

  const loadExercise = async () => {
    if (sessionCount >= MAX_QUESTIONS) return;
    
    setLoading(true);
    setEvaluation(null);
    setAnswer('');
    setShowHint(false);
    
    // Vary question types
    const types = ['open-ended', 'MCQ'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const data = await api.generateExercise(topicId, 2, type);
    setExercise(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setEvaluating(true);
    
    // Pass studentId 'user-1' to track progress on backend
    const data = await api.evaluateAnswer(exercise.question, answer, topicId, 2, 'user-1');
    setEvaluation(data);
    setEvaluating(false);
    setSessionCount(prev => prev + 1);
  };

  if (sessionCount >= MAX_QUESTIONS && !evaluation) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-12 w-full text-center mt-20">
        <span className="material-symbols-outlined text-6xl text-primary mb-4">task_alt</span>
        <h1 className="font-headline text-4xl font-bold text-white mb-4">Study Session Complete!</h1>
        <p className="text-on-surface-variant mb-8">You've completed {MAX_QUESTIONS} exercises. Your mastery for this topic has been updated.</p>
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
          <p className="text-sm text-secondary font-medium mt-1">Session Progress: {sessionCount + (evaluation ? 0 : 1)} / {MAX_QUESTIONS}</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-t-4 border-t-primary">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline text-xl text-white font-bold">Dynamic Exercise</h2>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">Level 2</span>
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
              <div className="p-4 bg-tertiary/10 border border-tertiary/30 rounded-xl flex gap-3 text-tertiary">
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
          <Card className={`border-l-4 ${!evaluation.isRelevant ? 'border-l-error' : evaluation.score > 70 ? 'border-l-secondary' : 'border-l-tertiary'} bg-surface-container/50 animate-in fade-in slide-in-from-bottom-4`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black ${
                !evaluation.isRelevant ? 'bg-error/20 text-error' : evaluation.score > 70 ? 'bg-secondary/20 text-secondary' : 'bg-tertiary/20 text-tertiary'
              }`}>
                {!evaluation.isRelevant ? '!' : evaluation.score}
              </div>
              <div className="flex-1">
                <h3 className="font-headline text-white font-bold mb-2">
                  {!evaluation.isRelevant ? 'Off-topic Detected' : 'AI Feedback'}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-4">{evaluation.feedback}</p>
                {evaluation.correction && evaluation.isRelevant && (
                  <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20">
                    <span className="text-xs text-primary font-bold uppercase block mb-1">Suggested Correction</span>
                    <p className="text-on-surface text-sm">{evaluation.correction}</p>
                  </div>
                )}
                <div className="mt-6 flex justify-end">
                  {sessionCount >= MAX_QUESTIONS ? (
                    <Button variant="primary" onClick={() => navigate('/dashboard')}>Finish Session</Button>
                  ) : (
                    <Button variant="secondary" onClick={loadExercise}>Next Exercise</Button>
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
