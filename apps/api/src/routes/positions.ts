import { Elysia, t } from 'elysia';
import { positionDb } from '../db';
import { requireAuth } from '../index';
import crypto from 'node:crypto';
// import { parseJobDescription } from '../agents/jd-parser';
async function parseJobDescription(jd_text: string, company_url?: string) {
  return { title: 'Stub Role', required_skills: [], experience_years: { min: 1, max: 3 }, responsibilities: [] };
}
import { PositionCreateSchema, ScoringWeightsSchema } from '../models/position';

export const positionRoutes = new Elysia({ prefix: '/api/v1/positions' })
  .get('', async ({ headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    const positions = positionDb.findAll();
    
    if (!auth) {
      return {
        data: positions.filter(p => p.status === 'active'),
        total: positions.filter(p => p.status === 'active').length
      };
    }
    
    return {
      data: positions,
      total: positions.length
    };
  })
  
  .get('/:id', async ({ params: { id }, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    const position = positionDb.findById(id);
    
    if (!position) {
      set.status = 404;
      return { error: 'Position not found' };
    }
    
    if (!auth && position.status !== 'active') {
      set.status = 404;
      return { error: 'Position not found' };
    }
    
    return position;
  })

  .post('', async ({ body, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!auth) return { error: 'Unauthorized' };
    
    const { title, description, company_id, scoring_weights, requirements } = body;
    
    if (scoring_weights) {
      const total = (scoring_weights.technical || 0) + 
                    (scoring_weights.cultural || 0) + 
                    (scoring_weights.experience || 0) + 
                    (scoring_weights.market || 0);
      if (total !== 100) {
        set.status = 400;
        return { error: 'Scoring weights must sum to 100' };
      }
    }

    const id = crypto.randomUUID();
    const assessment_link = crypto.randomBytes(4).toString('hex');

    const newPosition = positionDb.create({
      id,
      company_id,
      title,
      description,
      requirements,
      status: 'active',
      created_by: auth.userId,
      assessment_link,
      scoring_weights: scoring_weights || { technical: 40, cultural: 25, experience: 20, market: 15 },
    });

    return {
      id: newPosition.id,
      title: newPosition.title,
      assessment_link: `/assessment/${newPosition.assessment_link}`,
      created_at: newPosition.created_at
    };
  }, {
    body: PositionCreateSchema
  })

  .put('/:id', async ({ params: { id }, body, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!auth) return { error: 'Unauthorized' };
    
    const existing = positionDb.findById(id);
    if (!existing) {
      set.status = 404;
      return { error: 'Position not found' };
    }
    
    positionDb.update(id, body);
    return positionDb.findById(id);
  })

  .patch('/:id/status', async ({ params: { id }, body, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!auth) return { error: 'Unauthorized' };
    
    const existing = positionDb.findById(id);
    if (!existing) {
      set.status = 404;
      return { error: 'Position not found' };
    }

    const { status } = body;
    if (!['active', 'inactive', 'paused', 'closed'].includes(status)) {
      set.status = 400;
      return { error: 'Invalid status' };
    }

    positionDb.update(id, { status });
    return positionDb.findById(id);
  }, {
    body: t.Object({ status: t.String() })
  })

  .delete('/:id', async ({ params: { id }, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!auth) return { error: 'Unauthorized' };
    
    const existing = positionDb.findById(id);
    if (!existing) {
      set.status = 404;
      return { error: 'Position not found' };
    }
    
    positionDb.delete(id);
    return { message: 'Position deleted successfully', id };
  })

  // ── AI Powered Routes ──────────────────────────

  .post('/parse-jd', async ({ body, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!auth) return { error: 'Unauthorized' };
    
    const { jd_text, company_url } = body;
    if (!jd_text) {
      set.status = 400;
      return { error: 'Job description text is required' };
    }

    try {
      const parsed = await parseJobDescription(jd_text, company_url);
      return {
        role_data: parsed,
        culture_data: null,
        suggested_questions: []
      };
    } catch (err: any) {
      set.status = 500;
      return { error: `Parsing failed: ${err.message}` };
    }
  }, {
    body: t.Object({
      jd_text: t.String(),
      company_url: t.Optional(t.String())
    })
  })

  .post('/quick-setup', async ({ body, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!auth) return { error: 'Unauthorized' };

    const { jd_text, company_url, company_id, customizations = {} } = body;
    if (!jd_text) {
      set.status = 400;
      return { error: 'Job description text is required' };
    }

    try {
      // 1. Parse JD
      const parsed = customizations.role_data || await parseJobDescription(jd_text, company_url);
      
      // 2. Prepare Position Data
      const id = crypto.randomUUID();
      const assessment_link = crypto.randomBytes(4).toString('hex');
      
      const positionData = {
        id,
        company_id: company_id || 'default',
        title: customizations.title || parsed.title || 'Software Engineer',
        description: customizations.description || '',
        requirements: {
          skills: parsed.required_skills?.map((s: any) => typeof s === 'object' ? s.skill : s) || [],
          experience_years: parsed.experience_years || { min: 3, max: 5 },
          responsibilities: parsed.responsibilities || []
        },
        status: 'active',
        created_by: auth.userId,
        assessment_link,
        scoring_weights: customizations.scoring_weights || { technical: 40, cultural: 25, experience: 20, market: 15 },
        jd_original: jd_text,
        jd_parsed: parsed,
        culture_data: customizations.culture_data || null,
        questions: customizations.questions || [],
        branding: customizations.branding || {}
      };

      // 3. Save to DB
      const position = positionDb.create(positionData);

      return {
        id: position.id,
        title: position.title,
        assessment_link: `/assessment/${position.assessment_link}`,
        created_at: position.created_at
      };
    } catch (err: any) {
      set.status = 500;
      return { error: `Quick setup failed: ${err.message}` };
    }
  }, {
    body: t.Object({
      jd_text: t.String(),
      company_url: t.Optional(t.String()),
      company_id: t.Optional(t.String()),
      customizations: t.Optional(t.Any())
    })
  })

  .post('/test-agent', async ({ body, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!auth) return { error: 'Unauthorized' };
    
    // Stub for conversation agent testing - would call conduct_conversation in production
    return {
      message: "Conversation agent test initiated. Bridge to Agent Collective required for full logic.",
      conversation_state: {
        id: "test-" + crypto.randomUUID().slice(0, 8),
        messages: [],
        current_phase: "introduction"
      }
    };
  })

  .post('/:id/job-genie/chat', async ({ params: { id }, body, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    const position = positionDb.findById(id);
    if (!position) {
      set.status = 404;
      return { error: 'Position not found' };
    }
    
    // Bridge to Agent Collective would go here
    return {
      reply: "Hi! I am the Job Genie. My AI brain is being migrated to the Bree-AI Agent Collective right now."
    };
  });
