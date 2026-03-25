/**
 * Downgrade Logic Tests
 *
 * Comprehensive tests for the REAL checkDowngradeImpact, executeDowngrade,
 * and getDowngradeSummary functions from lib/downgrade.ts.
 *
 * Database and monitoring are mocked.
 */

// Mock database BEFORE imports
jest.mock('@/lib/db', () => {
  const mockDb = {
    query: {
      agencies: {
        findFirst: jest.fn(),
      },
      workspaces: {
        findMany: jest.fn(),
      },
      teamMembers: {
        findMany: jest.fn(),
      },
      subscriptions: {
        findFirst: jest.fn(),
      },
    },
    update: jest.fn(),
  };
  return {
    db: mockDb,
    schema: {
      agencies: { ownerStoreId: 'owner_store_id' },
      workspaces: { agencyId: 'agency_id', id: 'id' },
      teamMembers: { agencyId: 'agency_id' },
      subscriptions: { storeId: 'store_id', id: 'id' },
      stores: { id: 'id' },
    },
  };
});

jest.mock('@/lib/monitoring', () => ({
  captureError: jest.fn(),
}));

// Also mock drizzle-orm eq function
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((field, value) => ({ field, value })),
}));

import {
  checkDowngradeImpact,
  executeDowngrade,
  getDowngradeSummary,
  DowngradeCheck,
} from '@/lib/downgrade';
import { db, schema } from '@/lib/db';
import { captureError } from '@/lib/monitoring';
import { PLANS } from '@/lib/billing';

// Type helpers for mock access
const mockDb = db as any;
const mockCaptureError = captureError as jest.MockedFunction<typeof captureError>;

// Helper: create mock workspaces
function createMockWorkspaces(
  count: number,
  agencyId: number,
  options?: { activeCount?: number }
) {
  const activeCount = options?.activeCount ?? count;
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    agencyId,
    name: `Workspace ${i + 1}`,
    shopDomain: `shop${i + 1}.myshopify.com`,
    isActive: i < activeCount,
    createdAt: new Date(2026, 0, i + 1),
    updatedAt: new Date(2026, 1, i + 1),
  }));
}

// Helper: create mock team members
function createMockTeamMembers(
  count: number,
  agencyId: number,
  options?: { acceptedCount?: number }
) {
  const acceptedCount = options?.acceptedCount ?? count;
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    agencyId,
    email: `member${i + 1}@agency.com`,
    name: `Member ${i + 1}`,
    role: i === 0 ? 'owner' : 'member',
    inviteStatus: i < acceptedCount ? 'accepted' : 'pending',
    createdAt: new Date(2026, 0, i + 1),
  }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================
// checkDowngradeImpact()
// ============================================

describe('checkDowngradeImpact', () => {
  const storeId = 1;

  describe('same plan (no-op)', () => {
    it('should return no impact when staying on free plan', async () => {
      const result = await checkDowngradeImpact(storeId, 'free', 'free');
      expect(result.canDowngrade).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.actions).toHaveLength(0);
    });

    it('should return no impact when staying on agency plan', async () => {
      const result = await checkDowngradeImpact(storeId, 'agency', 'agency');
      expect(result.canDowngrade).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.actions).toHaveLength(0);
    });

    it('should not query the database for same-plan checks', async () => {
      await checkDowngradeImpact(storeId, 'pro', 'pro');
      expect(mockDb.query.agencies.findFirst).not.toHaveBeenCalled();
      expect(mockDb.query.workspaces.findMany).not.toHaveBeenCalled();
    });
  });

  describe('agency -> pro: workspace and team member limits', () => {
    it('should warn about excess workspaces and add deactivate action', async () => {
      const mockAgency = { id: 10, ownerStoreId: storeId };
      const mockWorkspaces = createMockWorkspaces(5, 10, { activeCount: 5 });

      mockDb.query.agencies.findFirst.mockResolvedValue(mockAgency);
      mockDb.query.workspaces.findMany.mockResolvedValue(mockWorkspaces);
      mockDb.query.teamMembers.findMany.mockResolvedValue([]);

      const result = await checkDowngradeImpact(storeId, 'agency', 'pro');

      // Pro allows 1 workspace; agency has 5 active => 4 need deactivation
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('5 aktive Workspaces'),
          expect.stringContaining('Pro Plan erlaubt nur 1'),
        ])
      );
      expect(result.actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'deactivate_workspaces',
            count: 4,
            description: '4 Workspace(s) werden deaktiviert',
          }),
        ])
      );
    });

    it('should warn about excess team members and add deactivate action', async () => {
      const mockAgency = { id: 10, ownerStoreId: storeId };
      const mockTeamMembers = createMockTeamMembers(4, 10, { acceptedCount: 4 });

      mockDb.query.agencies.findFirst.mockResolvedValue(mockAgency);
      mockDb.query.workspaces.findMany.mockResolvedValue([]); // no workspace issue
      mockDb.query.teamMembers.findMany.mockResolvedValue(mockTeamMembers);

      const result = await checkDowngradeImpact(storeId, 'agency', 'pro');

      // Pro allows 1 team member; agency has 4 accepted => 3 need deactivation
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('4 Team-Mitglieder'),
          expect.stringContaining('Pro Plan erlaubt nur 1'),
        ])
      );
      expect(result.actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'deactivate_team_members',
            count: 3,
            description: '3 Team-Mitglied(er) verlieren den Zugang',
          }),
        ])
      );
    });

    it('should not warn about workspaces if active count is within new limit', async () => {
      const mockAgency = { id: 10, ownerStoreId: storeId };
      const mockWorkspaces = createMockWorkspaces(3, 10, { activeCount: 1 });

      mockDb.query.agencies.findFirst.mockResolvedValue(mockAgency);
      mockDb.query.workspaces.findMany.mockResolvedValue(mockWorkspaces);
      mockDb.query.teamMembers.findMany.mockResolvedValue([]);

      const result = await checkDowngradeImpact(storeId, 'agency', 'pro');

      const workspaceActions = result.actions.filter((a) => a.type === 'deactivate_workspaces');
      expect(workspaceActions).toHaveLength(0);
    });

    it('should not warn about team members if accepted count is within new limit', async () => {
      const mockAgency = { id: 10, ownerStoreId: storeId };
      const mockTeamMembers = createMockTeamMembers(3, 10, { acceptedCount: 1 });

      mockDb.query.agencies.findFirst.mockResolvedValue(mockAgency);
      mockDb.query.workspaces.findMany.mockResolvedValue([]);
      mockDb.query.teamMembers.findMany.mockResolvedValue(mockTeamMembers);

      const result = await checkDowngradeImpact(storeId, 'agency', 'pro');

      const memberActions = result.actions.filter((a) => a.type === 'deactivate_team_members');
      expect(memberActions).toHaveLength(0);
    });
  });

  describe('agency -> pro: feature losses', () => {
    it('should list lost features (API, white-label)', async () => {
      mockDb.query.agencies.findFirst.mockResolvedValue(null);

      const result = await checkDowngradeImpact(storeId, 'agency', 'pro');

      const loseFeatureAction = result.actions.find((a) => a.type === 'lose_feature');
      expect(loseFeatureAction).toBeDefined();
      expect(loseFeatureAction!.description).toContain('API Zugang');
      expect(loseFeatureAction!.description).toContain('White-Label Branding');
    });
  });

  describe('pro -> free: major feature losses', () => {
    it('should list all features lost when going from pro to free', async () => {
      // pro->free does not trigger agency checks (workspaces same: 1->1)
      const result = await checkDowngradeImpact(storeId, 'pro', 'free');

      const loseFeatureAction = result.actions.find((a) => a.type === 'lose_feature');
      expect(loseFeatureAction).toBeDefined();
      const desc = loseFeatureAction!.description;

      expect(desc).toContain('PDF Reports');
      expect(desc).toContain('Desktop Performance Tests');
      expect(desc).toContain('Code Fixes');
      expect(desc).toContain('Score Simulator');
      expect(desc).toContain('Wettbewerber-Benchmarks');
    });

    it('should warn about theme analysis limit reduction (unlimited -> 1)', async () => {
      const result = await checkDowngradeImpact(storeId, 'pro', 'free');

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Theme-Analysen werden auf 1/Monat begrenzt'),
        ])
      );
    });

    it('should warn about performance test limit reduction (unlimited -> 1)', async () => {
      const result = await checkDowngradeImpact(storeId, 'pro', 'free');

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Performance-Tests werden auf 1/Monat begrenzt'),
        ])
      );
    });
  });

  describe('agency -> free: combines all warnings', () => {
    it('should include workspace, team member, feature, and limit warnings', async () => {
      const mockAgency = { id: 10, ownerStoreId: storeId };
      const mockWorkspaces = createMockWorkspaces(8, 10, { activeCount: 8 });
      const mockTeamMembers = createMockTeamMembers(5, 10, { acceptedCount: 5 });

      mockDb.query.agencies.findFirst.mockResolvedValue(mockAgency);
      mockDb.query.workspaces.findMany.mockResolvedValue(mockWorkspaces);
      mockDb.query.teamMembers.findMany.mockResolvedValue(mockTeamMembers);

      const result = await checkDowngradeImpact(storeId, 'agency', 'free');

      // Workspace warning: 8 active -> 1 allowed = 7 deactivated
      expect(result.actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'deactivate_workspaces',
            count: 7,
          }),
        ])
      );

      // Team member warning: 5 accepted -> 1 allowed = 4 lose access
      expect(result.actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'deactivate_team_members',
            count: 4,
          }),
        ])
      );

      // Feature loss action
      const loseFeature = result.actions.find((a) => a.type === 'lose_feature');
      expect(loseFeature).toBeDefined();
      expect(loseFeature!.description).toContain('PDF Reports');
      expect(loseFeature!.description).toContain('Desktop Performance Tests');
      expect(loseFeature!.description).toContain('Code Fixes');
      expect(loseFeature!.description).toContain('Score Simulator');
      expect(loseFeature!.description).toContain('Wettbewerber-Benchmarks');
      expect(loseFeature!.description).toContain('API Zugang');
      expect(loseFeature!.description).toContain('White-Label Branding');

      // Limit reduction warnings
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Theme-Analysen werden auf 1/Monat begrenzt'),
          expect.stringContaining('Performance-Tests werden auf 1/Monat begrenzt'),
        ])
      );
    });
  });

  describe('no agency record found', () => {
    it('should not produce workspace or team member warnings when agency is null', async () => {
      mockDb.query.agencies.findFirst.mockResolvedValue(null);

      const result = await checkDowngradeImpact(storeId, 'agency', 'pro');

      const workspaceActions = result.actions.filter((a) => a.type === 'deactivate_workspaces');
      const memberActions = result.actions.filter((a) => a.type === 'deactivate_team_members');
      expect(workspaceActions).toHaveLength(0);
      expect(memberActions).toHaveLength(0);
    });

    it('should still list feature losses even without agency record', async () => {
      mockDb.query.agencies.findFirst.mockResolvedValue(null);

      const result = await checkDowngradeImpact(storeId, 'agency', 'free');

      const loseFeature = result.actions.find((a) => a.type === 'lose_feature');
      expect(loseFeature).toBeDefined();
    });
  });

  describe('starter -> free (moderate downgrade)', () => {
    it('should list lost features: PDF Reports, Desktop Performance Tests', async () => {
      const result = await checkDowngradeImpact(storeId, 'starter', 'free');

      const loseFeature = result.actions.find((a) => a.type === 'lose_feature');
      expect(loseFeature).toBeDefined();
      expect(loseFeature!.description).toContain('PDF Reports');
      expect(loseFeature!.description).toContain('Desktop Performance Tests');
      // Starter does not have code fixes or score simulator
      expect(loseFeature!.description).not.toContain('Code Fixes');
      expect(loseFeature!.description).not.toContain('Score Simulator');
    });

    it('should warn about theme analysis limit reduction (5 -> 1)', async () => {
      const result = await checkDowngradeImpact(storeId, 'starter', 'free');

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Theme-Analysen werden auf 1/Monat begrenzt'),
        ])
      );
    });

    it('should warn about performance test limit reduction (10 -> 1)', async () => {
      const result = await checkDowngradeImpact(storeId, 'starter', 'free');

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Performance-Tests werden auf 1/Monat begrenzt'),
        ])
      );
    });

    it('should not query agencies (workspace limits are equal: 1 -> 1)', async () => {
      await checkDowngradeImpact(storeId, 'starter', 'free');
      expect(mockDb.query.agencies.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('upgrade direction (no losses expected)', () => {
    it('should report no feature losses when upgrading free -> starter', async () => {
      const result = await checkDowngradeImpact(storeId, 'free', 'starter');

      // No feature losses, no workspace issues, no limit reductions
      const loseFeature = result.actions.find((a) => a.type === 'lose_feature');
      expect(loseFeature).toBeUndefined();
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('edge case: empty workspace/team arrays', () => {
    it('should handle zero active workspaces gracefully', async () => {
      const mockAgency = { id: 10, ownerStoreId: storeId };
      mockDb.query.agencies.findFirst.mockResolvedValue(mockAgency);
      mockDb.query.workspaces.findMany.mockResolvedValue([]);
      mockDb.query.teamMembers.findMany.mockResolvedValue([]);

      const result = await checkDowngradeImpact(storeId, 'agency', 'pro');

      const workspaceActions = result.actions.filter((a) => a.type === 'deactivate_workspaces');
      expect(workspaceActions).toHaveLength(0);
    });
  });
});

// ============================================
// executeDowngrade()
// ============================================

describe('executeDowngrade', () => {
  const storeId = 1;

  // Helper to set up db.update mock chain
  function setupUpdateMock() {
    const setMock = jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });
    mockDb.update.mockReturnValue({ set: setMock });
    return setMock;
  }

  describe('successful downgrade with excess workspaces', () => {
    it('should deactivate excess workspaces keeping most recent active', async () => {
      const mockAgency = { id: 10, ownerStoreId: storeId };
      // 5 active workspaces: workspace 5 most recent, workspace 1 oldest
      const mockWorkspaces = [
        { id: 1, agencyId: 10, isActive: true, createdAt: new Date(2026, 0, 1), updatedAt: new Date(2026, 0, 1) },
        { id: 2, agencyId: 10, isActive: true, createdAt: new Date(2026, 0, 2), updatedAt: new Date(2026, 0, 2) },
        { id: 3, agencyId: 10, isActive: true, createdAt: new Date(2026, 0, 3), updatedAt: new Date(2026, 0, 3) },
        { id: 4, agencyId: 10, isActive: false, createdAt: new Date(2026, 0, 4), updatedAt: null },
        { id: 5, agencyId: 10, isActive: true, createdAt: new Date(2026, 0, 5), updatedAt: new Date(2026, 2, 1) },
      ];

      mockDb.query.agencies.findFirst.mockResolvedValue(mockAgency);
      mockDb.query.workspaces.findMany.mockResolvedValue(mockWorkspaces);
      mockDb.query.subscriptions.findFirst.mockResolvedValue({ id: 100, storeId, plan: 'agency' });

      const whereMock = jest.fn().mockResolvedValue(undefined);
      const setMock = jest.fn().mockReturnValue({ where: whereMock });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await executeDowngrade(storeId, 'pro');

      expect(result.success).toBe(true);
      // 4 active workspaces, pro allows 1, so 3 should be deactivated
      expect(result.actionsExecuted).toEqual(
        expect.arrayContaining([
          expect.stringContaining('3 Workspace(s) deaktiviert'),
        ])
      );
    });
  });

  describe('successful downgrade: subscription and store plan update', () => {
    it('should update subscription plan and store plan', async () => {
      mockDb.query.agencies.findFirst.mockResolvedValue(null);
      mockDb.query.subscriptions.findFirst.mockResolvedValue({ id: 100, storeId, plan: 'pro' });

      const whereMock = jest.fn().mockResolvedValue(undefined);
      const setMock = jest.fn().mockReturnValue({ where: whereMock });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await executeDowngrade(storeId, 'starter');

      expect(result.success).toBe(true);
      expect(result.actionsExecuted).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Plan geändert zu Starter'),
        ])
      );
      // db.update should be called for subscription and store
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should update store plan even when no subscription record exists', async () => {
      mockDb.query.agencies.findFirst.mockResolvedValue(null);
      mockDb.query.subscriptions.findFirst.mockResolvedValue(null);

      const whereMock = jest.fn().mockResolvedValue(undefined);
      const setMock = jest.fn().mockReturnValue({ where: whereMock });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await executeDowngrade(storeId, 'free');

      expect(result.success).toBe(true);
      expect(result.actionsExecuted).toContain('Plan geändert zu Free');
    });
  });

  describe('no agency record', () => {
    it('should skip workspace deactivation when no agency found', async () => {
      mockDb.query.agencies.findFirst.mockResolvedValue(null);
      mockDb.query.subscriptions.findFirst.mockResolvedValue({ id: 100, storeId, plan: 'agency' });

      const whereMock = jest.fn().mockResolvedValue(undefined);
      const setMock = jest.fn().mockReturnValue({ where: whereMock });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await executeDowngrade(storeId, 'free');

      expect(result.success).toBe(true);
      // Should only have plan change, no workspace deactivation
      expect(result.actionsExecuted).toEqual(['Plan geändert zu Free']);
    });
  });

  describe('no excess workspaces', () => {
    it('should not deactivate workspaces when count is within limit', async () => {
      const mockAgency = { id: 10, ownerStoreId: storeId };
      const mockWorkspaces = [
        { id: 1, agencyId: 10, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      ];

      mockDb.query.agencies.findFirst.mockResolvedValue(mockAgency);
      mockDb.query.workspaces.findMany.mockResolvedValue(mockWorkspaces);
      mockDb.query.subscriptions.findFirst.mockResolvedValue({ id: 100, storeId, plan: 'agency' });

      const whereMock = jest.fn().mockResolvedValue(undefined);
      const setMock = jest.fn().mockReturnValue({ where: whereMock });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await executeDowngrade(storeId, 'pro');

      expect(result.success).toBe(true);
      // Only plan change, no workspace action
      expect(result.actionsExecuted).not.toEqual(
        expect.arrayContaining([expect.stringContaining('Workspace(s) deaktiviert')])
      );
    });
  });

  describe('error handling', () => {
    it('should return success:false and capture error on database failure', async () => {
      const dbError = new Error('Connection refused');
      mockDb.query.agencies.findFirst.mockRejectedValue(dbError);

      const result = await executeDowngrade(storeId, 'free');

      expect(result.success).toBe(false);
      expect(result.actionsExecuted).toHaveLength(0);
      expect(mockCaptureError).toHaveBeenCalledWith(
        dbError,
        expect.objectContaining({
          context: 'executeDowngrade',
          extra: expect.objectContaining({
            storeId: '1',
            toPlan: 'free',
          }),
        })
      );
    });

    it('should return partial actionsExecuted on late failure', async () => {
      // Agency found, workspaces deactivated, but then subscription query fails
      const mockAgency = { id: 10, ownerStoreId: storeId };
      mockDb.query.agencies.findFirst.mockResolvedValue(mockAgency);
      mockDb.query.workspaces.findMany.mockResolvedValue([]); // no workspaces

      // First update call succeeds, then subscriptions query throws
      mockDb.query.subscriptions.findFirst.mockRejectedValue(new Error('Query failed'));

      const whereMock = jest.fn().mockResolvedValue(undefined);
      const setMock = jest.fn().mockReturnValue({ where: whereMock });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await executeDowngrade(storeId, 'free');

      expect(result.success).toBe(false);
      expect(mockCaptureError).toHaveBeenCalled();
    });
  });
});

// ============================================
// getDowngradeSummary()
// ============================================

describe('getDowngradeSummary', () => {
  it('should return "Keine Einschränkungen" when no warnings and no actions', () => {
    const check: DowngradeCheck = {
      canDowngrade: true,
      warnings: [],
      actions: [],
    };

    const summary = getDowngradeSummary(check);
    expect(summary).toBe('Keine Einschränkungen beim Downgrade.');
  });

  it('should include warnings in the summary', () => {
    const check: DowngradeCheck = {
      canDowngrade: true,
      warnings: ['Theme-Analysen werden auf 1/Monat begrenzt'],
      actions: [],
    };

    const summary = getDowngradeSummary(check);
    expect(summary).toContain('Hinweise');
    expect(summary).toContain('Theme-Analysen werden auf 1/Monat begrenzt');
    expect(summary).not.toContain('Aktionen');
  });

  it('should include actions in the summary', () => {
    const check: DowngradeCheck = {
      canDowngrade: true,
      warnings: [],
      actions: [
        { type: 'deactivate_workspaces', count: 3, description: '3 Workspace(s) werden deaktiviert' },
      ],
    };

    const summary = getDowngradeSummary(check);
    expect(summary).toContain('Aktionen');
    expect(summary).toContain('3 Workspace(s) werden deaktiviert');
    expect(summary).not.toContain('Hinweise');
  });

  it('should combine warnings and actions with pipe separator', () => {
    const check: DowngradeCheck = {
      canDowngrade: true,
      warnings: ['Limit wird reduziert'],
      actions: [
        { type: 'deactivate_workspaces', count: 2, description: '2 Workspace(s) werden deaktiviert' },
        { type: 'lose_feature', description: 'Du verlierst: PDF Reports, Code Fixes' },
      ],
    };

    const summary = getDowngradeSummary(check);
    expect(summary).toContain('Hinweise');
    expect(summary).toContain('Limit wird reduziert');
    expect(summary).toContain(' | ');
    expect(summary).toContain('Aktionen');
    expect(summary).toContain('2 Workspace(s) werden deaktiviert');
    expect(summary).toContain('Du verlierst: PDF Reports, Code Fixes');
  });

  it('should join multiple warnings with space', () => {
    const check: DowngradeCheck = {
      canDowngrade: true,
      warnings: ['Warning A', 'Warning B'],
      actions: [],
    };

    const summary = getDowngradeSummary(check);
    // The implementation joins warnings with ' ' (space)
    expect(summary).toContain('Warning A Warning B');
  });

  it('should join multiple action descriptions with comma', () => {
    const check: DowngradeCheck = {
      canDowngrade: true,
      warnings: [],
      actions: [
        { type: 'deactivate_workspaces', count: 1, description: 'Action A' },
        { type: 'lose_feature', description: 'Action B' },
      ],
    };

    const summary = getDowngradeSummary(check);
    expect(summary).toContain('Action A, Action B');
  });
});

// ============================================
// Integration: checkDowngradeImpact + getDowngradeSummary
// ============================================

describe('checkDowngradeImpact + getDowngradeSummary integration', () => {
  it('should produce a readable summary for agency -> free with full data', async () => {
    const storeId = 1;
    const mockAgency = { id: 10, ownerStoreId: storeId };

    mockDb.query.agencies.findFirst.mockResolvedValue(mockAgency);
    mockDb.query.workspaces.findMany.mockResolvedValue(
      createMockWorkspaces(3, 10, { activeCount: 3 })
    );
    mockDb.query.teamMembers.findMany.mockResolvedValue(
      createMockTeamMembers(3, 10, { acceptedCount: 3 })
    );

    const check = await checkDowngradeImpact(storeId, 'agency', 'free');
    const summary = getDowngradeSummary(check);

    // Should include both hinweise and aktionen
    expect(summary).toContain('Hinweise');
    expect(summary).toContain('Aktionen');
    expect(summary).toContain('|');
  });

  it('should produce "Keine Einschränkungen" for same-plan check', async () => {
    const check = await checkDowngradeImpact(1, 'starter', 'starter');
    const summary = getDowngradeSummary(check);
    expect(summary).toBe('Keine Einschränkungen beim Downgrade.');
  });
});
