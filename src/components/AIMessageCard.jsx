import React from 'react';

const AIMessageCard = ({ 
  question,
  message,
  cardType = "DIAGNOSTIC QUESTION",
  className = '' 
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Main Card Container - Handles unified hover state */}
      <div
        className={`
          group relative overflow-hidden 
          bg-white/30 backdrop-blur-md
          border border-white/40 shadow-xl
          p-8 md:p-10 rounded-xl
          transition-all duration-300 ease-in-out
          hover:bg-white/35 hover:shadow-2xl hover:-translate-y-1
        `}
      >
        {/* Diagnostic Question Tab - Right Aligned */}
        <div className="absolute top-0 right-0 -mt-3 mr-6">
          <div 
            className="
              bg-white/40 backdrop-blur-md
              border border-white/50 shadow-lg
              px-4 py-2 rounded-t-lg
              transition-all duration-300 ease-in-out
              group-hover:bg-white/45 group-hover:shadow-xl group-hover:-translate-y-1
            "
          >
            {/* Tab inner glow */}
            <div className="absolute inset-0 rounded-t-lg bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
            
            <span 
              className="relative z-10 text-xs font-bold tracking-widest uppercase text-sky-800 select-none"
              style={{ 
                fontFamily: 'Inter, sans-serif',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}
            >
              {cardType}
            </span>
          </div>
        </div>

        {/* Subtle inner glow for main card */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* AI's Voice - Conversational Introduction */}
          {message && (
            <div>
              <p 
                className="text-base font-normal leading-relaxed text-slate-500"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {message}
              </p>
            </div>
          )}
          
          {/* Formal Question - Primary Focus */}
          {question && (
            <div className="mt-3">
              <h3 
                className="text-2xl font-bold leading-relaxed text-sky-900"
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
    </div>
  );
};

export default AIMessageCard;