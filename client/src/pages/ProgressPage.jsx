import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Card } from '../components/ui/Card';
import { CircularProgress } from '../components/ui/CircularProgress';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { api } from '../api';

// Mini bar chart component
const WeeklyChart = ({ data = [] }) => {
  const maxSessions = Math.max(...data.map(d => d.sessions), 1);
  
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-secondary font-bold">{d.sessions > 0 ? d.score + '%' : ''}</span>
          <div className="w-full bg-surface-container-highest rounded-t-lg overflow-hidden flex flex-col justify-end" style={{ height: '80px' }}>
            <div 
              className="bg-gradient-to-t from-primary to-secondary rounded-t-lg transition-all duration-700"
              style={{ 
                height: `${(d.sessions / maxSessions) * 100}%`,
                minHeight: d.sessions > 0 ? '4px' : '0px',
                animationDelay: `${i * 0.1}s` 
              }}
            />
          </div>
          <span className="text-[10px] text-on-surface-variant font-medium">{d.day}</span>
        </div>
      ))}
    </div>
  );
};

// Trend indicator
const TrendBadge = ({ trend }) => {
  const config = {
    improving: { icon: 'trending_up', color: 'text-secondary bg-secondary/10 border-secondary/20', label: 'Improving' },
    declining: { icon: 'trending_down', color: 'text-error bg-error/10 border-error/20', label: 'Declining' },
    stable: { icon: 'trending_flat', color: 'text-on-surface-variant bg-surface-container border-outline-variant/10', label: 'Stable' }
  };
  const c = config[trend] || config.stable;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.color}`}>
      <span className="material-symbols-outlined text-xs">{c.icon}</span>
      {c.label}
    </span>
  );
};

export const ProgressPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const userId = user?.id || 'me';
  const { data: progress, isLoading } = useQuery({
    queryKey: ['progress', userId],
    queryFn: () => api.getProgress(userId),
    enabled: !!user
  });

  if (isLoading || !progress) return <DashboardSkeleton />;

  const topicBreakdown = progress.topicBreakdown || [];
  const recentActivity = progress.recentActivity || [];
  const weeklyData = progress.weeklyData || [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 w-full animate-cosmic-fade">
      <div className="mb-10">
        <h1 className="font-headline text-4xl font-bold text-white mb-2">Progress Analytics</h1>
        <p className="text-on-surface-variant">Real-time performance tracking across all your topics.</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 stagger-children">
        <Card className="card-interactive text-center py-6">
          <CircularProgress percentage={progress.overallMastery || 0} size={80} label="Overall Mastery" />
        </Card>
        <Card className="card-interactive text-center py-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">timer</span>
            </div>
            <span className="text-2xl font-black text-white font-headline">{progress.timeSpent || '0h'}</span>
            <span className="text-xs text-on-surface-variant font-medium">Total Study Time</span>
          </div>
        </Card>
        <Card className="card-interactive text-center py-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-2xl">psychology</span>
            </div>
            <span className="text-2xl font-black text-white font-headline">{progress.totalAttempts || 0}</span>
            <span className="text-xs text-on-surface-variant font-medium">Questions Answered</span>
          </div>
        </Card>
        <Card className="card-interactive text-center py-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-error text-2xl">warning</span>
            </div>
            <span className="text-2xl font-black text-white font-headline">{(progress.weakZones || []).length}</span>
            <span className="text-xs text-on-surface-variant font-medium">Weak Zones</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <Card className="card-interactive">
          <h3 className="font-headline text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">bar_chart</span>
            Weekly Activity
          </h3>
          {weeklyData.length > 0 ? (
            <WeeklyChart data={weeklyData} />
          ) : (
            <div className="h-32 flex items-center justify-center text-on-surface-variant text-sm">
              <p>Complete some exercises to see your weekly trends!</p>
            </div>
          )}
        </Card>

        {/* Topic Mastery Breakdown */}
        <Card className="card-interactive">
          <h3 className="font-headline text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            Topic Mastery
          </h3>
          {topicBreakdown.length > 0 ? (
            <div className="space-y-4">
              {topicBreakdown.map((t, i) => (
                <div key={t.topicId} className="group" style={{ animation: `cosmicSlideUp 0.4s ${i * 0.08}s both` }}>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium capitalize">{t.name}</span>
                      <TrendBadge trend={t.trend} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-on-surface-variant">{t.totalAttempts} attempts</span>
                      <span className={`font-bold ${t.accuracy >= 70 ? 'text-secondary' : t.accuracy >= 40 ? 'text-primary' : 'text-error'}`}>
                        {t.accuracy}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full progress-animated ${
                        t.accuracy >= 70 ? 'bg-secondary shadow-[0_0_8px_rgba(165,231,255,0.4)]' : 
                        t.accuracy >= 40 ? 'bg-primary shadow-[0_0_8px_rgba(220,184,255,0.4)]' : 
                        'bg-error'
                      }`}
                      style={{ width: `${t.accuracy}%`, animationDelay: `${i * 0.1}s` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-on-surface-variant text-sm py-8">
              <span className="material-symbols-outlined text-3xl mb-2 opacity-30 block">school</span>
              <p>Start studying topics to see your mastery breakdown.</p>
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card className="card-interactive">
          <h3 className="font-headline text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">history</span>
            Recent Activity
          </h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div 
                  key={i} 
                  className="flex gap-3 items-start p-3 rounded-xl bg-surface-container-low/50 hover:bg-surface-container transition-colors"
                  style={{ animation: `cosmicSlideRight 0.4s ${i * 0.06}s both` }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'upload' ? 'bg-tertiary/15 text-tertiary' :
                    activity.isCorrect ? 'bg-secondary/15 text-secondary' : 'bg-error/15 text-error'
                  }`}>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {activity.type === 'upload' ? 'upload_file' : activity.isCorrect ? 'check' : 'close'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{activity.questionPreview}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-on-surface-variant text-xs capitalize">{activity.topicId?.replace(/-/g, ' ')}</span>
                      {activity.score !== undefined && (
                        <span className="text-xs text-primary font-bold">Score: {activity.score}</span>
                      )}
                      <span className="text-on-surface-variant text-[10px]">
                        {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-on-surface-variant text-sm py-8">
              <span className="material-symbols-outlined text-3xl mb-2 opacity-30 block">timeline</span>
              <p>Your activity will appear here as you study.</p>
            </div>
          )}
        </Card>

        {/* AI Recommendation */}
        {progress.recommendation && (
          <Card className="card-interactive bg-gradient-to-br from-primary-container/10 to-secondary/5">
            <h3 className="font-headline text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>assistant</span>
              AI Recommendation
            </h3>
            <p className="text-on-surface-variant text-sm mb-4">{progress.recommendation.reason}</p>
            <button 
              onClick={() => navigate(`/learn/${progress.recommendation.topicId}`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm font-bold hover:bg-secondary/20 transition-all"
            >
              <span className="material-symbols-outlined text-base">play_arrow</span>
              Study {progress.recommendation.topicId.replace(/-/g, ' ')}
            </button>
          </Card>
        )}
      </div>
    </div>
  );
};
