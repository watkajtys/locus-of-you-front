import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ theme, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`
        relative inline-flex items-center justify-center w-12 h-12 rounded-full
        transition-all duration-300 ease-in-out transform hover:scale-110
        focus:outline-none focus:ring-4 focus:ring-opacity-50
        ${theme === 'calm' 
          ? 'bg-sky-100 hover:bg-sky-200 text-sky-700 focus:ring-sky-300' 
          : 'bg-slate-700 hover:bg-slate-600 text-slate-100 focus:ring-orange-300'
        }
      `}
      aria-label={`Switch to ${theme === 'calm' ? 'professional' : 'calm'} theme`}
    >
      <div className="relative w-6 h-6">
        <Sun 
          className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
            theme === 'calm' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'
          }`} 
        />
        <Moon 
          className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
            theme === 'professional' ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
          }`} 
        />
      </div>
    </button>
  );
};

export default ThemeToggle;