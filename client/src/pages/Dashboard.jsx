import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CircularProgress } from '../components/ui/CircularProgress';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { useNotification } from '../components/ui/Notification';
import { api } from '../api';

const RoadmapGraph = ({ roadmap = [], subjects = [] }) => {
  const navigate = useNavigate();
  const height = Math.max(400, 50 + (roadmap?.length || 0) * 110);
  
  const nodes = (roadmap || []).map((topic, i) => {
    const subject = subjects?.find(s => s.id === topic);
    const mastery = subject ? subject.masteryScore : 0;
    const level = subject ? subject.level : 1;
    const getLevelName = (lvl) => lvl === 1 ? 'Beginner' : lvl === 2 ? 'Intermediate' : 'Advanced';

    return { id: topic, x: 150, y: 55 + i * 110, title: topic.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), mastery, level, levelName: getLevelName(level) };
  });

  return (
    <div className="relative w-full flex justify-center bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden" style={{ height: `${height}px` }}>
      {nodes.length === 0 && (
        <div className="flex items-center justify-center h-full text-on-surface-variant">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl mb-3 opacity-30 block">add_circle</span>
            <p className="text-sm">Add your first topic below to begin your journey</p>
          </div>
        </div>
      )}
      <svg className="w-[340px] h-full absolute inset-0 mx-auto">
        {nodes.map((node, i) => {
          if (i === nodes.length - 1) return null;
          const next = nodes[i + 1];
          return (
            <line
              key={`edge-${i}`}
              x1={node.x} y1={node.y} x2={next.x} y2={next.y}
              stroke={node.mastery > 50 ? '#8a2be2' : '#32353c'}
              strokeWidth="3"
              strokeDasharray={node.mastery > 50 ? 'none' : '6,6'}
              className="transition-all duration-500"
            />
          );
        })}
        {nodes.map((node, i) => {
          const isCurrent = node.mastery > 0 && node.mastery < 100;
          const isComplete = node.mastery >= 100;
          return (
            <g 
              key={`node-${i}`} 
              className="cursor-pointer group" 
              onClick={() => navigate(`/learn/${node.id}`)}
              style={{ animation: `cosmicSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s both` }}
            >
              {/* Glow ring for active nodes */}
              {isCurrent && (
                <circle cx={node.x} cy={node.y} r="30" fill="none" stroke="#47d6ff" strokeWidth="1" opacity="0.3" className="animate-pulse" />
              )}
              <circle
                cx={node.x} cy={node.y} r="22"
                fill={isComplete ? '#8a2be2' : isCurrent ? '#1d2026' : '#1d2026'}
                stroke={isComplete ? '#dcb8ff' : isCurrent ? '#47d6ff' : '#4c4354'}
                strokeWidth="2.5"
                className="transition-all duration-300"
              />
              {/* Progress arc */}
              {node.mastery > 0 && node.mastery < 100 && (
                <circle
                  cx={node.x} cy={node.y} r="22"
                  fill="none" stroke="#47d6ff" strokeWidth="2.5"
                  strokeDasharray={`${(node.mastery / 100) * 138.2} 138.2`}
                  transform={`rotate(-90 ${node.x} ${node.y})`}
                  className="transition-all duration-1000"
                />
              )}
              {/* Checkmark for complete */}
              {isComplete && (
                <text x={node.x} y={node.y + 5} fill="white" textAnchor="middle" fontSize="16" fontWeight="bold">✓</text>
              )}
              {!isComplete && (
                <text x={node.x} y={node.y + 5} fill={isCurrent ? '#47d6ff' : '#988ca0'} textAnchor="middle" fontSize="11" fontWeight="bold">{node.mastery}%</text>
              )}
              <text x={node.x + 42} y={node.y + 2} fill="white" className="font-headline font-bold text-[13px]">
                {node.title}
              </text>
              <text x={node.x + 42} y={node.y + 18} fill="#988ca0" className="font-body text-[11px]">
                {node.levelName} • Level {node.level}
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
  const navigate = useNavigate();
  const notify = useNotification();
  const { user } = useUser();
  const userId = user?.id || 'me';
  const firstName = user?.firstName || 'Navigator';
  const [newTopic, setNewTopic] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => api.getProfile(),
    enabled: !!user
  });

  const { data: progressData } = useQuery({
    queryKey: ['progress', userId],
    queryFn: () => api.getProgress(userId),
    enabled: !!user
  });

  const addTopicMutation = useMutation({
    mutationFn: (topic) => api.addTopic(userId, topic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      setNewTopic('');
      notify.success('Topic Added', `"${newTopic}" has been added to your roadmap!`);
    }
  });

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (newTopic.trim()) {
      addTopicMutation.mutate(newTopic.trim());
    }
  };

  if (isLoading || !profile) return <DashboardSkeleton />;

  const recommendation = progressData?.recommendation;
  const weakZones = progressData?.weakZones || [];
  const overallMastery = progressData?.overallMastery || 0;
  const totalAttempts = progressData?.totalAttempts || 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 w-full">
      {/* Header with streak */}
      <div className="mb-10 stagger-children">
        <h1 className="font-headline text-4xl font-bold text-white mb-2">Welcome back, {firstName}.</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-tertiary/10 border border-tertiary/20 text-tertiary text-sm font-bold">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            {profile.streak} Day Streak
          </span>
          {totalAttempts > 0 && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-sm font-medium">
              <span className="material-symbols-outlined text-base">psychology</span>
              {totalAttempts} Questions Answered
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-6 stagger-children">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="card-interactive text-center py-6">
              <CircularProgress percentage={overallMastery} size={80} label="Overall Mastery" />
            </Card>
            <Card className="card-interactive text-center py-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-3xl">timer</span>
                </div>
                <span className="text-2xl font-black text-white font-headline">{progressData?.timeSpent || '0h'}</span>
                <span className="text-xs text-on-surface-variant font-medium">Study Time</span>
              </div>
            </Card>
            <Card className="card-interactive text-center py-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl">{profile.currentRoadmap.length > 0 ? 'auto_stories' : 'add_circle'}</span>
                </div>
                <span className="text-2xl font-black text-white font-headline">{profile.currentRoadmap.length}</span>
                <span className="text-xs text-on-surface-variant font-medium">Active Topics</span>
              </div>
            </Card>
          </div>

          {/* Roadmap */}
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">route</span>
                Learning Roadmap
              </h2>
              {recommendation && (
                <button 
                  onClick={() => navigate(`/learn/${recommendation.topicId}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold hover:bg-secondary/20 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">assistant_direction</span>
                  Recommended Next
                </button>
              )}
            </div>
            <RoadmapGraph roadmap={profile.currentRoadmap} subjects={profile.subjects} />
          </Card>

          {/* Add Topic */}
          <Card>
            <h3 className="font-headline text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">add_circle</span>
              Add Study Topic
            </h3>
            <form onSubmit={handleAddTopic} className="flex gap-3 items-center">
              <Input 
                value={newTopic} 
                onChange={(e) => setNewTopic(e.target.value)} 
                placeholder="e.g. Astrophysics, Machine Learning, Biology" 
                className="flex-1 py-3 px-4 text-sm"
              />
              <Button type="submit" disabled={addTopicMutation.isPending} className="whitespace-nowrap px-6 py-3 text-sm btn-ripple">
                {addTopicMutation.isPending ? 'Adding...' : 'Add Topic'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6 stagger-children">
          {/* Daily Goal */}
          <Card className="card-interactive bg-gradient-to-br from-primary-container/15 to-transparent">
            <h3 className="font-headline text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
              Daily Goal
            </h3>
            <p className="text-on-surface-variant text-sm mb-4">Complete a study session in any topic to maintain your streak.</p>
            <div className="w-full bg-surface-container-highest rounded-full h-2.5 overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-secondary h-full rounded-full progress-animated shadow-[0_0_10px_rgba(165,231,255,0.4)]" style={{ width: `${Math.min(100, totalAttempts > 0 ? 100 : 0)}%` }} />
            </div>
            <p className="text-right text-xs text-secondary mt-2 font-medium">{totalAttempts > 0 ? 'Goal Met! ✨' : '0/1 Sessions'}</p>
          </Card>

          {/* Weak Zones */}
          {weakZones.length > 0 && (
            <Card className="card-interactive">
              <h3 className="font-headline text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-xl">warning</span>
                Weak Zones
              </h3>
              <div className="space-y-2">
                {weakZones.map((zone, i) => (
                  <div key={i} className="p-3 bg-error-container/8 border border-error/15 rounded-xl flex items-center justify-between group hover:bg-error-container/15 transition-colors">
                    <span className="text-on-error-container font-medium text-sm capitalize">{zone}</span>
                    <button 
                      onClick={() => navigate(`/learn/${zone.replace(/\s+/g, '-').toLowerCase()}`)}
                      className="text-xs text-error hover:text-error-container font-bold transition-colors"
                    >
                      Review →
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Badges */}
          {profile.badges && profile.badges.length > 0 && (
            <Card className="card-interactive">
              <h3 className="font-headline text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                Badges
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.badges.map((badge, i) => (
                  <div 
                    key={badge.id}
                    className="tooltip-trigger flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant/10 hover:border-tertiary/30 transition-all"
                    data-tooltip={badge.name}
                    style={{ animation: `cosmicZoomIn 0.3s ${i * 0.05}s both` }}
                  >
                    <span className="material-symbols-outlined text-tertiary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{badge.icon}</span>
                    <span className="text-xs text-on-surface-variant font-medium">{badge.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="card-interactive">
            <h3 className="font-headline text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => navigate('/chat')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors text-left group">
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">smart_toy</span>
                <span className="text-sm text-on-surface-variant group-hover:text-white transition-colors">Ask AI Tutor</span>
              </button>
              <button onClick={() => navigate('/tasks')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors text-left group">
                <span className="material-symbols-outlined text-secondary group-hover:scale-110 transition-transform">checklist</span>
                <span className="text-sm text-on-surface-variant group-hover:text-white transition-colors">View Tasks</span>
              </button>
              <button onClick={() => navigate('/materials')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors text-left group">
                <span className="material-symbols-outlined text-tertiary group-hover:scale-110 transition-transform">upload_file</span>
                <span className="text-sm text-on-surface-variant group-hover:text-white transition-colors">Upload Materials</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
