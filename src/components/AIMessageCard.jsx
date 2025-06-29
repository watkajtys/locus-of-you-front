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
        relative overflow-hidden rounded-xl
        bg-white shadow-lg border border-gray-200
        p-6 md:p-8
        transition-all duration-300 ease-in-out
        hover:shadow-xl hover:-translate-y-1
        ${className}
      `}
      style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Subtle inner glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      {/* Card Type Label - similar to answer cards */}
      <div className="absolute top-0 right-0 h-full flex items-start justify-end pointer-events-none p-4 md:p-6">
        <span 
          className="text-xs font-medium tracking-wide uppercase select-none leading-none opacity-60"
          style={{ 
            fontFamily: 'Inter, sans-serif',
            color: 'var(--color-muted)',
          }}
        >
          {cardType}
        </span>
      </div>
      
      {/* Content */}
      <div className="relative z-10 pr-16 md:pr-20">
        {children || (
          <p 
            className="leading-relaxed text-base font-medium"
            style={{ 
              color: 'var(--color-text)',
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