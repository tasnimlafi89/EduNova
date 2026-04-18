import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { api } from '../api';

export const ProgressPage = () => {
  const { data: progress, isLoading } = useQuery({
    queryKey: ['progress', 'user-1'],
    queryFn: () => api.getProgress('user-1')
  });

  if (isLoading || !progress) return <div className="p-8 text-on-surface">Loading Analytics...</div>;

  return (
    <div className="max-w-7xl mx-auto px-8 py-12 w-full">
      <div className="mb-12">
        <h1 className="font-headline text-4xl font-bold text-white mb-2">Progress Analytics</h1>
        <p className="text-on-surface-variant">Track your mastery across the digital expanse.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="text-center bg-gradient-to-br from-surface-container to-surface-container-highest">
          <div className="text-4xl font-black text-secondary mb-2">{progress.mastery}%</div>
          <div className="text-on-surface font-bold">Overall Mastery</div>
        </Card>
        <Card className="text-center bg-gradient-to-br from-surface-container to-surface-container-highest">
          <div className="text-4xl font-black text-primary mb-2">{progress.timeSpent}</div>
          <div className="text-on-surface font-bold">Time in Orbit</div>
        </Card>
        <Card className="text-center bg-gradient-to-br from-surface-container to-surface-container-highest">
          <div className="text-4xl font-black text-tertiary mb-2">{progress.weakZones.length}</div>
          <div className="text-on-surface font-bold">Weak Zones Detected</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h3 className="font-headline text-xl font-bold text-white mb-6">Mastery Heatmap</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white">Quantum Mechanics</span>
                <span className="text-secondary">85%</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-2">
                <div className="bg-secondary h-full rounded-full w-[85%] shadow-[0_0_10px_#a5e7ff]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white">Relativity</span>
                <span className="text-primary">60%</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-2">
                <div className="bg-primary h-full rounded-full w-[60%] shadow-[0_0_10px_#dcb8ff]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-error-container">String Theory (Weak Zone)</span>
                <span className="text-error">20%</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-2">
                <div className="bg-error h-full rounded-full w-[20%]"></div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-headline text-xl font-bold text-white mb-6">Recent Activity Log</h3>
          <div className="space-y-4">
            <div className="flex gap-4 items-start pb-4 border-b border-outline-variant/10">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-sm">psychology</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Completed Exercise: Wave-Particle Duality</p>
                <p className="text-on-surface-variant text-xs mt-1">Score: 92/100 • 2 hours ago</p>
              </div>
            </div>
            <div className="flex gap-4 items-start pb-4 border-b border-outline-variant/10">
              <div className="w-10 h-10 rounded-full bg-secondary/20 text-secondary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-sm">forum</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Tutor Session: Schrödinger's Cat</p>
                <p className="text-on-surface-variant text-xs mt-1">Resolved misconception • Yesterday</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
