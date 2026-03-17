import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const jdSchema = z.object({
  title: z.string(),
  industry: z.string().default('general'),
  required_skills: z.array(z.string()),
  experience_years: z.object({
    min: z.number().default(3),
    max: z.number().default(5)
  }),
  responsibilities: z.array(z.string()),
  nice_to_haves: z.array(z.string()),
  work_style: z.string(),
  communication_style: z.string(),
  cultural_traits: z.array(z.string()),
  deal_breakers: z.array(z.string()),
  salary_range: z.optional(z.string()),
  location: z.string(),
  remote_policy: z.string(),
});

/**
 * AI Powered JD Parser
 */
export async function parseJobDescription(jdText: string, companyUrl?: string) {
  const { object } = await generateObject({
    model: google('gemini-1.5-flash'),
    schema: jdSchema,
    prompt: `
      Analyze the following job description and extract structured information.
      If a company URL is provided (${companyUrl || 'none'}), consider the likely company culture.
      
      JOB DESCRIPTION:
      ${jdText}
    `,
  });

  return object;
}
