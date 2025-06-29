import React from 'react';

const AIMessageCard = ({ 
  children, 
  message = "This is a placeholder message from the AI assistant. The glassmorphism effect creates a beautiful frosted-glass appearance with excellent readability.",
  cardType = "DIAGNOSTIC QUESTION",
  className = '' 
}) => {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/20 backdrop-blur-md
        border border-white/30
        p-6 shadow-lg
        transition-all duration-300 ease-in-out
        hover:bg-white/25 hover:border-white/40
        ${className}
      `}
    >
      {/* Optional subtle inner glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      {/* Burned-in Card Type Label */}
      <div className="absolute top-0 right-0 h-full flex items-start justify-end pointer-events-none p-4">
        <span 
          className="text-xs font-bold tracking-wider uppercase select-none leading-none opacity-60"
          style={{ 
            fontFamily: 'Inter, sans-serif',
            color: 'var(--color-text)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
          }}
        >
          {cardType}
        </span>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children || (
          <p 
            className="text-slate-100 leading-relaxed text-sm sm:text-base"
            style={{ 
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
              color: 'var(--color-text)'
            }}
          >
            {message}
          </p>
        )}
      </div>
      
    </div>
  );
};

export default AIMessageCard;