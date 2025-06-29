import React from 'react';

const AIMessageCard = ({ 
  question,
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
      
      {/* Burned-in Tag Background */}
      <div className="absolute left-0 top-0 h-full flex items-start justify-start pointer-events-none p-6">
        <span 
          className="text-6xl md:text-7xl font-black text-sky-200/30 select-none leading-none transform -translate-x-2 -translate-y-1"
          style={{ 
            fontFamily: 'Inter, sans-serif',
          }}
        >
          ?
        </span>
      </div>
      
      {/* Content */}
      <div className="relative z-10 space-y-4">
        {/* Card Type Tag */}
        <div className="inline-block">
          <span 
            className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-sky-600/20 text-sky-800 border border-sky-300/30"
            style={{ 
              fontFamily: 'Inter, sans-serif',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}
          >
            {cardType}
          </span>
        </div>
        
        {/* Question Text */}
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
      </div>
    </div>
  );
};

export default AIMessageCard;