import { ArrowRight } from 'lucide-react';

import Card from './Card';

const FeatureCard = ({ icon: Icon, title, description, accent }) => {
  return (
    <Card hover className="p-8 group cursor-pointer">
      <div className="space-y-4">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
          style={{ backgroundColor: accent ? 'var(--color-accent)' : 'var(--color-primary)' }}
        >
          <Icon 
            className="w-6 h-6" 
            style={{ color: accent ? 'white' : 'var(--color-text)' }}
          />
        </div>
        
        <div className="space-y-2">
          <h3 
            className="text-lg font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            {title}
          </h3>
          <p 
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-muted)' }}
          >
            {description}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span 
            className="text-sm font-medium"
            style={{ color: 'var(--color-accent)' }}
          >
            Learn more
          </span>
          <ArrowRight 
            className="w-4 h-4"
            style={{ color: 'var(--color-accent)' }}
          />
        </div>
      </div>
    </Card>
  );
};

export default FeatureCard;