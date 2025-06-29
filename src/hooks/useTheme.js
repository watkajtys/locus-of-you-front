import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('app-theme');
    return savedTheme || 'calm';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'calm' ? 'professional' : 'calm';
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'calm') {
      root.style.setProperty('--color-primary', '#e0f2fe');
      root.style.setProperty('--color-secondary', '#bae6fd');
      root.style.setProperty('--color-accent', '#0284c7');
      root.style.setProperty('--color-text', '#0c4a6e');
      root.style.setProperty('--color-background', '#f0f9ff');
      root.style.setProperty('--color-card', '#ffffff');
      root.style.setProperty('--color-border', '#e2e8f0');
      root.style.setProperty('--color-muted', '#64748b');
    } else {
      root.style.setProperty('--color-primary', '#1e293b');
      root.style.setProperty('--color-secondary', '#334155');
      root.style.setProperty('--color-accent', '#f97316');
      root.style.setProperty('--color-text', '#f1f5f9');
      root.style.setProperty('--color-background', '#0f172a');
      root.style.setProperty('--color-card', '#1e293b');
      root.style.setProperty('--color-border', '#334155');
      root.style.setProperty('--color-muted', '#94a3b8');
    }
  }, [theme]);

  return { theme, toggleTheme };
};