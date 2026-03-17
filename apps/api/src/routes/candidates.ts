import { Elysia, t } from 'elysia';
import { assessmentDb, positionDb } from '../db';
import { requireAuth } from '../index';
import crypto from 'node:crypto';

export const candidateRoutes = new Elysia({ prefix: '/api/v1' })
  .get('/positions/:positionId/candidates', async ({ params: { positionId }, query, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!auth) return { error: 'Unauthorized' };

    const { status, min_score, max_score, sort = 'score', order = 'desc', page = 1, limit = 20 } = query;

    // Fetch assessments for this position
    let assessments = assessmentDb.findByPositionId(positionId);

    // Apply filters
    if (status) {
      assessments = assessments.filter(a => a.status === status);
    }
    if (min_score !== undefined) {
      assessments = assessments.filter(a => (a.overall_score || 0) >= Number(min_score));
    }
    if (max_score !== undefined) {
      assessments = assessments.filter(a => (a.overall_score || 0) <= Number(max_score));
    }

    // Sort
    if (sort === 'score') {
      assessments.sort((a, b) => {
        const scoreA = a.overall_score ?? -1;
        const scoreB = b.overall_score ?? -1;
        return order === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      });
    } else if (sort === 'date') {
      assessments.sort((a, b) => {
        const dateA = a.completed_at || a.created_at || '';
        const dateB = b.completed_at || b.created_at || '';
        return order === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
      });
    }

    // Paginate
    const total = assessments.length;
    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit);
    const paginated = assessments.slice(start, end);

    return {
      data: paginated.map(a => ({
        id: a.id,
        name: a.candidate_name || 'Unknown',
        email: a.candidate_email,
        overall_score: a.overall_score,
        status: a.status,
        completed_at: a.completed_at,
        created_at: a.created_at
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total
      }
    };
  }, {
    query: t.Object({
      status: t.Optional(t.String()),
      min_score: t.Optional(t.Numeric()),
      max_score: t.Optional(t.Numeric()),
      sort: t.Optional(t.String()),
      order: t.Optional(t.String()),
      page: t.Optional(t.Numeric()),
      limit: t.Optional(t.Numeric())
    })
  })

  .get('/candidates/:id', async ({ params: { id }, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!auth) return { error: 'Unauthorized' };

    const assessment = assessmentDb.findById(id);
    if (!assessment) {
      set.status = 404;
      return { error: 'Candidate not found' };
    }

    const messages = assessmentDb.getMessages(id);
    const notes = assessmentDb.getNotes(id);

    return {
      id: assessment.id,
      name: assessment.candidate_name || 'Unknown',
      email: assessment.candidate_email,
      assessment: {
        overall_score: assessment.overall_score,
        technical_score: assessment.technical_score,
        cultural_score: assessment.cultural_score,
        experience_score: assessment.experience_score,
        market_score: assessment.market_score,
        feedback: assessment.feedback_data,
        conversation: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        }))
      },
      status: assessment.status,
      recruiter_status: assessment.recruiter_status,
      recruiter_notes: assessment.recruiter_notes,
      notes: notes
    };
  })

  .post('/candidates/:id/notes', async ({ params: { id }, body, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!auth) return { error: 'Unauthorized' };

    const assessment = assessmentDb.findById(id);
    if (!assessment) {
      set.status = 404;
      return { error: 'Candidate not found' };
    }

    const note = {
      id: crypto.randomUUID(),
      assessment_id: id,
      user_id: auth.userId,
      user_name: auth.name || auth.email,
      content: (body as any).content,
      created_at: new Date().toISOString()
    };

    assessmentDb.addNote(note);
    return note;
  })

  .patch('/candidates/:id/status', async ({ params: { id }, body, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!auth) return { error: 'Unauthorized' };

    const assessment = assessmentDb.findById(id);
    if (!assessment) {
      set.status = 404;
      return { error: 'Candidate not found' };
    }

    const payload = body as any;
    const update = {
      recruiter_status: payload.status,
      updated_at: new Date().toISOString()
    };

    if (payload.notes) {
      (update as any).recruiter_notes = payload.notes;
    }

    assessmentDb.update(id, update);

    return {
      id,
      recruiter_status: payload.status,
      message: 'Status updated successfully'
    };
  });
