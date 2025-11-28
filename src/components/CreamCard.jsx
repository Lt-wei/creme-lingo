import React from 'react';

const CreamCard = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        relative 
        bg-cream-card 
        backdrop-blur-md 
        rounded-xl-card 
        shadow-cream 
        border border-white/50 
        p-6 
        transition-all duration-300 
        hover:shadow-cream-hover 
        hover:-translate-y-1
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      {children}
    </div>
  );
};

export default CreamCard;