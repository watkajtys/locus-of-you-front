import React from 'react';

const AIMessageCard = ({ 
  question,
  message,
  cardType = "DIAGNOSTIC QUESTION",
  className = '' 
}) => {
  return (
    <div
      className={`
        relative overflow-hidden rounded-xl
        bg-white/30 backdrop-blur-md
        border border-white/40 shadow-xl
        p-8 md:p-10
        transition-all duration-300 ease-in-out
        hover:bg-white/35 hover:shadow-2xl hover:-translate-y-1
        ${className}
      `}
    >
      {/* Subtle inner glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      
      {/* Burned-in Card Type Label - More Subtle */}
      <div className="absolute top-0 right-0 h-full flex items-start justify-end pointer-events-none p-6">
        <span 
          className="text-xs font-bold tracking-widest uppercase text-sky-800/40 select-none leading-none"
          style={{ 
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {cardType}
        </span>
      </div>
      
      {/* Content */}
      <div className="relative z-10 space-y-6">
        {/* AI Commentary/Message */}
        {message && (
          <div>
            <p 
              className="text-base font-normal leading-relaxed text-sky-900/80"
              style={{ 
                fontFamily: 'Inter, sans-serif',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}
            >
              {message}
            </p>
          </div>
        )}
        
        {/* Main Question */}
        {question && (
          <div>
            <h3 
              className="text-xl md:text-2xl font-bold leading-relaxed text-sky-900"
              style={{ 
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              {question}
            </h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMessageCard;