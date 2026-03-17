import { t } from 'elysia';

export const ScoringWeightsSchema = t.Object({
  technical: t.Optional(t.Number({ default: 40 })),
  cultural: t.Optional(t.Number({ default: 25 })),
  experience: t.Optional(t.Number({ default: 20 })),
  market: t.Optional(t.Number({ default: 15 })),
});

export const PositionBaseSchema = t.Object({
  title: t.String(),
  description: t.Optional(t.String()),
  requirements: t.Optional(t.Any()),
});

export const PositionCreateSchema = t.Composite([
  PositionBaseSchema,
  t.Object({
    company_id: t.String(),
    scoring_weights: t.Optional(ScoringWeightsSchema),
    jd_text: t.Optional(t.String()),
    company_url: t.Optional(t.String()),
    customizations: t.Optional(t.Any()),
  })
]);

export const PositionSchema = t.Composite([
  PositionBaseSchema,
  t.Object({
    id: t.String(),
    company_id: t.String(),
    status: t.String({ default: 'active' }),
    created_by: t.Optional(t.Number()),
    assessment_link: t.Optional(t.String()),
    scoring_weights: t.Optional(t.Any()),
    jd_original: t.Optional(t.String()),
    jd_parsed: t.Optional(t.Any()),
    culture_data: t.Optional(t.Any()),
    questions: t.Optional(t.Array(t.Any())),
    branding: t.Optional(t.Any()),
    created_at: t.String(),
    updated_at: t.Optional(t.String()),
  })
]);

export type ScoringWeights = typeof ScoringWeightsSchema.static;
export type PositionBase = typeof PositionBaseSchema.static;
export type PositionCreate = typeof PositionCreateSchema.static;
export type Position = typeof PositionSchema.static;
