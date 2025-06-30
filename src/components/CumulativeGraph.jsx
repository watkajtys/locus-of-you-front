import React from 'react';
import { TrendingUp } from 'lucide-react';
import Card from './Card';

const CumulativeGraph = () => {
  // Sample cumulative data (can only go up or stay flat)
  const data = [
    { day: 'Mon', value: 5 },
    { day: 'Tue', value: 8 },
    { day: 'Wed', value: 8 }, // Flat (no progress)
    { day: 'Thu', value: 12 },
    { day: 'Fri', value: 15 },
    { day: 'Sat', value: 18 },
    { day: 'Sun', value: 22 }
  ];

  const maxValue = Math.max(...data.map(d => d.value));
  const chartHeight = 200;
  const chartWidth = 300;

  // Generate path for the line
  const generatePath = () => {
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * chartWidth;
      const y = chartHeight - (point.value / maxValue) * chartHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 
              className="text-lg font-bold"
              style={{ color: 'var(--color-text)' }}
            >
              Your Growth Journey
            </h3>
            <p 
              className="text-sm"
              style={{ color: 'var(--color-muted)' }}
            >
              Cumulative progress over time
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          <svg 
            width="100%" 
            height={chartHeight + 40}
            viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
            className="overflow-visible"
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = chartHeight * (1 - ratio);
              return (
                <line
                  key={index}
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              );
            })}

            {/* Area under curve */}
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            
            <path
              d={`${generatePath()} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`}
              fill="url(#areaGradient)"
            />

            {/* Main line */}
            <path
              d={generatePath()}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-1000 ease-out"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}
            />

            {/* Data points */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * chartWidth;
              const y = chartHeight - (point.value / maxValue) * chartHeight;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="var(--color-accent)"
                  stroke="var(--color-card)"
                  strokeWidth="2"
                  className="transition-all duration-300 hover:r-6"
                />
              );
            })}

            {/* X-axis labels */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * chartWidth;
              return (
                <text
                  key={index}
                  x={x}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  className="text-xs font-medium"
                  fill="var(--color-muted)"
                >
                  {point.day}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="text-center">
            <div 
              className="text-2xl font-bold"
              style={{ color: 'var(--color-accent)' }}
            >
              {data[data.length - 1].value}
            </div>
            <div 
              className="text-xs font-medium"
              style={{ color: 'var(--color-muted)' }}
            >
              Total Points
            </div>
          </div>
          <div className="text-center">
            <div 
              className="text-2xl font-bold"
              style={{ color: '#10b981' }}
            >
              +{data[data.length - 1].value - data[0].value}
            </div>
            <div 
              className="text-xs font-medium"
              style={{ color: 'var(--color-muted)' }}
            >
              This Week
            </div>
          </div>
          <div className="text-center">
            <div 
              className="text-2xl font-bold"
              style={{ color: '#f97316' }}
            >
              {Math.round(((data[data.length - 1].value - data[0].value) / data[0].value) * 100)}%
            </div>
            <div 
              className="text-xs font-medium"
              style={{ color: 'var(--color-muted)' }}
            >
              Growth
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CumulativeGraph;