import { Elysia, t } from 'elysia';

const AGENTX_URL = process.env.VITE_AGENTX_URL || process.env.AGENTX_URL || 'http://localhost:9000';

/** Returns YYYY-MM-DD of the Monday of the given date */
function weekKey(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

async function readEntry(path: string): Promise<string | null> {
  try {
    const res = await fetch(`${AGENTX_URL}/api/identity/entries?path=${encodeURIComponent(path)}`);
    const data = await res.json();
    if (data.success && data.data?.content) return data.data.content;
    return null;
  } catch {
    return null;
  }
}

async function writeEntry(path: string, content: string, frontMatter: Record<string, string>): Promise<void> {
  await fetch(`${AGENTX_URL}/api/identity/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content, frontMatter }),
  });
}

export const crazyWeeksRoutes = new Elysia({ prefix: '/api/crazy-weeks' })
  // GET /api/crazy-weeks/current — returns { week, tech, biz, marketing }
  .get('/current', async () => {
    const week = weekKey();
    const [tech, biz, marketing] = await Promise.all([
      readEntry(`crazy-weeks/${week}/tech.agentx.md`),
      readEntry(`crazy-weeks/${week}/biz.agentx.md`),
      readEntry(`crazy-weeks/${week}/marketing.agentx.md`),
    ]);
    return { week, tech, biz, marketing };
  })

  // GET /api/crazy-weeks/list — returns available week keys
  .get('/list', async () => {
    try {
      const res = await fetch(`${AGENTX_URL}/api/identity/entries?dir=crazy-weeks`);
      const data = await res.json();
      const weeks = (data.entries || [])
        .map((e: any) => e.frontMatter?.week)
        .filter(Boolean)
        .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
        .sort()
        .reverse();
      return { weeks };
    } catch {
      return { weeks: [] };
    }
  })

  // GET /api/crazy-weeks/:week/:tab
  .get('/:week/:tab', async ({ params: { week, tab } }) => {
    const validTabs = ['tech', 'biz', 'marketing'];
    if (!validTabs.includes(tab)) return { error: 'Invalid tab' };
    const content = await readEntry(`crazy-weeks/${week}/${tab}.agentx.md`);
    return { week, tab, content };
  }, {
    params: t.Object({ week: t.String(), tab: t.String() })
  })

  // POST /api/crazy-weeks/:week/:tab
  .post('/:week/:tab', async ({ params: { week, tab }, body }) => {
    const validTabs = ['tech', 'biz', 'marketing'];
    if (!validTabs.includes(tab)) return { error: 'Invalid tab' };
    const { content } = body as { content: string };
    const labels: Record<string, string> = { tech: 'Tech Tasks', biz: 'Business Notes', marketing: 'Marketing Notes' };
    await writeEntry(
      `crazy-weeks/${week}/${tab}.agentx.md`,
      content,
      {
        type: 'crazy-week-note',
        week,
        tab,
        label: labels[tab],
        updatedAt: new Date().toISOString(),
      }
    );
    return { success: true, week, tab };
  }, {
    params: t.Object({ week: t.String(), tab: t.String() }),
    body: t.Object({ content: t.String() })
  });
