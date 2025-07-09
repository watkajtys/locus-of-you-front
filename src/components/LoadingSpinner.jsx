import { Loader2 } from 'lucide-react';
import React from 'react';

const LoadingSpinner = ({ size = 'md', text = null, className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Loader2 
        className={`animate-spin text-primary ${sizeClasses[size]}`} 
      />
      {text && <span className="text-sm italic text-muted">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;