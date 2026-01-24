'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
      <button
        onClick={() => setLanguage('de')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          language === 'de' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
        }`}
      >
        🇩🇪 DE
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          language === 'en' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
        }`}
      >
        🇬🇧 EN
      </button>
    </div>
  );
}
