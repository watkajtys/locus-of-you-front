import React from 'react';

const AIMessageCard = ({ 
  children, 
  message = "This is a placeholder message from the AI assistant. The glassmorphism effect creates a beautiful frosted-glass appearance with excellent readability.",
  showDiagnostic = false,
  diagnosticData = {
    question: "WHAT PSYCHOLOGICAL PATTERN IS THE USER EXHIBITING?",
    observation: "USER DEMONSTRATES HESITATION PATTERNS INDICATING INTERNAL VS EXTERNAL LOCUS EVALUATION",
    intervention: "DEPLOY GENTLE REFRAMING TECHNIQUE WITH VALIDATION-BASED APPROACH"
  },
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
      
      {/* AI Diagnostic Overlay */}
      {showDiagnostic && (
        <div className="absolute top-3 right-3 w-80 max-w-[calc(100%-24px)]">
          <div
            className="
              relative overflow-hidden rounded-lg
              bg-black/40 backdrop-blur-sm
              border border-red-500/30
              p-3 shadow-lg
              transition-all duration-300 ease-in-out
              group
            "
          >
            {/* Diagnostic Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-xs font-mono tracking-wider">
                  AI DIAGNOSTIC ACTIVE
                </span>
              </div>
              <div className="w-1 h-1 rounded-full bg-red-500/60" />
            </div>
            
            {/* Diagnostic Content */}
            <div className="space-y-2 text-xs font-mono leading-tight">
              {/* Diagnostic Question */}
              <div className="relative">
                <div className="text-amber-400/80 mb-1 tracking-wide">
                  DIAGNOSTIC QUESTION:
                </div>
                <div className="text-amber-200/90 pl-2 relative">
                  {/* Burn-in effect background */}
                  <div className="absolute inset-0 text-amber-400/20 select-none pointer-events-none">
                    {diagnosticData.question}
                  </div>
                  <div className="relative z-10">
                    {diagnosticData.question}
                  </div>
                </div>
              </div>
              
              {/* Observation */}
              <div className="relative">
                <div className="text-cyan-400/80 mb-1 tracking-wide">
                  OBSERVATION:
                </div>
                <div className="text-cyan-200/90 pl-2 relative">
                  {/* Burn-in effect background */}
                  <div className="absolute inset-0 text-cyan-400/20 select-none pointer-events-none">
                    {diagnosticData.observation}
                  </div>
                  <div className="relative z-10">
                    {diagnosticData.observation}
                  </div>
                </div>
              </div>
              
              {/* Strategic Intervention */}
              <div className="relative">
                <div className="text-green-400/80 mb-1 tracking-wide">
                  STRATEGIC INTERVENTION:
                </div>
                <div className="text-green-200/90 pl-2 relative">
                  {/* Burn-in effect background */}
                  <div className="absolute inset-0 text-green-400/20 select-none pointer-events-none">
                    {diagnosticData.intervention}
                  </div>
                  <div className="relative z-10">
                    {diagnosticData.intervention}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Subtle border glow effect */}
            <div className="absolute inset-0 rounded-lg border border-red-500/20 pointer-events-none" />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
          </div>
        </div>
      )}
      
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
      
      {/* Optional decorative element */}
      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-white/40" />
    </div>
  );
};

export default AIMessageCard;