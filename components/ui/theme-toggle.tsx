'use client';

import { useTheme } from '@/components/providers/ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'light' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
        }`}
        title="Light"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'dark' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
        }`}
        title="Dark"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'system' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
        }`}
        title="System"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
