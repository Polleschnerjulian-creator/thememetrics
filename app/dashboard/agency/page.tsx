'use client';

import { useAppBridge } from '@/components/providers/AppBridgeProvider';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Building2, 
  Plus, 
  Settings, 
  Users, 
  Store,
  ExternalLink,
  Copy,
  Check,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Lock,
  Unlock,
  Link as LinkIcon,
  Upload,
  Palette,
  Play,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { usePlan } from '@/hooks/usePlan';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface Workspace {
  id: number;
  name: string;
  shopDomain: string;
  clientAccessEnabled: boolean;
  clientAccessToken: string;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  // Runtime data (fetched separately)
  score?: number;
  scoreChange?: number;
  lastAnalyzed?: string;
}

interface Agency {
  id: number;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  maxWorkspaces: number;
  maxTeamMembers: number;
}

interface TeamMember {
  id: number;
  email: string;
  name: string | null;
  role: string;
  inviteStatus: string;
  lastActiveAt: string | null;
}

export default function AgencyDashboard() {
  const searchParams = useSearchParams();
  const { authenticatedFetch } = useAppBridge();
  const [shop, setShop] = useState('');
  const [agency, setAgency] = useState<Agency | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [limits, setLimits] = useState({ workspacesUsed: 0, workspacesMax: 10, teamMembersUsed: 0, teamMembersMax: 5 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showAddWorkspace, setShowAddWorkspace] = useState(false);
  const [showBranding, setShowBranding] = useState(false);
  const [showBatchAnalysis, setShowBatchAnalysis] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  
  // Batch analysis state
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [batchResults, setBatchResults] = useState<any>(null);
  
  // Copy states
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { plan } = usePlan();
  const { t } = useLanguage();

  useEffect(() => {
    const shopParam = searchParams.get('shop');
    if (shopParam) {
      setShop(shopParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!shop) return;
    fetchAgencyData();
  }, [shop]);

  const fetchAgencyData = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/agency?shop=${shop}`);
      
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 403) {
          setError(t('agencyRequired'));
        } else {
          setError(data.error || t('errorLoading'));
        }
        return;
      }

      const data = await response.json();
      setAgency(data.agency);
      setWorkspaces(data.workspaces);
      setTeamMembers(data.teamMembers);
      setLimits(data.limits);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  const copyClientLink = (workspace: Workspace) => {
    const link = `${window.location.origin}/client/${workspace.clientAccessToken}`;
    navigator.clipboard.writeText(link);
    setCopiedId(workspace.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleClientAccess = async (workspace: Workspace) => {
    try {
      await authenticatedFetch(`/api/agency/workspaces?shop=${shop}&id=${workspace.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientAccessEnabled: !workspace.clientAccessEnabled }),
      });
      fetchAgencyData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteWorkspace = async (workspace: Workspace) => {
    if (!confirm(`"${workspace.name}" ${t('confirmDelete')}`)) return;
    
    try {
      await authenticatedFetch(`/api/agency/workspaces?shop=${shop}&id=${workspace.id}`, {
        method: 'DELETE',
      });
      fetchAgencyData();
    } catch (err) {
      console.error(err);
    }
  };

  if (plan !== 'agency') {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">{t('agencyDashboard')}</h1>
        <p className="text-muted-foreground mb-6">
          {t('agencyUpgradeDesc')}
        </p>
        <Link
          href={`/dashboard/pricing?shop=${shop}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
        >
          {t('upgradeToAgency')}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">{error}</h2>
        <button onClick={fetchAgencyData} className="text-indigo-600 hover:text-indigo-700">
          {t('tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Building2 className="w-7 h-7 text-indigo-600" />
            {agency?.name || t('agencyDashboard')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('agencyDescription')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBatchAnalysis(true)}
            disabled={batchAnalyzing || workspaces.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {batchAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {t('batchAnalyze')}
          </button>
          <button
            onClick={() => setShowBranding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
          >
            <Palette className="w-4 h-4" />
            {t('branding')}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <Store className="w-5 h-5 text-indigo-600" />
            <span className="text-xs text-muted-foreground">
              {limits.workspacesUsed} / {limits.workspacesMax}
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{workspaces.length}</p>
          <p className="text-sm text-muted-foreground">{t('workspaces')}</p>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-5 h-5 text-emerald-600" />
            <span className="text-xs text-muted-foreground">
              {limits.teamMembersUsed} / {limits.teamMembersMax}
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{teamMembers.length}</p>
          <p className="text-sm text-muted-foreground">{t('teamMembers')}</p>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <LinkIcon className="w-5 h-5 text-violet-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {workspaces.filter(w => w.clientAccessEnabled).length}
          </p>
          <p className="text-sm text-muted-foreground">{t('clientAccess')}</p>
        </div>
      </div>

      {/* Workspaces */}
      <div className="bg-card rounded-xl border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{t('workspaces')}</h2>
          <button
            onClick={() => setShowAddWorkspace(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addWorkspace')}
          </button>
        </div>
        
        {workspaces.length === 0 ? (
          <div className="p-12 text-center">
            <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t('noWorkspaces')}</p>
            <p className="text-sm text-muted-foreground/60 mt-1">{t('noWorkspacesDesc')}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className="p-5 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                      <Store className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{workspace.name}</h3>
                      <p className="text-sm text-muted-foreground">{workspace.shopDomain}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {/* Score */}
                    {workspace.score !== undefined && (
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className={`text-lg font-bold ${
                            workspace.score >= 80 ? 'text-emerald-600' :
                            workspace.score >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {workspace.score}
                          </span>
                          {workspace.scoreChange !== undefined && workspace.scoreChange !== 0 && (
                            <span className={`text-xs flex items-center ${
                              workspace.scoreChange > 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {workspace.scoreChange > 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {Math.abs(workspace.scoreChange)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {workspace.lastAnalyzed 
                            ? `${t('lastAnalyzed')}: ${new Date(workspace.lastAnalyzed).toLocaleDateString()}`
                            : t('neverAnalyzed')
                          }
                        </p>
                      </div>
                    )}
                    
                    {/* Client Access */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleClientAccess(workspace)}
                        className={`p-2 rounded-lg transition-colors ${
                          workspace.clientAccessEnabled 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : 'bg-secondary text-muted-foreground'
                        }`}
                        title={workspace.clientAccessEnabled ? t('disable') : t('enable')}
                      >
                        {workspace.clientAccessEnabled ? (
                          <Unlock className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </button>
                      
                      {workspace.clientAccessEnabled && (
                        <button
                          onClick={() => copyClientLink(workspace)}
                          className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                          title={t('copyLink')}
                        >
                          {copiedId === workspace.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/dashboard?shop=${workspace.shopDomain}`}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Open Dashboard"
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </Link>
                      <button
                        onClick={() => deleteWorkspace(workspace)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Members */}
      <div className="bg-card rounded-xl border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{t('teamMembers')}</h2>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('inviteMember')}
          </button>
        </div>
        
        {teamMembers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t('noTeamMembers')}</p>
            <p className="text-sm text-muted-foreground/60 mt-1">{t('noTeamMembersDesc')}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {teamMembers.map((member) => (
              <div key={member.id} className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      {(member.name || member.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {member.name || member.email}
                    </h3>
                    {member.name && (
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    member.role === 'owner' 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                      : member.role === 'admin'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-secondary text-muted-foreground'
                  }`}>
                    {member.role === 'owner' ? t('owner') : member.role === 'admin' ? t('admin') : t('member')}
                  </span>
                  
                  {member.inviteStatus === 'pending' && (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-medium">
                      {t('pending')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddWorkspace && (
        <AddWorkspaceModal
          shop={shop}
          onClose={() => setShowAddWorkspace(false)}
          onSuccess={() => {
            setShowAddWorkspace(false);
            fetchAgencyData();
          }}
        />
      )}
      
      {showBranding && agency && (
        <BrandingModal
          shop={shop}
          agency={agency}
          onClose={() => setShowBranding(false)}
          onSuccess={() => {
            setShowBranding(false);
            fetchAgencyData();
          }}
        />
      )}

      {showBatchAnalysis && (
        <BatchAnalysisModal
          shop={shop}
          workspaces={workspaces}
          onClose={() => setShowBatchAnalysis(false)}
          onSuccess={() => {
            fetchAgencyData();
          }}
        />
      )}
    </div>
  );
}

// Add Workspace Modal Component
function AddWorkspaceModal({
  shop,
  onClose,
  onSuccess,
}: {
  shop: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [shopDomain, setShopDomain] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  const { authenticatedFetch } = useAppBridge();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch(`/api/agency/workspaces?shop=${shop}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, shopDomain, notes }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || t('errorLoading'));
        return;
      }

      onSuccess();
    } catch (err) {
      setError(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl max-w-md w-full p-6 shadow-xl">
        <h2 className="text-xl font-bold text-foreground mb-4">{t('newWorkspace')}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('workspaceName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('workspaceNamePlaceholder')}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('shopDomain')}
            </label>
            <input
              type="text"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              placeholder="shop-name.myshopify.com"
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('shopDomainHint')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('notesOptional')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              rows={2}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? t('creating') : t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Branding Modal Component
function BrandingModal({
  shop,
  agency,
  onClose,
  onSuccess,
}: {
  shop: string;
  agency: Agency;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(agency.name);
  const [primaryColor, setPrimaryColor] = useState(agency.primaryColor);
  const [logoPreview, setLogoPreview] = useState<string | null>(agency.logoUrl);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  const { authenticatedFetch } = useAppBridge();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setError(t('logoTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      setLogoBase64(base64);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch(`/api/agency?shop=${shop}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          primaryColor,
          logoBase64: logoBase64 || undefined,
          logoUrl: logoPreview || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || t('errorLoading'));
        return;
      }

      onSuccess();
    } catch (err) {
      setError(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl max-w-md w-full p-6 shadow-xl">
        <h2 className="text-xl font-bold text-foreground mb-4">{t('brandingSettings')}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('agencyName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('logoForPdf')}
            </label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="w-16 h-16 rounded-lg border border-border flex items-center justify-center overflow-hidden bg-white">
                  <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg border border-dashed border-border flex items-center justify-center">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <span className="block w-full px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium text-foreground cursor-pointer text-center transition-colors">
                  {t('uploadLogo')}
                </span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('logoHint')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('primaryColor')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-lg border border-border cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Batch Analysis Modal Component
function BatchAnalysisModal({
  shop,
  workspaces,
  onClose,
  onSuccess,
}: {
  shop: string;
  workspaces: Workspace[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  const { authenticatedFetch } = useAppBridge();
  const isGerman = language === 'de';

  const startBatchAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      const response = await authenticatedFetch(`/api/agency/batch-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Analyse fehlgeschlagen');
        return;
      }

      setResults(data);
      onSuccess();
    } catch (err) {
      setError(isGerman ? 'Netzwerkfehler' : 'Network error');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[80vh] overflow-hidden flex flex-col">
        <h2 className="text-xl font-bold text-foreground mb-2">
          {isGerman ? 'Batch-Analyse' : 'Batch Analysis'}
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          {isGerman 
            ? `Analysiere alle ${workspaces.length} Workspaces auf einmal.`
            : `Analyze all ${workspaces.length} workspaces at once.`}
        </p>

        {!analyzing && !results && (
          <>
            <div className="bg-secondary/50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-foreground mb-2">
                {isGerman ? 'Workspaces:' : 'Workspaces:'}
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {workspaces.map(w => (
                  <div key={w.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Store className="w-3 h-3" />
                    {w.name} ({w.shopDomain})
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              {isGerman 
                ? '⏱️ Dies kann einige Minuten dauern, je nach Anzahl der Workspaces.'
                : '⏱️ This may take a few minutes depending on the number of workspaces.'}
            </p>
          </>
        )}

        {analyzing && (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-foreground font-medium">
              {isGerman ? 'Analysiere Workspaces...' : 'Analyzing workspaces...'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isGerman ? 'Bitte warten' : 'Please wait'}
            </p>
          </div>
        )}

        {results && (
          <div className="flex-1 overflow-y-auto">
            {/* Summary */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">
                  {isGerman ? 'Ergebnis' : 'Result'}
                </span>
                <span className="text-2xl font-bold text-indigo-600">
                  {results.summary.averageScore}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isGerman 
                  ? `Durchschnittlicher Score · ${results.summary.success}/${results.summary.total} erfolgreich`
                  : `Average Score · ${results.summary.success}/${results.summary.total} successful`}
              </p>
            </div>

            {/* Individual Results */}
            <div className="space-y-2">
              {results.results.map((result: any) => (
                <div 
                  key={result.workspaceId}
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {result.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{result.name}</p>
                      <p className="text-xs text-muted-foreground">{result.shopDomain}</p>
                    </div>
                  </div>
                  {result.status === 'success' ? (
                    <span className={`text-lg font-bold ${
                      result.score >= 70 ? 'text-emerald-600' :
                      result.score >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {result.score}
                    </span>
                  ) : (
                    <span className="text-xs text-red-500">{result.error}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg mb-4">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-4 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-colors"
          >
            {results ? (isGerman ? 'Schließen' : 'Close') : (isGerman ? 'Abbrechen' : 'Cancel')}
          </button>
          {!results && (
            <button
              onClick={startBatchAnalysis}
              disabled={analyzing}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isGerman ? 'Analysiere...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {isGerman ? 'Starten' : 'Start'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
