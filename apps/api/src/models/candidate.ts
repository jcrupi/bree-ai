import { t } from 'elysia';

export const AssessmentStatusEnum = t.Union([
  t.Literal('in_progress'),
  t.Literal('completed'),
  t.Literal('abandoned')
]);

export const RecruiterStatusEnum = t.Union([
  t.Literal('reviewing'),
  t.Literal('advanced'),
  t.Literal('rejected')
]);

export const AssessmentSchema = t.Object({
  id: t.String(),
  position_id: t.String(),
  candidate_email: t.String(),
  candidate_name: t.Optional(t.String()),
  status: t.Optional(AssessmentStatusEnum),
  started_at: t.Optional(t.String()),
  completed_at: t.Optional(t.String()),
  overall_score: t.Optional(t.Number()),
  technical_score: t.Optional(t.Number()),
  cultural_score: t.Optional(t.Number()),
  experience_score: t.Optional(t.Number()),
  market_score: t.Optional(t.Number()),
  conversation_data: t.Optional(t.Any()),
  feedback_data: t.Optional(t.Any()),
  resume_file_path: t.Optional(t.String()),
  resume_parsed_data: t.Optional(t.Any()),
  resume_uploaded_at: t.Optional(t.String()),
  recruiter_status: t.Optional(RecruiterStatusEnum),
  recruiter_notes: t.Optional(t.String()),
  duration_seconds: t.Optional(t.Number()),
  created_at: t.Optional(t.String()),
  updated_at: t.Optional(t.String()),
});

export const CandidateNoteSchema = t.Object({
  id: t.String(),
  assessment_id: t.String(),
  user_id: t.Optional(t.Number()),
  user_name: t.Optional(t.String()),
  content: t.String(),
  created_at: t.Optional(t.String()),
});

export const MessageSchema = t.Object({
  id: t.String(),
  assessment_id: t.String(),
  role: t.Union([t.Literal('assistant'), t.Literal('user')]),
  content: t.String(),
  phase: t.Optional(t.String()),
  timestamp: t.Optional(t.String()),
});

export type Assessment = typeof AssessmentSchema.static;
export type CandidateNote = typeof CandidateNoteSchema.static;
export type Message = typeof MessageSchema.static;
