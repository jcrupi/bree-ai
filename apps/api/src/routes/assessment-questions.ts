/**
 * Assessment questions API - serves agentx-assessments/notes to the Genius Talent UI.
 * Parses .agentx.md files and returns Speciality format (id, name, description, questions).
 */

import { Elysia } from 'elysia';
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NOTES_DIR =
  process.env.AGENTX_NOTES_PATH ||
  join(__dirname, '..', '..', '..', 'genius-talent', 'agentx-assessments', 'notes');

export interface Question {
  id: string;
  category: string;
  text: string;
}

export interface Speciality {
  id: string;
  name: string;
  description: string;
  questions: Question[];
}

/** Extract questions from agentx markdown. Handles **Q:** and **Question:** formats. */
function parseQuestionsFromMarkdown(content: string, baseId: string): Question[] {
  const questions: Question[] = [];
  let category = 'General';
  let idx = 0;

  // Strip YAML front matter
  let body = content;
  if (body.includes('---')) {
    const parts = body.split(/\n---\n/);
    if (parts.length >= 2) body = parts.slice(1).join('\n---\n');
  }

  const lines = body.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Capture ### N. Category or ## Category
    const categoryMatch = line.match(/^#{2,3}\s+(?:\d+\.\s+)?(.+)$/);
    if (categoryMatch) {
      category = categoryMatch[1].trim();
      continue;
    }
    // Capture **Q:** or **Question:** followed by question text
    const qMatch = line.match(/\*\*(?:Q|Question)\*\*:\s*(.+)$/);
    if (qMatch) {
      idx++;
      questions.push({
        id: `${baseId}-${idx}`,
        category,
        text: qMatch[1].trim(),
      });
      continue;
    }
    // Bullet with **Question**: (rust-basic format)
    const bulletMatch = line.match(/^-\s+\*\*Question\*\*:\s*(.+)$/);
    if (bulletMatch) {
      idx++;
      questions.push({
        id: `${baseId}-${idx}`,
        category,
        text: bulletMatch[1].trim(),
      });
    }
  }
  return questions;
}

/** Derive id, name, description from filename and content. */
function deriveSpeciality(filename: string, content: string): Speciality {
  // e.g. questions-react-ui.agentx.md -> react-ui
  const baseId = filename
    .replace(/^questions-/, '')
    .replace(/\.agentx\.md$/, '')
    .replace(/-basic$/, '')
    .replace(/\./g, '-');
  const id = baseId || filename.replace(/\..*$/, '');

  let name = id
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  let description = '';

  // Try to get title from first # heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    name = titleMatch[1].replace(/\s*-\s*Genius Talent\s*$/, '').trim();
  }
  const descMatch = content.match(/^##\s+(?:Technical\s+)?Interview\s+Questions[^]*?(?=###|$)/m);
  if (descMatch) {
    description = descMatch[0].replace(/^#+\s*.+\n?/, '').trim().slice(0, 120);
  }
  if (!description) {
    description = `Interview questions for ${name}`;
  }

  const questions = parseQuestionsFromMarkdown(content, id);
  return { id, name, description, questions };
}

export const assessmentQuestionsRoutes = new Elysia({ prefix: '/api/assessment' })
  .get('/questions', async ({ set }) => {
    try {
      const files = await readdir(NOTES_DIR);
      const agentxFiles = files.filter((f) => f.endsWith('.agentx.md'));
      const specialities: Speciality[] = [];

      for (const file of agentxFiles) {
        const filepath = join(NOTES_DIR, file);
        const content = await readFile(filepath, 'utf-8');
        const spec = deriveSpeciality(file, content);
        if (spec.questions.length > 0) {
          specialities.push(spec);
        }
      }

      return { success: true, specialities };
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        set.status = 404;
        return { success: false, error: 'Assessment notes directory not found', specialities: [] };
      }
      set.status = 500;
      return { success: false, error: err.message || 'Failed to load questions', specialities: [] };
    }
  })
  .get('/questions/:id', async ({ params: { id }, set }) => {
    try {
      const files = await readdir(NOTES_DIR);
      const file = files.find(
        (f) =>
          f.endsWith('.agentx.md') &&
          (f.replace(/^questions-/, '').replace(/.agentx.md$/, '').replace(/-basic$/, '') === id ||
            f.replace(/^questions-/, '').replace(/.agentx.md$/, '').replace(/\./g, '-') === id)
      );
      if (!file) {
        set.status = 404;
        return { success: false, error: 'Question set not found' };
      }
      const filepath = join(NOTES_DIR, file);
      const content = await readFile(filepath, 'utf-8');
      const spec = deriveSpeciality(file, content);
      return { success: true, speciality: spec };
    } catch (err: any) {
      set.status = 500;
      return { success: false, error: err.message || 'Failed to load question set' };
    }
  });
