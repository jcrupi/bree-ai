import { Elysia, t } from 'elysia';
import { join } from 'path';
import { mkdir, readdir } from 'node:fs/promises';

const CRAZY_WEEKS_DIR = process.env.CRAZY_WEEKS_DIR ||
  (process.env.NODE_ENV === 'production' ? '/app/data/crazy-weeks' : join(process.cwd(), 'data', 'crazy-weeks'));

/** Returns YYYY-MM-DD of the Monday of the given date */
function weekKey(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function tabPath(week: string, tab: string): string {
  return join(CRAZY_WEEKS_DIR, week, `${tab}.txt`);
}

async function readTab(week: string, tab: string): Promise<string | null> {
  try {
    const file = Bun.file(tabPath(week, tab));
    if (!(await file.exists())) return null;
    return await file.text();
  } catch {
    return null;
  }
}

async function writeTab(week: string, tab: string, content: string): Promise<void> {
  const dir = join(CRAZY_WEEKS_DIR, week);
  await mkdir(dir, { recursive: true });
  await Bun.write(tabPath(week, tab), content);
}

export const crazyWeeksRoutes = new Elysia({ prefix: '/api/crazy-weeks' })
  // GET /api/crazy-weeks/current — returns { week, tech, biz, marketing }
  .get('/current', async () => {
    const week = weekKey();
    const [tech, biz, marketing] = await Promise.all([
      readTab(week, 'tech'),
      readTab(week, 'biz'),
      readTab(week, 'marketing'),
    ]);
    return { week, tech, biz, marketing };
  })

  // GET /api/crazy-weeks/list — returns available week keys
  .get('/list', async () => {
    try {
      const entries = await readdir(CRAZY_WEEKS_DIR, { withFileTypes: true });
      const weeks = entries
        .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
        .map((e) => e.name)
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
    const content = await readTab(week, tab);
    return { week, tab, content };
  }, {
    params: t.Object({ week: t.String(), tab: t.String() })
  })

  // POST /api/crazy-weeks/:week/:tab
  .post('/:week/:tab', async ({ params: { week, tab }, body }) => {
    const validTabs = ['tech', 'biz', 'marketing'];
    if (!validTabs.includes(tab)) return { error: 'Invalid tab' };
    const { content } = body as { content: string };
    await writeTab(week, tab, content ?? '');
    return { success: true, week, tab };
  }, {
    params: t.Object({ week: t.String(), tab: t.String() }),
    body: t.Object({ content: t.String() })
  });
