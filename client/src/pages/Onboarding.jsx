import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { api } from '../api';
import { useStore } from '../store/useStore';

export const Onboarding = () => {
  const navigate = useNavigate();
  const setStudent = useStore((state) => state.setStudent);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const questions = [
    { q: "What is the speed of light?", options: ["300,000 km/s", "150,000 km/s", "Sonic"] },
    { q: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter"] }
  ];

  const handleNext = async () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      const res = await api.evaluateOnboarding([]);
      setStudent({ level: res.initialLevel, id: 'user-1' });
      setLoading(false);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden bg-surface-container-lowest">
      <div className="absolute inset-0 nebula-mesh opacity-20"></div>
      
      <Card className="max-w-2xl w-full z-10 p-12">
        <div className="text-center mb-8">
          <span className="material-symbols-outlined text-primary text-5xl mb-4">explore</span>
          <h1 className="font-headline text-3xl font-bold text-white mb-2">Diagnostic Assessment</h1>
          <p className="text-on-surface-variant">Let's calibrate your celestial map.</p>
        </div>

        {!loading ? (
          <div className="space-y-6">
            <h2 className="text-xl text-white font-medium mb-4">{questions[step].q}</h2>
            <div className="space-y-3">
              {questions[step].options.map((opt, i) => (
                <button 
                  key={i} 
                  onClick={handleNext}
                  className="w-full text-left p-4 rounded-2xl bg-surface-container hover:bg-surface-container-highest border border-outline-variant/10 text-on-surface transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-primary font-bold animate-pulse">Calculating Optimal Trajectory...</p>
          </div>
        )}
      </Card>
    </div>
  );
};
