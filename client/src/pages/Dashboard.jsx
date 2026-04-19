import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../api';
import { useStore } from '../store/useStore';

const RoadmapGraph = ({ roadmap, subjects = [] }) => {
  const navigate = useNavigate();
  // Dynamic height based on roadmap size
  const height = Math.max(400, 50 + roadmap.length * 100);
  
  const nodes = roadmap.map((topic, i) => {
    const subject = subjects.find(s => s.id === topic);
    const mastery = subject ? subject.masteryScore : 0;
    const level = subject ? subject.level : 1;
    
    const getLevelName = (lvl) => {
      if (lvl === 1) return 'Beginner';
      if (lvl === 2) return 'Intermediate';
      return 'Advanced';
    };

    return {
      id: topic,
      x: 150,
      y: 50 + i * 100,
      title: topic.replace('-', ' ').toUpperCase(),
      mastery,
      levelName: getLevelName(level)
    };
  });

  return (
    <div className="relative w-full flex justify-center bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden" style={{ height: `${height}px` }}>
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
              <text x={node.x + 40} y={node.y + 22} fill="#cfc2d7" className="font-body text-xs">
                {node.levelName} • Mastery: <tspan fill="#47d6ff" fontWeight="bold">{node.mastery}%</tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const Dashboard = () => {
  const queryClient = useQueryClient();
  const [newTopic, setNewTopic] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'user-1'],
    queryFn: () => api.getProfile('user-1')
  });

  const addTopicMutation = useMutation({
    mutationFn: (topic) => api.addTopic('user-1', topic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'user-1'] });
      setNewTopic('');
    }
  });

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (newTopic.trim()) {
      addTopicMutation.mutate(newTopic.trim());
    }
  };

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
            <RoadmapGraph roadmap={profile.currentRoadmap} subjects={profile.subjects} />
          </Card>

          <Card>
            <h3 className="font-headline text-xl font-bold text-white mb-4">Add Study Topic</h3>
            <form onSubmit={handleAddTopic} className="flex gap-4 items-center">
              <Input 
                value={newTopic} 
                onChange={(e) => setNewTopic(e.target.value)} 
                placeholder="e.g. Astrophysics, Linear Algebra" 
                className="flex-1 py-3 px-4 text-sm"
              />
              <Button type="submit" disabled={addTopicMutation.isPending} className="whitespace-nowrap px-6 py-3 text-sm">
                {addTopicMutation.isPending ? 'Adding...' : 'Add Topic'}
              </Button>
            </form>
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
