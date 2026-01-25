'use client';

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
  Palette
} from 'lucide-react';
import Link from 'next/link';
import { usePlan } from '@/hooks/usePlan';

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
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  
  // Copy states
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { plan } = usePlan();

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
      const response = await fetch(`/api/agency?shop=${shop}`);
      
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 403) {
          setError('Agency Plan erforderlich');
        } else {
          setError(data.error || 'Fehler beim Laden');
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
      setError('Fehler beim Laden der Agency-Daten');
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
      await fetch(`/api/agency/workspaces?shop=${shop}&id=${workspace.id}`, {
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
    if (!confirm(`Workspace "${workspace.name}" wirklich löschen?`)) return;
    
    try {
      await fetch(`/api/agency/workspaces?shop=${shop}&id=${workspace.id}`, {
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
        <h1 className="text-2xl font-bold text-foreground mb-3">Agency Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          Verwalte mehrere Shops, Team-Mitglieder und Client-Zugänge mit dem Agency Plan.
        </p>
        <Link
          href={`/dashboard/pricing?shop=${shop}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
        >
          Upgrade auf Agency
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
          Erneut versuchen
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
            {agency?.name || 'Agency Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Verwalte deine Shops und Team-Mitglieder
          </p>
        </div>
        <button
          onClick={() => setShowBranding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
        >
          <Palette className="w-4 h-4" />
          Branding
        </button>
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
          <p className="text-sm text-muted-foreground">Workspaces</p>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-5 h-5 text-emerald-600" />
            <span className="text-xs text-muted-foreground">
              {limits.teamMembersUsed} / {limits.teamMembersMax}
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{teamMembers.length}</p>
          <p className="text-sm text-muted-foreground">Team Members</p>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <Eye className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {workspaces.filter(w => w.clientAccessEnabled).length}
          </p>
          <p className="text-sm text-muted-foreground">Client Dashboards aktiv</p>
        </div>
      </div>

      {/* Workspaces */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Workspaces</h2>
          <button
            onClick={() => setShowAddWorkspace(true)}
            disabled={limits.workspacesUsed >= limits.workspacesMax}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Workspace hinzufügen
          </button>
        </div>

        <div className="space-y-3">
          {workspaces.map(workspace => (
            <div 
              key={workspace.id}
              className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                    <Store className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{workspace.name}</h3>
                    <p className="text-sm text-muted-foreground">{workspace.shopDomain}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Client Access Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleClientAccess(workspace)}
                      className={`p-2 rounded-lg transition-colors ${
                        workspace.clientAccessEnabled 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' 
                          : 'bg-secondary text-muted-foreground'
                      }`}
                      title={workspace.clientAccessEnabled ? 'Client-Zugang aktiv' : 'Client-Zugang inaktiv'}
                    >
                      {workspace.clientAccessEnabled ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                    
                    {workspace.clientAccessEnabled && (
                      <button
                        onClick={() => copyClientLink(workspace)}
                        className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                        title="Client-Link kopieren"
                      >
                        {copiedId === workspace.id ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <LinkIcon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Open in Dashboard */}
                  <Link
                    href={`/dashboard?shop=${workspace.shopDomain}`}
                    className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                    title="Im Dashboard öffnen"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </Link>

                  {/* Delete (not for primary workspace) */}
                  {workspace.shopDomain !== shop && (
                    <button
                      onClick={() => deleteWorkspace(workspace)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-muted-foreground hover:text-red-600"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notes */}
              {workspace.notes && (
                <p className="mt-3 text-sm text-muted-foreground pl-16">{workspace.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Workspace Modal */}
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

      {/* Branding Modal */}
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
    </div>
  );
}

// Add Workspace Modal Component
function AddWorkspaceModal({ 
  shop, 
  onClose, 
  onSuccess 
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Normalize shop domain
      let normalizedDomain = shopDomain.trim().toLowerCase();
      if (!normalizedDomain.includes('.myshopify.com')) {
        normalizedDomain = `${normalizedDomain}.myshopify.com`;
      }

      const response = await fetch(`/api/agency/workspaces?shop=${shop}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, shopDomain: normalizedDomain, notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Fehler beim Erstellen');
        return;
      }

      onSuccess();
    } catch (err) {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl max-w-md w-full p-6 shadow-xl">
        <h2 className="text-xl font-bold text-foreground mb-4">Neuer Workspace</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Workspace Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Kunde A - Fashion Store"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Shop Domain
            </label>
            <input
              type="text"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              placeholder="shop-name.myshopify.com"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Der Shop muss ThemeMetrics installiert haben
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Notizen (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interne Notizen zum Kunden..."
              rows={2}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
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
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Erstelle...' : 'Erstellen'}
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setError('Logo darf maximal 500KB groß sein');
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
      const response = await fetch(`/api/agency?shop=${shop}`, {
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
        setError(data.error || 'Fehler beim Speichern');
        return;
      }

      onSuccess();
    } catch (err) {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl max-w-md w-full p-6 shadow-xl">
        <h2 className="text-xl font-bold text-foreground mb-4">Branding Einstellungen</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Agency Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Logo für PDF Reports
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
                  Logo hochladen
                </span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG oder SVG, max. 500KB
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Primärfarbe
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
                className="flex-1 px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
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
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Speichere...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
