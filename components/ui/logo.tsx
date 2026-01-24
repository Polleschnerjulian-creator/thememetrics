interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 40, showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 64 64" 
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="64" height="64" rx="16" fill="url(#logo-gradient)"/>
        <path 
          d="M18 44V34M26 44V26M34 44V20M42 44V14" 
          stroke="white" 
          strokeWidth="6" 
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="64" y2="64">
            <stop stopColor="#6366F1"/>
            <stop offset="1" stopColor="#8B5CF6"/>
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className="text-xl font-semibold tracking-tight">ThemeMetrics</span>
      )}
    </div>
  );
}

export function LogoIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="64" height="64" rx="16" fill="url(#logo-icon-gradient)"/>
      <path 
        d="M18 44V34M26 44V26M34 44V20M42 44V14" 
        stroke="white" 
        strokeWidth="6" 
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="logo-icon-gradient" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#6366F1"/>
          <stop offset="1" stopColor="#8B5CF6"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
