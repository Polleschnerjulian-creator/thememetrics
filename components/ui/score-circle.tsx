interface ScoreCircleProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ScoreCircle({ 
  score, 
  maxScore = 100, 
  size = 120, 
  strokeWidth = 8,
  label 
}: ScoreCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(score / maxScore, 1);
  const offset = circumference - (percent * circumference);
  
  // Color based on score
  const getColor = () => {
    if (score >= 80) return '#22C55E'; // Green
    if (score >= 50) return '#F59E0B'; // Yellow/Orange
    return '#EF4444'; // Red
  };
  
  const color = getColor();
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Score text in center */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <span 
            className="text-2xl font-bold"
            style={{ color }}
          >
            {score}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
      )}
    </div>
  );
}
