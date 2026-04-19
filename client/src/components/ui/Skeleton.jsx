import React from 'react';

export const Skeleton = ({ className = '', variant = 'rect', lines = 1 }) => {
  if (variant === 'circle') {
    return <div className={`skeleton rounded-full ${className}`} />;
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className="skeleton h-4"
            style={{ width: i === lines - 1 ? '60%' : '100%', animationDelay: `${i * 0.1}s` }} 
          />
        ))}
      </div>
    );
  }

  return <div className={`skeleton ${className}`} />;
};

// Full Dashboard skeleton
export const DashboardSkeleton = () => (
  <div className="max-w-7xl mx-auto px-8 py-12 w-full animate-cosmic-fade">
    <div className="mb-12">
      <div className="skeleton h-10 w-80 mb-3" />
      <div className="skeleton h-5 w-48" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-8">
        <div className="glass-card rounded-3xl p-8 border border-outline-variant/10">
          <div className="skeleton h-8 w-56 mb-6" />
          <div className="skeleton h-[400px] w-full rounded-2xl" />
        </div>
      </div>
      <div className="lg:col-span-4 space-y-8">
        <div className="glass-card rounded-3xl p-8 border border-outline-variant/10">
          <div className="skeleton h-6 w-32 mb-4" />
          <div className="skeleton h-3 w-full rounded-full mb-2" />
          <div className="skeleton h-4 w-24 ml-auto" />
        </div>
        <div className="glass-card rounded-3xl p-8 border border-outline-variant/10">
          <div className="skeleton h-6 w-40 mb-4" />
          <div className="space-y-3">
            <div className="skeleton h-14 w-full rounded-xl" />
            <div className="skeleton h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Exercise / Learn skeleton
export const ExerciseSkeleton = () => (
  <div className="max-w-4xl mx-auto px-8 py-12 w-full animate-cosmic-fade">
    <div className="flex items-center gap-4 mb-8">
      <div className="skeleton w-10 h-10 rounded-full" />
      <div className="flex-1">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-4 w-32" />
      </div>
    </div>
    <div className="glass-card rounded-3xl p-8 border border-outline-variant/10">
      <div className="flex justify-between mb-6">
        <div className="skeleton h-6 w-40" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <Skeleton variant="text" lines={3} className="mb-8" />
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
      <div className="flex justify-between">
        <div className="skeleton h-10 w-28" />
        <div className="skeleton h-10 w-24 rounded-full" />
      </div>
    </div>
  </div>
);
