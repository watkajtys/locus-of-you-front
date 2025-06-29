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
        relative overflow-hidden rounded-lg
        bg-white/10 backdrop-blur-sm
        border border-white/20
        p-4 shadow-sm
        transition-all duration-200 ease-in-out
        hover:bg-white/15 hover:shadow-md
        ${className}
      `}
    >
      {/* Subtle inner glow - much lighter */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* Softened Card Type Label */}
      <div className="absolute top-0 right-0 h-full flex items-start justify-end pointer-events-none p-3">
        <span 
          className="text-xs font-medium tracking-wide uppercase select-none leading-none opacity-40"
          style={{ 
            fontFamily: 'Inter, sans-serif',
            color: 'var(--color-muted)',
            textShadow: 'none'
          }}
        >
          {cardType}
        </span>
      </div>
      
      {/* Content */}
      <div className="relative z-10 pr-20">
        {children || (
          <p 
            className="leading-relaxed text-sm"
            style={{ 
              color: 'var(--color-text)',
              opacity: '0.85'
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