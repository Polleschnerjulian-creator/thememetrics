'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle,
  Clock,
  FileDown,
  Lock,
  AlertTriangle,
  Layers,
  Zap
} from 'lucide-react';

interface ClientData {
  workspace: {
    name: string;
    shopDomain: string;
  };
  agency: {
    name: string;
    logoUrl: string | null;
    logoBase64: string | null;
    primaryColor: string;
  } | null;
  data: {
    theme: {
      name: string;
      analyzedAt: string;
      score: number;
      totalSections: number;
      coreWebVitals: {
        lcp: number;
        cls: number;
        tbt: number;
        fcp: number;
      } | null;
    } | null;
    summary: {
      critical: number;
      warning: number;
      good: number;
      total: number;
    };
    sections: Array<{
      name: string;
      type: string;
      category: string;
      score: number;
      recommendationsCount: number;
    }>;
    recommendations: Array<{
      section: string;
      recommendation: string;
      score: number;
    }>;
    history: Array<{
      score: number;
      date: string;
      themeName: string;
    }>;
  } | null;
  message?: string;
}

export default function ClientDashboard() {
  const params = useParams();
  const token = params.token as string;
  
  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async (pwd?: string) => {
    try {
      setLoading(true);
      const url = pwd 
        ? `/api/client?token=${token}&password=${encodeURIComponent(pwd)}`
        : `/api/client?token=${token}`;
      
      const response = await fetch(url);
      const result = await response.json();

      if (response.status === 401 && result.passwordProtected) {
        setPasswordRequired(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(result.error || 'Fehler beim Laden');
        setLoading(false);
        return;
      }

      setData(result);
      setPasswordRequired(false);
      setError(null);
    } catch (err) {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(password);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Password Screen
  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Passwort erforderlich</h1>
          <p className="text-slate-600 mb-6">
            Dieses Dashboard ist passwortgeschützt.
          </p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort eingeben"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
            >
              Entsperren
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Zugriff fehlgeschlagen</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { workspace, agency, data: dashboardData } = data;
  const primaryColor = agency?.primaryColor || '#6366f1';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header 
        className="text-white py-8 px-6"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {agency?.logoBase64 || agency?.logoUrl ? (
                <img 
                  src={agency.logoBase64 || agency.logoUrl || ''} 
                  alt={agency.name}
                  className="h-10 w-auto bg-white rounded-lg p-1"
                />
              ) : agency?.name ? (
                <span className="text-xl font-bold">{agency.name}</span>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Performance Report für</p>
              <p className="font-semibold">{workspace.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {!dashboardData?.theme ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Analyse ausstehend</h2>
            <p className="text-slate-600">
              Für diesen Shop wurde noch keine Analyse durchgeführt.
            </p>
          </div>
        ) : (
          <>
            {/* Score Card */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 mb-1">Gesamt-Score</p>
                  <div className="flex items-baseline gap-3">
                    <span className={`text-6xl font-bold ${getScoreColor(dashboardData.theme.score)}`}>
                      {dashboardData.theme.score}
                    </span>
                    <span className="text-slate-400 text-2xl">/100</span>
                  </div>
                  <p className="text-slate-500 mt-2">
                    Theme: {dashboardData.theme.name}
                  </p>
                </div>

                {/* Score Trend */}
                {dashboardData.history.length > 1 && (
                  <div className="text-right">
                    {(() => {
                      const prevScore = dashboardData.history[1]?.score || dashboardData.theme.score;
                      const change = dashboardData.theme.score - prevScore;
                      return change !== 0 ? (
                        <div className={`flex items-center gap-1 ${change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {change > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                          <span className="font-semibold">{change > 0 ? '+' : ''}{change}</span>
                        </div>
                      ) : null;
                    })()}
                    <p className="text-sm text-slate-500 mt-1">vs. letzte Analyse</p>
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{dashboardData.summary.critical}</p>
                  <p className="text-sm text-slate-500">Kritisch</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{dashboardData.summary.warning}</p>
                  <p className="text-sm text-slate-500">Warnung</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{dashboardData.summary.good}</p>
                  <p className="text-sm text-slate-500">Optimal</p>
                </div>
              </div>
            </div>

            {/* Core Web Vitals */}
            {dashboardData.theme.coreWebVitals && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-600" />
                  Core Web Vitals
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500 mb-1">LCP</p>
                    <p className="text-xl font-bold text-slate-900">
                      {(dashboardData.theme.coreWebVitals.lcp / 1000).toFixed(1)}s
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500 mb-1">CLS</p>
                    <p className="text-xl font-bold text-slate-900">
                      {Number(dashboardData.theme.coreWebVitals.cls).toFixed(3)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500 mb-1">TBT</p>
                    <p className="text-xl font-bold text-slate-900">
                      {dashboardData.theme.coreWebVitals.tbt}ms
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500 mb-1">FCP</p>
                    <p className="text-xl font-bold text-slate-900">
                      {(dashboardData.theme.coreWebVitals.fcp / 1000).toFixed(1)}s
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sections Overview */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Sections ({dashboardData.sections.length})
              </h2>
              <div className="space-y-2">
                {dashboardData.sections
                  .sort((a, b) => a.score - b.score)
                  .slice(0, 10)
                  .map((section, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                          section.score >= 70 ? 'bg-emerald-100 text-emerald-600' :
                          section.score >= 50 ? 'bg-amber-100 text-amber-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {section.score}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{section.name}</p>
                          <p className="text-xs text-slate-500">{section.category}</p>
                        </div>
                      </div>
                      {section.recommendationsCount > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                          {section.recommendationsCount} Empfehlung{section.recommendationsCount > 1 ? 'en' : ''}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
              {dashboardData.sections.length > 10 && (
                <p className="text-center text-sm text-slate-500 mt-4">
                  + {dashboardData.sections.length - 10} weitere Sections
                </p>
              )}
            </div>

            {/* Top Recommendations */}
            {dashboardData.recommendations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Top Empfehlungen
                </h2>
                <div className="space-y-3">
                  {dashboardData.recommendations.slice(0, 5).map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-indigo-600">{i + 1}</span>
                      </div>
                      <div>
                        <p className="text-slate-900">{rec.recommendation}</p>
                        <p className="text-xs text-slate-500 mt-1">Section: {rec.section}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-sm text-slate-500 pt-8">
              <p>
                Zuletzt analysiert: {new Date(dashboardData.theme.analyzedAt).toLocaleString('de-DE')}
              </p>
              {agency && (
                <p className="mt-1">
                  Bereitgestellt von <span className="font-medium">{agency.name}</span>
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
