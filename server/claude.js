import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const CARD_SYSTEM_PROMPT = `You are a case intake processor for CowmunityCare, a multilingual intake layer for frontline social-good organizations. Given patient or client intake data, produce a concise structured case card for staff. Output only valid JSON matching the schema below. Do not add commentary.

{
  "id": "string",
  "timestamp": "string",
  "status": "new",
  "mode": "clinic|shelter|food_aid",
  "language": "string",
  "patient": { "name": "string", "language": "string", "interpreter_needed": true },
  "visit": { "reason": "string", "duration": "string", "severity": 0, "notes": "string" },
  "urgency": { "level": "string", "suggested_next_step": "string", "reasoning": "string" },
  "accessibility": "string",
  "accessibility_needs": ["string"],
  "support_contact": { "name": "string", "relationship": "string", "phone": "string" },
  "insurance": "string",
  "structured_fields": {},
  "transcript_summary": "string",
  "english_summary": "string",
  "recommended_next_step": "string",
  "resource_matches": [],
  "red_flags": []
}

For accessibility_needs: extract a JSON array of specific accessibility requirements mentioned (e.g. ["wheelchair access", "Spanish interpreter", "transportation help"]). Use an empty array if none.
For support_contact: extract name, relationship, and phone from structured_fields if a support/emergency contact was mentioned. Use null if none provided.`;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function extractJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export async function generateIntakeCard(intakeArgs) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required to generate an intake card.');
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    temperature: 0,
    system: CARD_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: JSON.stringify(intakeArgs, null, 2),
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

  try {
    return JSON.parse(extractJson(text));
  } catch (error) {
    throw new Error(`Claude returned invalid JSON: ${text}`, { cause: error });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const demoIntake = {
    id: 'demo-card',
    timestamp: new Date().toISOString(),
    mode: 'clinic',
    language: 'Spanish',
    transcript: 'Maria reports chest pain and left arm pain since this morning.',
    english_summary: 'Spanish-speaking patient reports chest pain and left arm pain since this morning.',
    structured_fields: {
      full_name: 'Maria Lopez',
      reason_for_visit: 'Chest pain and left arm pain',
      symptom_duration: 'Since this morning',
      severity_1_to_10: 8,
      insurance_or_cost_concern: 'Uninsured',
    },
    urgency: 'CRITICAL',
    red_flags: ['chest pain', 'left arm pain'],
    accessibility_needs: 'Spanish interpreter',
    recommended_next_step: 'Nurse triage now',
    resource_matches: [],
  };

  generateIntakeCard(demoIntake)
    .then((card) => console.log(JSON.stringify(card, null, 2)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
