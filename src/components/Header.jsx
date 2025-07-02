import { Cloud, Zap } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import boltBadge from '../assets/bolt-badge.png';

const Header = ({ theme, onThemeToggle }) => {
  return (
    <header 
      className="sticky top-0 z-50 backdrop-blur-sm border-b transition-all duration-300"
      style={{
        backgroundColor: 'var(--color-background)',
        borderColor: 'var(--color-border)',
        opacity: '0.95'
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Cloud 
                className="w-8 h-8"
                style={{ color: 'var(--color-accent)' }}
              />
              <Zap 
                className="w-6 h-6"
                style={{ color: 'var(--color-accent)' }}
              />
            </div>
            <div>
              <h1 
                className="text-xl font-bold tracking-tight"
                style={{ color: 'var(--color-text)' }}
              >
                CloudFlare React
              </h1>
              <p 
                className="text-sm"
                style={{ color: 'var(--color-muted)' }}
              >
                Worker Application
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <a href="https://bolt.new" target="_blank" rel="noopener noreferrer">
              <img src={boltBadge} alt="Bolt Badge" className="w-10 h-10" /> {/* Adjusted size */}
            </a>
            <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;