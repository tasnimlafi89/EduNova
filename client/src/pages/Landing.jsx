import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const Landing = () => {
  const navigate = useNavigate();
  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[#0B0E14]/80 backdrop-blur-md shadow-[0_8px_32px_0_rgba(138,43,226,0.1)]">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-8 h-20">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
            <span className="text-2xl font-bold text-white tracking-widest font-headline">EduNova</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="tertiary" onClick={() => navigate('/sign-in')}>Log In</Button>
            <Button variant="primary" onClick={() => navigate('/sign-up')}>Get Started</Button>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        <section className="relative min-h-[795px] flex items-center justify-center overflow-hidden px-8">
          <div className="absolute inset-0 nebula-mesh opacity-40"></div>
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-container/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary-container/10 rounded-full blur-[120px]"></div>
          <div className="relative z-10 max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container border border-outline-variant/30 text-secondary-fixed-dim text-xs font-semibold tracking-wider uppercase mb-8">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              The Future of Learning is Here
            </div>
            <h1 className="font-headline text-5xl md:text-8xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
              Autonomous <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary-fixed-dim to-primary">AI-Driven Learning</span>
            </h1>
            <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
              Navigate the vast expanse of knowledge with a celestial guide. EduNova tailors every lesson, problem, and path to your unique cognitive signature.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button variant="primary" className="text-lg px-10 py-4" onClick={() => navigate('/sign-up')}>Get Started</Button>
              <Button variant="secondary" onClick={() => navigate('/sign-in')}>Log In</Button>
            </div>
          </div>
        </section>

        <section className="py-24 px-8 max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-white mb-4">Personalized Learning Path</h2>
            <p className="text-on-surface-variant text-lg max-w-xl">Our AI cartographers map your progress in real-time, adapting the difficulty and content delivery to keep you in the flow state.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto">
            <Card className="flex flex-col justify-between group overflow-hidden relative">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-3xl">route</span>
                </div>
                <h3 className="font-headline text-3xl font-bold text-white mb-4">Adaptive Trajectories</h3>
                <p className="text-on-surface-variant text-lg max-w-md">The path shifts as you learn. Master a concept, and the next star system unlocks. Struggle, and the AI provides supportive detours.</p>
              </div>
            </Card>
            <Card className="flex flex-col justify-center text-center relative overflow-hidden group">
              <div className="relative z-10">
                <div className="text-6xl font-black text-primary mb-2">98%</div>
                <div className="text-on-surface font-bold text-xl mb-4">Retention Rate</div>
                <p className="text-on-surface-variant text-sm">Through space-repetition algorithms and context-aware reminders.</p>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </>
  );
};
