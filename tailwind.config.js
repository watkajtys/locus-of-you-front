/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Calm Theme Colors
        calm: {
          primary: '#e0f2fe',     // sky-100
          secondary: '#bae6fd',   // sky-200
          accent: '#0284c7',      // sky-600
          text: '#0c4a6e',        // sky-900
          background: '#f0f9ff',  // sky-50
        },
        // Professional Theme Colors
        professional: {
          primary: '#1e293b',     // slate-800
          secondary: '#334155',   // slate-700
          accent: '#f97316',      // orange-500
          text: '#f1f5f9',        // slate-100
          background: '#0f172a',  // slate-900
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      }
    },
  },
  plugins: [],
}