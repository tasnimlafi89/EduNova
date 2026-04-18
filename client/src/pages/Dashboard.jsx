import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { api } from '../api';
import { useStore } from '../store/useStore';

const RoadmapGraph = ({ roadmap }) => {
  const navigate = useNavigate();
  // Simple vertical graph layout
  const nodes = roadmap.map((topic, i) => ({
    id: topic,
    x: 150,
    y: 50 + i * 100,
    title: topic.replace('-', ' ').toUpperCase(),
    mastery: i === 0 ? 100 : i === 1 ? 40 : 0
  }));

  return (
    <div className="relative w-full h-[400px] flex justify-center bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden">
      <svg className="w-[300px] h-full absolute inset-0 mx-auto">
        {nodes.map((node, i) => {
          if (i === nodes.length - 1) return null;
          const next = nodes[i + 1];
          return (
            <line
              key={`edge-${i}`}
              x1={node.x} y1={node.y}
              x2={next.x} y2={next.y}
              stroke={node.mastery > 50 ? '#8a2be2' : '#32353c'}
              strokeWidth="4"
              strokeDasharray={node.mastery > 50 ? 'none' : '5,5'}
            />
          );
        })}
        {nodes.map((node, i) => {
          const isCurrent = node.mastery > 0 && node.mastery < 100;
          return (
            <g 
              key={`node-${i}`} 
              className="cursor-pointer" 
              onClick={() => navigate(`/learn/${node.id}`)}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r="24"
                fill={node.mastery === 100 ? '#8a2be2' : isCurrent ? '#47d6ff' : '#1d2026'}
                stroke={node.mastery === 100 ? '#dcb8ff' : '#4c4354'}
                strokeWidth="2"
                className="transition-all hover:r-[28]"
              />
              <text x={node.x + 40} y={node.y + 5} fill="white" className="font-headline font-bold text-sm">
                {node.title}
              </text>
              <text x={node.x + 40} y={node.y + 20} fill="#cfc2d7" className="font-body text-xs">
                Mastery: {node.mastery}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const Dashboard = () => {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'user-1'],
    queryFn: () => api.getProfile('user-1')
  });

  if (isLoading || !profile) return <div className="p-8 text-on-surface">Loading Dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-8 py-12 w-full">
      <div className="mb-12">
        <h1 className="font-headline text-4xl font-bold text-white mb-2">Welcome back, Navigator.</h1>
        <p className="text-on-surface-variant">Your current streak: <span className="text-tertiary font-bold">{profile.streak} Days 🔥</span></p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline text-2xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">route</span>
                Personalized Roadmap
              </h2>
            </div>
            <RoadmapGraph roadmap={profile.currentRoadmap} />
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="bg-gradient-to-br from-primary-container/20 to-transparent">
            <h3 className="font-headline text-xl font-bold text-white mb-2">Daily Goal</h3>
            <p className="text-on-surface-variant text-sm mb-6">Complete 3 exercises in Quantum Mechanics to maintain your trajectory.</p>
            <div className="w-full bg-surface-container-highest rounded-full h-3 overflow-hidden">
              <div className="bg-secondary h-full rounded-full w-[33%] shadow-[0_0_10px_#a5e7ff]"></div>
            </div>
            <p className="text-right text-xs text-secondary mt-2">1/3 Completed</p>
          </Card>

          <Card>
            <h3 className="font-headline text-xl font-bold text-white mb-4">Weak Zones Detected</h3>
            <div className="space-y-3">
              <div className="p-3 bg-error-container/10 border border-error/20 rounded-xl flex items-center justify-between">
                <span className="text-error-container font-medium text-sm">Wave-Particle Duality</span>
                <Button variant="tertiary" className="text-xs px-2 py-1 !text-error hover:!text-error-container">Review</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
