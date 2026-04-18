import React from 'react';

export const Input = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <input 
      ref={ref}
      className={`w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-secondary transition-all outline-none ${className}`} 
      {...props} 
    />
  );
});

Input.displayName = 'Input';
