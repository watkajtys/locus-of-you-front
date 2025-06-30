import React from 'react';

const AIMessageCard = ({ 
  question,
  message,
  paragraph,
  cardType = "DIAGNOSTIC QUESTION",
  className = '' 
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Main Container - position: relative */}
      <div
        className="
          relative bg-white shadow-lg border border-gray-200
          rounded-tl-xl rounded-bl-xl rounded-br-xl
          pt-8 px-8 pb-8 md:px-10 md:pb-10
          transition-all duration-300 ease-in-out
          hover:shadow-xl hover:-translate-y-1
        "
      >
        {/* The Tab - position: absolute, right-aligned */}
        <div 
          className="
            absolute top-0 right-0 -translate-y-1/2
            bg-slate-100 px-4 py-0.5 
            rounded-tl-lg rounded-tr-lg
            border border-slate-200 border-b-0
            shadow-sm
          "
        >
          <span 
            className="text-xs font-semibold tracking-widest uppercase select-none text-slate-600"
            style={{ 
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {cardType}
          </span>
        </div>
        
        {/* Card Content */}
        <div className="space-y-2">
          {/* AI's Voice - Conversational Introduction */}
          {message && (
            <div>
              <p 
                className="text-sm font-normal leading-relaxed text-slate-400"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {message}
              </p>
            </div>
          )}
          
          {/* Paragraph Text - Medium Size */}
          {paragraph && (
            <div>
              <p 
                className="text-lg font-normal leading-relaxed text-slate-700"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {paragraph}
              </p>
            </div>
          )}
          
          {/* Formal Question - Primary Focus */}
          {question && (
            <div>
              <h3 
                className="text-2xl font-bold leading-relaxed text-slate-800"
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