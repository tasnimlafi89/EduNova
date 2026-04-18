import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`glass-card rounded-3xl p-8 border border-outline-variant/10 ${className}`} {...props}>
      {children}
    </div>
  );
};
