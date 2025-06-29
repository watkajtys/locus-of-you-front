import React from 'react';

const AIMessageCard = ({ 
  question,
  message,
  cardType = "DIAGNOSTIC QUESTION",
  className = '' 
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* File Folder Tab */}
      <div className="relative z-10 flex justify-center">
        <div className="bg-sky-200 px-4 py-2 rounded-t-lg border-l border-r border-t border-sky-300/30">
          <span className="text-xs font-bold tracking-widest uppercase text-sky-800 select-none">
            {cardType}
          </span>
        </div>
      </div>
      
      {/* Main Card */}
      <div
        className={`
          relative overflow-hidden 
          bg-white/30 backdrop-blur-md
          border border-white/40 shadow-xl
          p-8 md:p-10 -mt-px
          transition-all duration-300 ease-in-out
          hover:bg-white/35 hover:shadow-2xl hover:-translate-y-1
        `}
        style={{
          borderTopRightRadius: '0.75rem',
          borderTopLeftRadius: '0.75rem',
          borderBottomLeftRadius: '0.75rem',
          borderBottomRightRadius: '0.75rem'
        }}
      >
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" 
             style={{
               borderTopRightRadius: '0.75rem',
               borderTopLeftRadius: '0.75rem',
               borderBottomLeftRadius: '0.75rem',
               borderBottomRightRadius: '0.75rem'
             }} />
        
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