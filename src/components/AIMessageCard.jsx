import React from 'react';

const AIMessageCard = ({ 
  question,
  message,
  cardType = "DIAGNOSTIC QUESTION",
  className = '' 
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Main Container - position: relative */}
      <div
        className="
          relative bg-white rounded-xl shadow-lg border border-gray-200
          pt-8 px-8 pb-8 md:px-10 md:pb-10
          transition-all duration-300 ease-in-out
          hover:shadow-xl hover:-translate-y-1
        "
      >
        {/* The Tab - position: absolute */}
        <div 
          className="
            absolute top-0 left-1/2 -translate-y-1/2 -translate-x-1/2
            bg-sky-200 px-4 py-2 rounded-t-lg
            border border-sky-300 border-b-0
            shadow-sm
          "
        >
          <span 
            className="text-xs font-bold tracking-widest uppercase text-sky-800 select-none"
            style={{ 
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {cardType}
          </span>
        </div>
        
        {/* Card Content */}
        <div className="space-y-4">
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