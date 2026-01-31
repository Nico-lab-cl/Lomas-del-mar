import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-16 h-8 rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
          : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        boxShadow: isDark 
          ? '0 0 15px rgba(148, 163, 184, 0.3), inset 0 2px 4px rgba(0,0,0,0.3)' 
          : '0 0 15px rgba(251, 191, 36, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)'
      }}
      aria-label={isDark ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
    >
      <span
        className="absolute flex items-center justify-center w-6 h-6 rounded-full transition-all duration-500 ease-out"
        style={{
          transform: isDark ? 'translateX(14px)' : 'translateX(-14px)',
          background: isDark 
            ? 'linear-gradient(135deg, #475569 0%, #64748b 100%)' 
            : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          boxShadow: isDark 
            ? '0 2px 8px rgba(0,0,0,0.4), 0 0 10px rgba(148, 163, 184, 0.2)' 
            : '0 2px 8px rgba(251, 191, 36, 0.4), 0 0 10px rgba(251, 191, 36, 0.3)'
        }}
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-slate-200" />
        ) : (
          <Sun className="w-4 h-4 text-amber-600" />
        )}
      </span>
      
    </button>
  );
};
