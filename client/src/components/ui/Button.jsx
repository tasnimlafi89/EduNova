import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  let baseClass = "transition-all active:scale-95 font-bold rounded-full ";
  
  if (variant === 'primary') {
    baseClass += "bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-2.5 shadow-[0_0_15px_rgba(138,43,226,0.4)] hover:shadow-[0_0_25px_rgba(138,43,226,0.6)] ";
  } else if (variant === 'secondary') {
    baseClass += "px-10 py-4 border border-secondary-fixed-dim/30 text-secondary-fixed-dim hover:bg-secondary-fixed-dim/10 shadow-[0_0_15px_rgba(71,214,255,0.1)] hover:shadow-[0_0_30px_rgba(71,214,255,0.2)] ";
  } else if (variant === 'tertiary') {
    baseClass = "text-[#dcb8ff] font-medium px-4 py-2 hover:text-white transition-colors ";
  }

  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {children}
    </button>
  );
};
