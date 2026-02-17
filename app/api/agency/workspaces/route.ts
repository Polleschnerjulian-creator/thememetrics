export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { captureError } from '@/lib/monitoring';
import { authenticateRequest, withCors } from '@/lib/auth';
import { hashPassword } from '@/lib/crypto';

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }
    const { store } = authResult;

    const body = await request.json();

    if (!body.name || !body.shopDomain) {
      return NextResponse.json({ error: 'Name and shopDomain required' }, { status: 400 });
    }

    const agency = await db.query.agencies.findFirst({
      where: eq(schema.agencies.ownerStoreId, store.id),
    });

    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    const existingWorkspaces = await db.query.workspaces.findMany({
      where: eq(schema.workspaces.agencyId, agency.id),
    });

    if (existingWorkspaces.length >= (agency.maxWorkspaces || 10)) {
      return NextResponse.json({ 
        error: 'Workspace limit reached',
        limit: agency.maxWorkspaces,
        used: existingWorkspaces.length,
      }, { status: 403 });
    }

    const existingShop = existingWorkspaces.find(w => w.shopDomain === body.shopDomain);
    if (existingShop) {
      return NextResponse.json({ 
        error: 'Shop already exists in a workspace',
        workspaceName: existingShop.name,
      }, { status: 400 });
    }

    const targetStore = await db.query.stores.findFirst({
      where: eq(schema.stores.shopDomain, body.shopDomain),
    });

    const [workspace] = await db.insert(schema.workspaces)
      .values({
        agencyId: agency.id,
        name: body.name,
        shopDomain: body.shopDomain,
        storeId: targetStore?.id || null,
        notes: body.notes || null,
        clientAccessToken: generateToken(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        shopDomain: workspace.shopDomain,
        isConnected: !!targetStore,
        clientAccessToken: workspace.clientAccessToken,
        createdAt: workspace.createdAt,
      },
    });
  } catch (error) {
    captureError(error as Error, { tags: { route: 'workspaces', method: 'POST' } });
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

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('id');
    const body = await request.json();

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const agency = await db.query.agencies.findFirst({
      where: eq(schema.agencies.ownerStoreId, store.id),
    });

    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    const workspace = await db.query.workspaces.findFirst({
      where: and(
        eq(schema.workspaces.id, parseInt(workspaceId)),
        eq(schema.workspaces.agencyId, agency.id)
      ),
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.clientAccessEnabled !== undefined) updateData.clientAccessEnabled = body.clientAccessEnabled;
    if (body.clientAccessPassword !== undefined) {
      // Hash password before storing
      updateData.clientAccessPassword = body.clientAccessPassword
        ? await hashPassword(body.clientAccessPassword)
        : null;
    }
    
    if (body.regenerateToken) {
      updateData.clientAccessToken = generateToken();
    }

    const [updated] = await db.update(schema.workspaces)
      .set(updateData)
      .where(eq(schema.workspaces.id, workspace.id))
      .returning();

    return NextResponse.json({
      success: true,
      workspace: {
        id: updated.id,
        name: updated.name,
        shopDomain: updated.shopDomain,
        notes: updated.notes,
        isActive: updated.isActive,
        clientAccessEnabled: updated.clientAccessEnabled,
        clientAccessToken: updated.clientAccessToken,
      },
    });
  } catch (error) {
    captureError(error as Error, { tags: { route: 'workspaces', method: 'PUT' } });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }
    const { store } = authResult;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('id');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const agency = await db.query.agencies.findFirst({
      where: eq(schema.agencies.ownerStoreId, store.id),
    });

    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    const workspace = await db.query.workspaces.findFirst({
      where: and(
        eq(schema.workspaces.id, parseInt(workspaceId)),
        eq(schema.workspaces.agencyId, agency.id)
      ),
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (workspace.storeId === store.id) {
      return NextResponse.json({ 
        error: 'Cannot delete your primary workspace' 
      }, { status: 400 });
    }

    await db.delete(schema.workspaceMemberAccess)
      .where(eq(schema.workspaceMemberAccess.workspaceId, workspace.id));

    await db.delete(schema.clientAccessLog)
      .where(eq(schema.clientAccessLog.workspaceId, workspace.id));

    await db.delete(schema.workspaces)
      .where(eq(schema.workspaces.id, workspace.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    captureError(error as Error, { tags: { route: 'workspaces', method: 'DELETE' } });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/auth';
