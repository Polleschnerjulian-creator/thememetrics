'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HistoryPoint {
  date: string;
  score: number;
  sections: number;
  themeName: string;
}

interface TrendChartProps {
  history: HistoryPoint[];
  trends: {
    current: number;
    previous: number;
    change: number;
    weekOverWeek: number;
    totalAnalyses: number;
  };
}

export function TrendChart({ history, trends }: TrendChartProps) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Performance-Verlauf</h3>
        <div className="text-center py-8 text-muted-foreground">
          <p>Nach mehreren Analysen siehst du hier den Verlauf</p>
        </div>
      </div>
    );
  }

  const maxScore = Math.max(...history.map(h => h.score), 100);
  const minScore = Math.min(...history.map(h => h.score), 0);
  const range = maxScore - minScore || 1;

  // Generate SVG path for the chart
  const width = 100;
  const height = 40;
  const padding = 2;
  
  const points = history.map((point, i) => {
    const x = padding + (i / (history.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - ((point.score - minScore) / range) * (height - 2 * padding);
    return `${x},${y}`;
  });
  
  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

  const getTrendIcon = (change: number) => {
    if (change > 0) return { Icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' };
    if (change < 0) return { Icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' };
    return { Icon: Minus, color: 'text-muted-foreground', bg: 'bg-muted' };
  };

  const changeTrend = getTrendIcon(trends.change);
  const weekTrend = getTrendIcon(trends.weekOverWeek);

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Performance-Verlauf</h3>
        <span className="text-xs text-muted-foreground">{trends.totalAnalyses} Analysen</span>
      </div>
      
      {/* Mini Chart */}
      <div className="relative h-16 mb-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#chartGradient)" />
          <path d={linePath} fill="none" stroke="rgb(99, 102, 241)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Current point */}
          <circle 
            cx={width - padding} 
            cy={height - padding - ((trends.current - minScore) / range) * (height - 2 * padding)} 
            r="3" 
            fill="rgb(99, 102, 241)" 
          />
        </svg>
      </div>

      {/* Trend Indicators */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl p-3 ${changeTrend.bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <changeTrend.Icon className={`w-4 h-4 ${changeTrend.color}`} />
            <span className="text-xs text-muted-foreground">Letzte Analyse</span>
          </div>
          <p className={`text-lg font-bold ${changeTrend.color}`}>
            {trends.change > 0 ? '+' : ''}{trends.change} Punkte
          </p>
        </div>
        
        <div className={`rounded-xl p-3 ${weekTrend.bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <weekTrend.Icon className={`w-4 h-4 ${weekTrend.color}`} />
            <span className="text-xs text-muted-foreground">Diese Woche</span>
          </div>
          <p className={`text-lg font-bold ${weekTrend.color}`}>
            {trends.weekOverWeek > 0 ? '+' : ''}{trends.weekOverWeek} Punkte
          </p>
        </div>
      </div>
    </div>
  );
}

export function TrendBadge({ change }: { change: number }) {
  if (change === 0) return null;
  
  const isPositive = change > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const color = isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50';
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {isPositive ? '+' : ''}{change}
    </span>
  );
}
