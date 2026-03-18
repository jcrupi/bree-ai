import { Elysia, t } from 'elysia';
import { join } from 'path';
import { mkdir, readdir } from 'node:fs/promises';

// Isolated data directory — completely separate from the main crazy-week instance
const GENI_CRAZY_WEEKS_DIR = process.env.GENI_CRAZY_WEEKS_DIR ||
  (process.env.NODE_ENV === 'production' ? '/app/data/grelin-crazy-weeks' : join(process.cwd(), 'data', 'grelin-crazy-weeks'));

/** Returns YYYY-MM-DD of the Monday of the given date */
function weekKey(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function tabPath(week: string, tab: string): string {
  return join(GENI_CRAZY_WEEKS_DIR, week, `${tab}.txt`);
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
  const dir = join(GENI_CRAZY_WEEKS_DIR, week);
  await mkdir(dir, { recursive: true });
  await Bun.write(tabPath(week, tab), content);
}

// Global Config
async function readGlobalConfig(): Promise<string | null> {
  try {
    const file = Bun.file(join(GENI_CRAZY_WEEKS_DIR, 'global_config.json'));
    if (!(await file.exists())) return null;
    return await file.text();
  } catch {
    return null;
  }
}

async function writeGlobalConfig(content: string): Promise<void> {
  await mkdir(GENI_CRAZY_WEEKS_DIR, { recursive: true });
  await Bun.write(join(GENI_CRAZY_WEEKS_DIR, 'global_config.json'), content);
}

export const grelinCrazyWeeksRoutes = new Elysia({ prefix: '/api/grelin-crazy-weeks' })
  // GET /api/grelin-crazy-weeks/current — returns { week, tech, biz, marketing }
  .get('/current', async () => {
    const week = weekKey();
    const [tech, biz, marketing] = await Promise.all([
      readTab(week, 'tech'),
      readTab(week, 'biz'),
      readTab(week, 'marketing'),
    ]);
    return { week, tech, biz, marketing };
  })

  // GET /api/grelin-crazy-weeks/list — returns available week keys
  .get('/list', async () => {
    try {
      const entries = await readdir(GENI_CRAZY_WEEKS_DIR, { withFileTypes: true });
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

  // GET /api/grelin-crazy-weeks/global/config
  .get('/global/config', async () => {
    const content = await readGlobalConfig();
    return { config: content ? JSON.parse(content) : null };
  })

  // POST /api/grelin-crazy-weeks/global/config
  .post('/global/config', async ({ body }) => {
    const { config } = body as { config: any };
    await writeGlobalConfig(JSON.stringify(config, null, 2));
    return { success: true };
  }, {
    body: t.Object({ config: t.Any() })
  })

  // GET /api/grelin-crazy-weeks/:week/:tab
  .get('/:week/:tab', async ({ params: { week, tab } }) => {
    const validTabs = ['tech', 'biz', 'marketing'];
    if (!validTabs.includes(tab)) return { error: 'Invalid tab' };
    const content = await readTab(week, tab);
    return { week, tab, content };
  }, {
    params: t.Object({ week: t.String(), tab: t.String() })
  })

  // POST /api/grelin-crazy-weeks/:week/:tab
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
