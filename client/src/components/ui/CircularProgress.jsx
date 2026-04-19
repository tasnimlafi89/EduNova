import React, { useEffect, useState } from 'react';

export const CircularProgress = ({ percentage = 0, size = 96, strokeWidth = 6, label, color = 'text-primary', delay = 0 }) => {
  const [animatedPct, setAnimatedPct] = useState(0);
  const radius = (size / 2) - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPct / 100) * circumference;
  const center = size / 2;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(percentage), delay + 100);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  const getColor = () => {
    if (animatedPct >= 70) return '#a5e7ff';    // secondary
    if (animatedPct >= 40) return '#dcb8ff';     // primary  
    return '#ffb4ab';                             // error
  };

  return (
    <div className="flex flex-col items-center gap-2" style={{ width: size, height: size + 28 }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={center} cy={center} r={radius}
            fill="transparent"
            stroke="#272a31"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center} cy={center} r={radius}
            fill="transparent"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="circular-progress-track"
            style={{ filter: `drop-shadow(0 0 6px ${getColor()}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-headline font-bold text-white" style={{ fontSize: size * 0.2 }}>
            {Math.round(animatedPct)}%
          </span>
        </div>
      </div>
      {label && (
        <p className="text-xs text-on-surface-variant font-medium tracking-wide text-center leading-tight">{label}</p>
      )}
    </div>
  );
};
