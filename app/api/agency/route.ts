export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { captureError } from '@/lib/monitoring';
import { authenticateRequest, withCors } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }
    const { store } = authResult;

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.storeId, store.id),
    });

    if (subscription?.plan !== 'agency') {
      return NextResponse.json({ 
        error: 'Agency plan required',
        currentPlan: subscription?.plan || 'free'
      }, { status: 403 });
    }

    let agency = await db.query.agencies.findFirst({
      where: eq(schema.agencies.ownerStoreId, store.id),
    });

    if (!agency) {
      const [newAgency] = await db.insert(schema.agencies)
        .values({
          name: store.shopDomain.replace('.myshopify.com', ''),
          ownerEmail: '',
          ownerStoreId: store.id,
        })
        .returning();
      agency = newAgency;

      await db.insert(schema.workspaces)
        .values({
          agencyId: agency.id,
          name: 'Mein Shop',
          shopDomain: store.shopDomain,
          storeId: store.id,
        });
    }

    const workspaces = await db.query.workspaces.findMany({
      where: eq(schema.workspaces.agencyId, agency.id),
    });

    const teamMembers = await db.query.teamMembers.findMany({
      where: eq(schema.teamMembers.agencyId, agency.id),
    });

    return NextResponse.json({
      agency: {
        id: agency.id,
        name: agency.name,
        logoUrl: agency.logoUrl,
        primaryColor: agency.primaryColor,
        maxWorkspaces: agency.maxWorkspaces,
        maxTeamMembers: agency.maxTeamMembers,
      },
      workspaces: workspaces.map(w => ({
        id: w.id,
        name: w.name,
        shopDomain: w.shopDomain,
        clientAccessEnabled: w.clientAccessEnabled,
        clientAccessToken: w.clientAccessToken,
        isActive: w.isActive,
        notes: w.notes,
        createdAt: w.createdAt,
      })),
      teamMembers: teamMembers.map(m => ({
        id: m.id,
        email: m.email,
        name: m.name,
        role: m.role,
        inviteStatus: m.inviteStatus,
        lastActiveAt: m.lastActiveAt,
      })),
      limits: {
        workspacesUsed: workspaces.length,
        workspacesMax: agency.maxWorkspaces,
        teamMembersUsed: teamMembers.length,
        teamMembersMax: agency.maxTeamMembers,
      },
    });
  } catch (error) {
    captureError(error as Error, { tags: { route: 'agency', method: 'GET' } });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }
    const { store } = authResult;
    const body = await request.json();

    const agency = await db.query.agencies.findFirst({
      where: eq(schema.agencies.ownerStoreId, store.id),
    });

    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name) updateData.name = body.name;
    if (body.logoBase64) updateData.logoBase64 = body.logoBase64;
    if (body.logoUrl) updateData.logoUrl = body.logoUrl;
    if (body.primaryColor) updateData.primaryColor = body.primaryColor;

    const [updated] = await db.update(schema.agencies)
      .set(updateData)
      .where(eq(schema.agencies.id, agency.id))
      .returning();

    return NextResponse.json({ 
      success: true, 
      agency: {
        id: updated.id,
        name: updated.name,
        logoUrl: updated.logoUrl,
        primaryColor: updated.primaryColor,
      }
    });
  } catch (error) {
    captureError(error as Error, { tags: { route: 'agency', method: 'PUT' } });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/auth';
