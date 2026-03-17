/**
 * Assessments Routes
 * Ported from backend/src/api/routes/assessments.py
 * 
 * The AI conversation agent (conduct_conversation) is implemented natively using
 * the Anthropic SDK. Scoring and feedback are generated asynchronously after completion.
 */
import { Elysia, t } from 'elysia';
import { assessmentDb, positionDb } from '../db';
import { requireAuth } from '../index';
import crypto from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const RESUME_ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.rtf']);
const RESUME_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// ── Conversation Engine ─────────────────────────────────────────────────────

function buildSystemPrompt(roleContext: any, resumeData: any): string {
  const { title, requirements, culture_data, configured_questions } = roleContext;
  const skills = (requirements?.skills || [])
    .filter((s: any) => s)
    .map((s: any) => (typeof s === 'object' ? `${s.skill} (${s.weight || 'medium'} priority, level ${s.level || 3}/5)` : s))
    .join('\n  - ');

  const configuredQs = (configured_questions || [])
    .filter((q: any) => q?.question?.trim())
    .map((q: any, i: number) => `  ${i + 1}. ${q.question}`)
    .join('\n');

  const resumeSection = (resumeData?.skills?.length || resumeData?.work_experience?.length)
    ? `\n## Candidate Resume\nSkills: ${(resumeData.skills || []).join(', ')}\nExperience: ${resumeData.years_experience || '?'} years\nSummary: ${resumeData.summary || ''}`
    : '';

  return `You are a professional AI interviewer conducting a structured job interview for the role of "${title}".

## Interview Structure (follow this order)
1. **Opening** (1-2 questions): Warm greeting, ask what they're currently working on
2. **Technical** (assess EVERY required skill):
  - ${skills || 'Check relevant technical skills'}
3. **Cultural** (3 questions): Collaboration, feedback, handling pressure
4. **Experience** (2-3 questions): Motivation, biggest achievement, availability
5. **Closing**: Thank them and let them know results are being processed

## Rules
- Ask ONE question at a time. Never ask multiple questions in one message.
- Be conversational and encouraging. This is not an interrogation.
- Cover ALL required skills with targeted questions.
- Keep responses concise (2-3 sentences max before the actual question).
- When all phases are complete, send a closing message ending with "results are being processed".
${configuredQs ? `\n## Recruiter-Configured Questions (must ask all of these)\n${configuredQs}` : ''}
${resumeSection}

## Culture Context
${culture_data ? JSON.stringify(culture_data, null, 2) : 'Professional and collaborative environment'}`;
}

function detectPhase(content: string, currentPhase: string): string {
  const lower = content.toLowerCase();
  if (lower.includes('results are being processed') || lower.includes('thank you so much') || lower.includes('processing your assessment')) return 'closing';
  if (currentPhase === 'closing') return 'closing';
  if (lower.includes('collaborate') || lower.includes('feedback') || lower.includes('team') || lower.includes('work style')) return 'cultural';
  if (lower.includes("what's your experience") || lower.includes('have you used') || lower.includes('tell me about your') || lower.includes('how would you')) return 'technical';
  if (lower.includes('excited about') || lower.includes('accomplishment') || lower.includes('available to start') || lower.includes('current role')) return 'experience';
  if (lower.includes('hi!') || lower.includes('hello') || lower.includes('welcome') || lower.includes('currently working on')) return 'opening';
  return currentPhase;
}

function calculateProgress(state: any): number {
  const messages = state.messages || [];
  const hasPhase = (p: string) => messages.some((m: any) => m.phase === p && m.role === 'assistant');
  let progress = 10; // opening
  if (hasPhase('technical')) progress += 40;
  if (hasPhase('cultural')) progress += 25;
  if (hasPhase('experience')) progress += 20;
  if (hasPhase('closing')) progress += 5;
  const qProgress = Math.min(100, Math.floor((state.questions_asked || 0) / 18 * 100));
  return Math.min(100, Math.round((progress + qProgress) / 2));
}

function isComplete(state: any, role: any): boolean {
  const messages = state.messages || [];
  const hasPhase = (p: string) => messages.some((m: any) => m.phase === p && m.role === 'assistant');
  const hasClosing = hasPhase('closing');
  const hasAllPhases = hasPhase('technical') && hasPhase('cultural') && hasPhase('experience');
  const questionsAsked = state.questions_asked || 0;
  const elapsed = (Date.now() / 1000 - (state.start_time || Date.now() / 1000)) / 60;

  if (!hasClosing) return false;
  if (elapsed >= 15) return true;
  if (questionsAsked >= 20) return true;
  return hasAllPhases && questionsAsked >= 10;
}

async function conductConversation(
  assessmentId: string,
  userMessage: string,
  roleContext: any,
  currentState: any,
  resumeData: any = {}
): Promise<any> {
  const systemPrompt = buildSystemPrompt(roleContext, resumeData);
  const messages = currentState?.messages || [];

  // Build message history for Anthropic
  const history: Anthropic.MessageParam[] = messages
    .filter((m: any) => m.role === 'user' || m.role === 'assistant')
    .map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

  // Add the new user message if provided
  if (userMessage?.trim()) {
    history.push({ role: 'user', content: userMessage });
  }

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: systemPrompt,
    messages: history.length > 0 ? history : [{ role: 'user', content: 'Hello' }]
  });

  const aiContent = (response.content[0] as any).text || '';
  const now = new Date().toISOString();
  const currentPhase = currentState?.current_phase || 'opening';
  const detectedPhase = detectPhase(aiContent, currentPhase);

  // Append user message
  const newMessages = [...messages];
  if (userMessage?.trim()) {
    newMessages.push({ role: 'user', content: userMessage, timestamp: now, phase: currentPhase });
  }
  // Append AI response
  newMessages.push({ role: 'assistant', content: aiContent, timestamp: new Date().toISOString(), phase: detectedPhase });

  return {
    ...currentState,
    messages: newMessages,
    current_phase: detectedPhase,
    questions_asked: (currentState?.questions_asked || 0) + 1,
    start_time: currentState?.start_time || Date.now() / 1000,
    insights: currentState?.insights || {},
    skills_asked: currentState?.skills_asked || [],
    configured_questions_asked: currentState?.configured_questions_asked || []
  };
}

// ── Scoring + Feedback (async background task) ───────────────────────────────

async function scoreAndGenerateFeedback(assessmentId: string): Promise<void> {
  try {
    const assessment = assessmentDb.findById(assessmentId);
    if (!assessment) return;

    const position = assessment.position_id ? positionDb.findById(assessment.position_id) : null;
    const conversationData = typeof assessment.conversation_data === 'string'
      ? JSON.parse(assessment.conversation_data)
      : assessment.conversation_data || {};
    const messages = conversationData.messages || [];
    const transcript = messages
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .map((m: any) => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n\n');

    const positionData = position ? (
      typeof position.requirements === 'string' ? JSON.parse(position.requirements) : position.requirements
    ) : {};
    const skills = positionData?.skills || [];
    const weights = position ? (
      typeof position.scoring_weights === 'string' ? JSON.parse(position.scoring_weights) : position.scoring_weights
    ) : { technical: 40, cultural: 25, experience: 20, market: 15 };

    const scoringPrompt = `You are an expert recruiter evaluating a candidate interview transcript. Score the candidate on a scale of 0-100 for each dimension.

Position: ${position?.title || 'Unknown'}
Required Skills: ${skills.map((s: any) => typeof s === 'object' ? s.skill : s).join(', ')}
Scoring Weights: Technical ${weights.technical}%, Cultural ${weights.cultural}%, Experience ${weights.experience}%, Market ${weights.market}%

## Transcript
${transcript.slice(0, 8000)}

Respond ONLY with valid JSON in this exact format:
{
  "technical_score": 75,
  "cultural_score": 80,
  "experience_score": 70,
  "market_score": 65,
  "overall_score": 74,
  "feedback": {
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["area 1", "area 2"],
    "overall_summary": "Brief summary",
    "next_steps": {
      "timeline": "48 hours",
      "likely_outcome": "review",
      "message": "The hiring team will review your profile within 48 hours."
    },
    "encouragement": "Thank you for completing the assessment."
  },
  "detailed_scores": {
    "technical": {
      "individual_skill_scores": {}
    }
  }
}`;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: scoringPrompt }]
    });

    const raw = (response.content[0] as any).text || '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in scoring response');
    const scored = JSON.parse(jsonMatch[0]);

    assessmentDb.update(assessmentId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      overall_score: scored.overall_score,
      technical_score: scored.technical_score,
      cultural_score: scored.cultural_score,
      experience_score: scored.experience_score,
      market_score: scored.market_score,
      feedback_data: JSON.stringify(scored.feedback || {}),
      updated_at: new Date().toISOString()
    });

    console.log(`✅ [Assessment ${assessmentId}] Scored: overall=${scored.overall_score}`);
  } catch (err: any) {
    console.error(`❌ [Assessment ${assessmentId}] Scoring failed:`, err.message);
    assessmentDb.update(assessmentId, { status: 'scoring_failed', updated_at: new Date().toISOString() });
  }
}

// ── Routes ───────────────────────────────────────────────────────────────────

export const assessmentRoutes = new Elysia({ prefix: '/api/v1/assessments' })

  // GET /assessments/:id — get assessment details + conversation
  .get('/:id', async ({ params: { id }, set }) => {
    const assessment = assessmentDb.findById(id);
    if (!assessment) {
      set.status = 404;
      return { error: 'Assessment not found' };
    }

    const conversationData = typeof assessment.conversation_data === 'string'
      ? JSON.parse(assessment.conversation_data || '{}')
      : assessment.conversation_data || {};

    let messages = conversationData.messages || [];

    // Fallback: get from messages table if conversation_data has no messages
    if (!messages.length) {
      const dbMessages = assessmentDb.getMessages(id);
      messages = dbMessages.map((m: any) => ({
        role: m.role, content: m.content, timestamp: m.timestamp, phase: m.phase || 'opening'
      }));
    }

    // Sort by timestamp
    messages = [...messages].sort((a: any, b: any) =>
      (a.timestamp || '').localeCompare(b.timestamp || '')
    );

    const result: any = {
      id: assessment.id,
      position_id: assessment.position_id,
      status: assessment.status,
      candidate_name: assessment.candidate_name,
      candidate_email: assessment.candidate_email,
      updated_at: assessment.updated_at,
      completed_at: assessment.completed_at,
      messages,
      current_phase: conversationData.current_phase || 'opening',
      questions_asked: conversationData.questions_asked || 0,
      conversation_state: conversationData
    };

    if (assessment.status === 'completed') {
      const position = assessment.position_id ? positionDb.findById(assessment.position_id) : null;
      const weights = position ? (
        typeof position.scoring_weights === 'string'
          ? JSON.parse(position.scoring_weights)
          : position.scoring_weights
      ) : { technical: 40, cultural: 25, experience: 20, market: 15 };

      result.scores = {
        overall: assessment.overall_score,
        technical: assessment.technical_score,
        cultural: assessment.cultural_score,
        experience: assessment.experience_score,
        market: assessment.market_score,
        weights
      };
      result.feedback = typeof assessment.feedback_data === 'string'
        ? JSON.parse(assessment.feedback_data || '{}')
        : assessment.feedback_data || {};
    }

    return result;
  })

  // POST /assessments — create and start a new assessment
  .post('', async ({ body, set }) => {
    const { position_id, candidate_email, candidate_name, tenant_id, theme } = body as any;

    const position = positionDb.findById(position_id);
    if (!position) {
      set.status = 404;
      return { error: 'Position not found' };
    }

    const id = crypto.randomUUID();
    const requirements = typeof position.requirements === 'string'
      ? JSON.parse(position.requirements || '{}')
      : position.requirements || {};
    const jdParsed = typeof position.jd_parsed === 'string'
      ? JSON.parse(position.jd_parsed || '{}')
      : position.jd_parsed || {};
    const industry = position.industry || jdParsed.industry || 'general';

    const conversationData = {
      messages: [],
      current_phase: 'opening',
      insights: {},
      start_time: Date.now() / 1000,
      questions_asked: 0,
      configured_questions_asked: [],
      skills_asked: []
    };

    const roleContext = {
      title: position.title,
      company_name: 'Company',
      industry,
      requirements,
      culture_data: position.culture_data
        ? (typeof position.culture_data === 'string' ? JSON.parse(position.culture_data) : position.culture_data)
        : {},
      configured_questions: position.questions
        ? (typeof position.questions === 'string' ? JSON.parse(position.questions) : position.questions)
        : [],
      resume_data: {}
    };

    // Create assessment row
    assessmentDb.create({
      id,
      position_id,
      candidate_email: candidate_email.trim(),
      candidate_name: candidate_name?.trim() || null,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      conversation_data: JSON.stringify(conversationData),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Kick off the first AI greeting
    try {
      const state = await conductConversation(id, '', roleContext, conversationData);
      assessmentDb.update(id, {
        conversation_data: JSON.stringify(state),
        updated_at: new Date().toISOString()
      });

      const introMessage = state.messages.findLast(
        (m: any) => m.role === 'assistant' && ['opening', 'introduction'].includes(m.phase)
      );

      return {
        id,
        position_id,
        status: 'in_progress',
        assessment_url: `/assessment/${id}`,
        started_at: new Date().toISOString(),
        intro_message: introMessage || null
      };
    } catch (err: any) {
      set.status = 500;
      return { error: `Failed to start conversation: ${err.message}` };
    }
  }, {
    body: t.Object({
      position_id: t.String(),
      candidate_email: t.String(),
      candidate_name: t.Optional(t.String()),
      tenant_id: t.Optional(t.String()),
      theme: t.Optional(t.Any())
    })
  })

  // POST /assessments/with-resume — create assessment with resume upload
  .post('/with-resume', async ({ request, set }) => {
    try {
      const form = await request.formData();
      const position_id = form.get('position_id') as string || form.get('role_id') as string;
      const candidate_email = form.get('candidate_email') as string;
      const candidate_name = form.get('candidate_name') as string | null;

      if (!position_id || !candidate_email) {
        set.status = 400;
        return { error: 'position_id and candidate_email are required' };
      }

      const position = positionDb.findById(position_id);
      if (!position) {
        set.status = 404;
        return { error: 'Position not found' };
      }

      const id = crypto.randomUUID();
      let resumeFilePath: string | null = null;
      let resumeParsedData: any = null;
      let resumeUploadedAt: string | null = null;

      const resumeFile = form.get('resume') as File | null;
      if (resumeFile && resumeFile.size > 0) {
        const ext = extname(resumeFile.name).toLowerCase();
        if (!RESUME_ALLOWED_EXTENSIONS.has(ext)) {
          set.status = 400;
          return { error: `Resume must be PDF, Word (.doc, .docx), or RTF. Got: ${ext || 'unknown'}` };
        }
        if (resumeFile.size > RESUME_MAX_BYTES) {
          set.status = 400;
          return { error: 'Resume file too large. Maximum size is 10 MB.' };
        }

        const bytes = await resumeFile.arrayBuffer();
        const resumesDir = join(process.cwd(), 'data', 'resumes');
        await mkdir(resumesDir, { recursive: true });
        const savedPath = join(resumesDir, `${id}${ext}`);
        await writeFile(savedPath, Buffer.from(bytes));
        resumeFilePath = savedPath;
        resumeUploadedAt = new Date().toISOString();

        // Basic parsing: extract text metadata (full parsing would use pdf-parse or similar)
        resumeParsedData = { file_path: savedPath, extension: ext, size_bytes: resumeFile.size };
      }

      const requirements = typeof position.requirements === 'string'
        ? JSON.parse(position.requirements || '{}')
        : position.requirements || {};
      const jdParsed = typeof position.jd_parsed === 'string'
        ? JSON.parse(position.jd_parsed || '{}')
        : position.jd_parsed || {};

      const conversationData = {
        messages: [],
        current_phase: 'opening',
        insights: {},
        start_time: Date.now() / 1000,
        questions_asked: 0,
        configured_questions_asked: [],
        skills_asked: []
      };

      const roleContext = {
        title: position.title,
        company_name: 'Company',
        industry: position.industry || jdParsed.industry || 'general',
        requirements,
        culture_data: position.culture_data
          ? (typeof position.culture_data === 'string' ? JSON.parse(position.culture_data) : position.culture_data)
          : {},
        configured_questions: position.questions
          ? (typeof position.questions === 'string' ? JSON.parse(position.questions) : position.questions)
          : [],
        resume_data: resumeParsedData || {}
      };

      assessmentDb.create({
        id,
        position_id,
        candidate_email: candidate_email.trim(),
        candidate_name: candidate_name?.trim() || null,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        conversation_data: JSON.stringify(conversationData),
        resume_file_path: resumeFilePath,
        resume_parsed_data: resumeParsedData ? JSON.stringify(resumeParsedData) : null,
        resume_uploaded_at: resumeUploadedAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const state = await conductConversation(id, '', roleContext, conversationData, resumeParsedData);
      assessmentDb.update(id, {
        conversation_data: JSON.stringify(state),
        updated_at: new Date().toISOString()
      });

      const introMessage = state.messages.findLast(
        (m: any) => m.role === 'assistant' && ['opening', 'introduction'].includes(m.phase)
      );

      return {
        id,
        position_id,
        status: 'in_progress',
        assessment_url: `/assessment/${id}`,
        started_at: new Date().toISOString(),
        intro_message: introMessage || null,
        has_resume: !!resumeFilePath
      };
    } catch (err: any) {
      set.status = 500;
      return { error: `Failed to create assessment with resume: ${err.message}` };
    }
  })

  // POST /assessments/:id/message — send a candidate message
  .post('/:id/message', async ({ params: { id }, body, set }) => {
    const assessment = assessmentDb.findById(id);
    if (!assessment) {
      set.status = 404;
      return { error: 'Assessment not found' };
    }
    if (assessment.status !== 'in_progress') {
      set.status = 400;
      return { error: 'Assessment is not in progress' };
    }

    const position = assessment.position_id ? positionDb.findById(assessment.position_id) : null;
    if (!position) {
      set.status = 404;
      return { error: 'Position not found' };
    }

    const requirements = typeof position.requirements === 'string'
      ? JSON.parse(position.requirements || '{}')
      : position.requirements || {};
    const resumeData = assessment.resume_parsed_data
      ? (typeof assessment.resume_parsed_data === 'string'
        ? JSON.parse(assessment.resume_parsed_data)
        : assessment.resume_parsed_data)
      : {};
    const jdParsed = typeof position.jd_parsed === 'string'
      ? JSON.parse(position.jd_parsed || '{}')
      : position.jd_parsed || {};

    const roleContext = {
      title: position.title,
      company_name: 'Company',
      industry: position.industry || jdParsed.industry || 'general',
      requirements,
      culture_data: position.culture_data
        ? (typeof position.culture_data === 'string' ? JSON.parse(position.culture_data) : position.culture_data)
        : {},
      configured_questions: position.questions
        ? (typeof position.questions === 'string' ? JSON.parse(position.questions) : position.questions)
        : [],
      resume_data: resumeData
    };

    const currentState = typeof assessment.conversation_data === 'string'
      ? JSON.parse(assessment.conversation_data || '{}')
      : assessment.conversation_data || {};

    const userContent = (body as any).content || '';

    try {
      const newState = await conductConversation(id, userContent, roleContext, currentState, resumeData);
      const complete = isComplete(newState, position);

      assessmentDb.update(id, {
        conversation_data: JSON.stringify(newState),
        status: complete ? 'scoring' : 'in_progress',
        completed_at: complete ? new Date().toISOString() : undefined,
        duration_seconds: complete
          ? Math.floor(Date.now() / 1000 - (newState.start_time || Date.now() / 1000))
          : undefined,
        updated_at: new Date().toISOString()
      });

      // Kick off async scoring if complete
      if (complete) {
        scoreAndGenerateFeedback(id).catch(console.error);
      }

      // Deduplicate + sort messages
      const seen = new Set<string>();
      const messages = newState.messages
        .sort((a: any, b: any) => (a.timestamp || '').localeCompare(b.timestamp || ''))
        .filter((m: any) => {
          const key = `${m.role}:${(m.content || '').slice(0, 80)}:${(m.timestamp || '').slice(0, 19)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      return {
        messages,
        conversation_state: newState,
        phase: newState.current_phase,
        progress: calculateProgress(newState),
        is_complete: complete
      };
    } catch (err: any) {
      set.status = 500;
      return { error: `Conversation failed: ${err.message}` };
    }
  })

  // GET /assessments/:id/results — get completed assessment results
  .get('/:id/results', async ({ params: { id }, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!auth) return { error: 'Unauthorized' };

    const assessment = assessmentDb.findById(id);
    if (!assessment) {
      set.status = 404;
      return { error: 'Assessment not found' };
    }

    if (assessment.status === 'scoring') {
      return { id, status: 'scoring', message: 'Your results are being processed. Check back in a moment.' };
    }

    const position = assessment.position_id ? positionDb.findById(assessment.position_id) : null;
    const weights = position ? (
      typeof position.scoring_weights === 'string'
        ? JSON.parse(position.scoring_weights)
        : position.scoring_weights
    ) : { technical: 40, cultural: 25, experience: 20, market: 15 };

    return {
      id,
      status: assessment.status,
      scores: {
        overall: assessment.overall_score,
        technical: assessment.technical_score,
        cultural: assessment.cultural_score,
        experience: assessment.experience_score,
        market: assessment.market_score,
        weights
      },
      feedback: typeof assessment.feedback_data === 'string'
        ? JSON.parse(assessment.feedback_data || '{}')
        : assessment.feedback_data || {},
      completed_at: assessment.completed_at
    };
  })

  // GET /assessments/link/:link — get assessment by assessment_link (for candidate entry)
  .get('/link/:link', async ({ params: { link }, set }) => {
    const position = positionDb.findAll().find(p => p.assessment_link === link);
    if (!position) {
      set.status = 404;
      return { error: 'Assessment link not found' };
    }
    const requirements = typeof position.requirements === 'string'
      ? JSON.parse(position.requirements || '{}')
      : position.requirements || {};

    return {
      position_id: position.id,
      title: position.title,
      company_id: position.company_id,
      requirements,
      branding: position.branding
        ? (typeof position.branding === 'string' ? JSON.parse(position.branding) : position.branding)
        : {},
      status: position.status
    };
  });
