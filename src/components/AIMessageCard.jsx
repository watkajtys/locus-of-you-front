import React from 'react';

const AIMessageCard = ({ 
  question,
  message,
  paragraph,
  cardType = "DIAGNOSTIC QUESTION",
  className = '' 
}) => {
  // Determine tab background color based on cardType
  const getTabBackgroundColor = (cardType) => {
    switch (cardType) {
      case 'YOUR AI COACH':
        return 'bg-gradient-to-r from-blue-500 to-purple-500'; // Gradient background for AI coach
      case 'MY OBSERVATION':
        return 'bg-amber-100'; // Warm color for observations
      case 'YOUR FIRST MICRO-VICTORY':
        return 'bg-green-100'; // Success/achievement color
      default:
        return 'bg-slate-100'; // Default color
    }
  };

  // Determine tab text color based on background
  const getTabTextColor = (cardType) => {
    switch (cardType) {
      case 'YOUR AI COACH':
        return 'text-white'; // White text on gradient
      case 'MY OBSERVATION':
        return 'text-amber-700'; // Dark amber text
      case 'YOUR FIRST MICRO-VICTORY':
        return 'text-green-700'; // Dark green text
      default:
        return 'text-slate-600'; // Default color
    }
  };

  // Determine tab border color
  const getTabBorderColor = (cardType) => {
    switch (cardType) {
      case 'YOUR AI COACH':
        return 'border-blue-300'; // Complement the gradient
      case 'MY OBSERVATION':
        return 'border-amber-200';
      case 'YOUR FIRST MICRO-VICTORY':
        return 'border-green-200';
      default:
        return 'border-slate-200';
    }
  };

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
          className={`
            absolute top-0 right-0 -translate-y-1/2
            ${getTabBackgroundColor(cardType)} px-4 py-0.5 
            rounded-tl-lg rounded-tr-lg
            border ${getTabBorderColor(cardType)} border-b-0
            shadow-sm
          `}
        >
          <span 
            className={`text-xs font-semibold tracking-widest uppercase select-none ${getTabTextColor(cardType)}`}
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