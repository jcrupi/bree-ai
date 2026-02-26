/**
 * Talent Village — Server-Side Village Persistence
 *
 * Each village is stored as:
 *   data/villages/{villageId}/agentx.md
 *
 * The file uses YAML front matter for structured metadata,
 * followed by a human-readable markdown body that can be read,
 * edited, or picked up by any agentx tooling.
 *
 * Uses Bun-native file APIs: Bun.write / Bun.file / Bun.file().exists()
 * mkdir (recursive) comes from node:fs/promises — Bun supports it natively.
 */

import { Elysia, t } from 'elysia';

// ── Storage root ──────────────────────────────────────────────────────
const VILLAGES_DIR = process.env.VILLAGES_DIR || 'data/villages';

// ── Types ─────────────────────────────────────────────────────────────
export interface VillageRecord {
  villageId: string;
  villageName: string;
  description: string;
  leadName: string;
  leadEmail: string;
  scheduledDate?: string;
  scheduledTime?: string;
  slots?: string[];      // e.g. ["2026-02-26T9:00 AM", ...]
  slotCount?: number;
  createdAt: string;
  updatedAt: string;
  status: 'scheduled' | 'active' | 'completed';
}

// ── Helpers ───────────────────────────────────────────────────────────

function ensureVillageDir(villageId: string): string {
  const dir = `${VILLAGES_DIR}/${villageId}`;
  // Bun-native: spawn mkdir -p (synchronous, no node:fs needed)
  Bun.spawnSync(['mkdir', '-p', dir]);
  return dir;
}

/** Render a VillageRecord to agentx.md (YAML front matter + markdown body) */
function renderAgentxMd(v: VillageRecord): string {
  const slotsYaml = v.slots && v.slots.length > 0
    ? `slots:\n${v.slots.map(s => `  - "${s}"`).join('\n')}`
    : 'slots: []';

  const fm = [
    '---',
    `villageId: "${v.villageId}"`,
    `villageName: "${v.villageName.replace(/"/g, '\\"')}"`,
    `description: "${v.description.replace(/"/g, '\\"')}"`,
    `leadName: "${v.leadName.replace(/"/g, '\\"')}"`,
    `leadEmail: "${v.leadEmail}"`,
    v.scheduledDate ? `scheduledDate: "${v.scheduledDate}"` : null,
    v.scheduledTime ? `scheduledTime: "${v.scheduledTime}"` : null,
    `slotCount: ${v.slotCount ?? 0}`,
    slotsYaml,
    `status: "${v.status}"`,
    `createdAt: "${v.createdAt}"`,
    `updatedAt: "${v.updatedAt}"`,
    '---',
  ].filter(Boolean).join('\n');

  const schedLine = v.scheduledDate && v.scheduledTime
    ? `**Scheduled:** ${v.scheduledDate} · ${v.scheduledTime}  `
    : '**Schedule:** _Not yet set_  ';

  const slotsSection = v.slots && v.slots.length > 0
    ? `\n## Available Candidate Slots\n\n${v.slots.map(s => `- ${s.replace('T', ' · ')}`).join('\n')}\n`
    : '';

  const body = `
# ${v.villageName}

**Lead:** ${v.leadName} <${v.leadEmail}>  
**Status:** ${v.status.charAt(0).toUpperCase() + v.status.slice(1)}  
${schedLine}
**Created:** ${v.createdAt}

## Description

${v.description || '_No description provided._'}
${slotsSection}
## Session Log

_No messages recorded yet. Connect to the village to begin the assessment._
`;

  return fm + body;
}

/** Parse YAML front matter from an agentx.md string */
function parseAgentxMd(raw: string): VillageRecord | null {
  try {
    const match = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;
    const fm = match[1];

    function get(key: string): string {
      const m = fm.match(new RegExp(`^${key}:\\s*"?([^"\\n]*)"?`, 'm'));
      return m ? m[1].trim() : '';
    }
    function getNum(key: string): number {
      const m = fm.match(new RegExp(`^${key}:\\s*(\\d+)`, 'm'));
      return m ? parseInt(m[1], 10) : 0;
    }
    function getSlots(): string[] {
      const slotsMatch = fm.match(/^slots:\n((?:\s+-\s+".+"\n?)*)/m);
      if (!slotsMatch) return [];
      return [...slotsMatch[1].matchAll(/^\s+-\s+"(.+)"/gm)].map(m => m[1]);
    }

    return {
      villageId: get('villageId'),
      villageName: get('villageName'),
      description: get('description'),
      leadName: get('leadName'),
      leadEmail: get('leadEmail'),
      scheduledDate: get('scheduledDate') || undefined,
      scheduledTime: get('scheduledTime') || undefined,
      slotCount: getNum('slotCount'),
      slots: getSlots(),
      status: (get('status') as VillageRecord['status']) || 'active',
      createdAt: get('createdAt'),
      updatedAt: get('updatedAt'),
    };
  } catch {
    return null;
  }
}

async function readVillage(villageId: string): Promise<VillageRecord | null> {
  const path = `${VILLAGES_DIR}/${villageId}/agentx.md`;
  const file = Bun.file(path);
  if (!(await file.exists())) return null;
  const raw = await file.text();
  return parseAgentxMd(raw);
}

async function listAllVillages(): Promise<VillageRecord[]> {
  try {
    // Bun.glob to list village directories
    const glob = new Bun.Glob('*/agentx.md');
    const villages: VillageRecord[] = [];
    for await (const rel of glob.scan({ cwd: VILLAGES_DIR, dot: false })) {
      const villageId = rel.split('/')[0];
      const v = await readVillage(villageId);
      if (v) villages.push(v);
    }
    // Sort newest first
    return villages.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

// ── Routes ────────────────────────────────────────────────────────────
export const talentVillageRoutes = new Elysia({ prefix: '/api/talent-village' })

  // POST /api/talent-village/villages — create or overwrite a village
  .post('/villages', async ({ body, set }) => {
    try {
      const now = new Date().toISOString();
      const record: VillageRecord = {
        villageId: body.villageId,
        villageName: body.villageName,
        description: body.description ?? '',
        leadName: body.leadName,
        leadEmail: body.leadEmail,
        scheduledDate: body.scheduledDate,
        scheduledTime: body.scheduledTime,
        slots: body.slots ?? [],
        slotCount: body.slotCount ?? body.slots?.length ?? 0,
        status: body.status ?? (body.slots?.length ? 'scheduled' : 'active'),
        createdAt: now,
        updatedAt: now,
      };

      const dir = ensureVillageDir(record.villageId);
      const filepath = `${dir}/agentx.md`;
      await Bun.write(filepath, renderAgentxMd(record));

      console.log(`🏘  Village saved: ${filepath}`);
      return { success: true, villageId: record.villageId, path: filepath };
    } catch (err: any) {
      console.error('Failed to save village:', err);
      set.status = 500;
      return { success: false, error: err.message || 'Failed to save village' };
    }
  }, {
    body: t.Object({
      villageId: t.String(),
      villageName: t.String(),
      description: t.Optional(t.String()),
      leadName: t.String(),
      leadEmail: t.String(),
      scheduledDate: t.Optional(t.String()),
      scheduledTime: t.Optional(t.String()),
      slots: t.Optional(t.Array(t.String())),
      slotCount: t.Optional(t.Number()),
      status: t.Optional(t.Union([
        t.Literal('scheduled'),
        t.Literal('active'),
        t.Literal('completed'),
      ])),
    })
  })

  // GET /api/talent-village/villages — list all villages
  .get('/villages', async ({ set }) => {
    try {
      const villages = await listAllVillages();
      return { success: true, count: villages.length, villages };
    } catch (err: any) {
      set.status = 500;
      return { success: false, error: err.message || 'Failed to list villages', villages: [] };
    }
  })

  // GET /api/talent-village/villages/:id — get single village
  .get('/villages/:id', async ({ params: { id }, set }) => {
    const village = await readVillage(id);
    if (!village) {
      set.status = 404;
      return { success: false, error: `Village ${id} not found` };
    }
    return { success: true, village };
  })

  // GET /api/talent-village/villages/:id/raw — raw agentx.md text
  .get('/villages/:id/raw', async ({ params: { id }, set }) => {
    const path = `${VILLAGES_DIR}/${id}/agentx.md`;
    const file = Bun.file(path);
    if (!(await file.exists())) {
      set.status = 404;
      return new Response('Not found', { status: 404 });
    }
    const text = await file.text();
    return new Response(text, {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
    });
  })

  // PATCH /api/talent-village/villages/:id — update (reschedule, status change, etc.)
  .patch('/villages/:id', async ({ params: { id }, body, set }) => {
    try {
      const existing = await readVillage(id);
      if (!existing) {
        set.status = 404;
        return { success: false, error: `Village ${id} not found` };
      }

      const updated: VillageRecord = {
        ...existing,
        ...(body.villageName !== undefined && { villageName: body.villageName }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.scheduledDate !== undefined && { scheduledDate: body.scheduledDate }),
        ...(body.scheduledTime !== undefined && { scheduledTime: body.scheduledTime }),
        ...(body.slots !== undefined && { slots: body.slots, slotCount: body.slots.length }),
        ...(body.status !== undefined && { status: body.status }),
        updatedAt: new Date().toISOString(),
      };

      const dir = ensureVillageDir(id);
      await Bun.write(`${dir}/agentx.md`, renderAgentxMd(updated));

      console.log(`🔄 Village updated: ${id}`);
      return { success: true, village: updated };
    } catch (err: any) {
      set.status = 500;
      return { success: false, error: err.message || 'Failed to update village' };
    }
  }, {
    body: t.Object({
      villageName: t.Optional(t.String()),
      description: t.Optional(t.String()),
      scheduledDate: t.Optional(t.String()),
      scheduledTime: t.Optional(t.String()),
      slots: t.Optional(t.Array(t.String())),
      status: t.Optional(t.Union([
        t.Literal('scheduled'),
        t.Literal('active'),
        t.Literal('completed'),
      ])),
    })
  })

  // DELETE /api/talent-village/villages/:id — soft-delete (mark completed)
  // or hard-delete if ?hard=true
  .delete('/villages/:id', async ({ params: { id }, query, set }) => {
    try {
      if (query.hard === 'true') {
        // Hard delete: remove the village directory entirely (Bun-native)
        const villageDir = `${VILLAGES_DIR}/${id}`;
        const check = Bun.file(`${villageDir}/agentx.md`);
        if (!(await check.exists())) {
          set.status = 404;
          return { success: false, error: `Village ${id} not found` };
        }
        Bun.spawnSync(['rm', '-rf', villageDir]);
        console.log(`🗑  Village hard-deleted: ${id}`);
        return { success: true, deleted: id };
      } else {
        // Soft delete: mark as completed
        const existing = await readVillage(id);
        if (!existing) {
          set.status = 404;
          return { success: false, error: `Village ${id} not found` };
        }
        const updated = { ...existing, status: 'completed' as const, updatedAt: new Date().toISOString() };
        const dir = ensureVillageDir(id);
        await Bun.write(`${dir}/agentx.md`, renderAgentxMd(updated));
        console.log(`✅ Village completed (soft-deleted): ${id}`);
        return { success: true, village: updated };
      }
    } catch (err: any) {
      set.status = 500;
      return { success: false, error: err.message || 'Failed to delete village' };
    }
  }, {
    query: t.Object({
      hard: t.Optional(t.String()),
    })
  });
