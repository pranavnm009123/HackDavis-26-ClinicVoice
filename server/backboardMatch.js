import fs from 'node:fs/promises';
import { createBackboardClient, RESOURCE_GUIDE_PATH } from './backboardRag.js';

const DEFAULT_API_BASE = 'https://app.backboard.io/api';

function extractJsonFromModelText(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const raw = fenced ? fenced[1].trim() : trimmed;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return raw.slice(start, end + 1);
  }
  return raw;
}

function buildIntakePayload(input) {
  return {
    mode: input.mode,
    urgency: input.urgency ?? '',
    language: input.language ?? '',
    location: input.location ?? 'Davis / Yolo County, CA',
    needs: Array.isArray(input.needs) ? input.needs : [],
  };
}

function buildPromptWithInlineGuide(payload, guideBlock) {
  return `You are VoiceBridge's resource intelligence layer for frontline nonprofits (free clinics, shelters, food programs).

GROUNDING: Prefer these curated local entries when they fit. Use web search only to supplement or verify current phone/hours if needed.

--- Curated resource guide ---
${guideBlock}
--- End guide ---

Intake (JSON):
${JSON.stringify(payload, null, 2)}

Respond with ONLY valid JSON (no markdown code fences, no commentary). Shape:
{
  "escalation_note": null or a short string (e.g. 911/988 if immediate danger or severe symptoms),
  "matches": [
    {
      "name": "string",
      "type": "free_clinic|shelter|food_bank|crisis|interpreter|insurance_help|pharmacy|other",
      "why": "one sentence tied to this intake",
      "nextStep": "what staff should do next",
      "phone": "optional string",
      "address": "optional string"
    }
  ]
}

Return 3 to 5 matches when reasonable. Never provide medical diagnosis; only service navigation.`;
}

function buildPromptForAssistantRag(payload) {
  return `You are VoiceBridge's resource intelligence layer. Use the nonprofit resource documents attached to this assistant (RAG) as the primary source of truth. Use web search only to verify or supplement current phone numbers, hours, or listings when the documents may be outdated.

Intake (JSON):
${JSON.stringify(payload, null, 2)}

Respond with ONLY valid JSON (no markdown code fences, no commentary). Shape:
{
  "escalation_note": null or a short string (e.g. 911/988 if immediate danger or severe symptoms),
  "matches": [
    {
      "name": "string",
      "type": "free_clinic|shelter|food_bank|crisis|interpreter|insurance_help|pharmacy|other",
      "why": "one sentence tied to this intake and why this resource fits",
      "nextStep": "what staff should do next",
      "phone": "optional string",
      "address": "optional string"
    }
  ]
}

Return 3 to 5 matches when reasonable. Never provide medical diagnosis; only service navigation. Prefer documented resources over invention.`;
}

function normalizeParsedResponse(parsed) {
  if (!Array.isArray(parsed.matches)) {
    throw new Error('Backboard JSON missing "matches" array');
  }

  return {
    escalation_note: parsed.escalation_note ?? null,
    matches: parsed.matches.map((m) => ({
      name: m.name || 'Unknown resource',
      type: m.type || 'other',
      why: m.why || '',
      nextStep: m.nextStep || m.next_step || '',
      phone: m.phone || '',
      address: m.address || '',
      source: 'backboard',
    })),
  };
}

function parseBackboardMessageContent(content) {
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Backboard response missing content');
  }

  let parsed;
  try {
    parsed = JSON.parse(extractJsonFromModelText(content));
  } catch (e) {
    throw new Error(`Backboard content was not valid JSON: ${content.slice(0, 400)}`, { cause: e });
  }

  return normalizeParsedResponse(parsed);
}

async function matchViaAssistantRag(input, assistantId) {
  const client = createBackboardClient();
  const payload = buildIntakePayload(input);
  const prompt = buildPromptForAssistantRag(payload);

  const response = await client.sendMessage({
    content: prompt,
    assistantId,
    stream: false,
    web_search: 'Auto',
  });

  const text = response?.content;
  if (typeof text !== 'string') {
    throw new Error('Unexpected Backboard SDK response shape (no content string)');
  }

  return parseBackboardMessageContent(text);
}

async function matchViaInlineFetch(input, apiKey, guideText) {
  const guideBlock =
    guideText?.trim() ||
    '(No local guide file found — use web search carefully and prefer verifiable public listings.)';

  const payload = buildIntakePayload(input);
  const prompt = buildPromptWithInlineGuide(payload, guideBlock);

  const base = (process.env.BACKBOARD_API_URL || DEFAULT_API_BASE).replace(/\/$/, '');
  const url = `${base}/threads/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: prompt,
      stream: false,
      web_search: 'Auto',
    }),
  });

  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`Backboard HTTP ${res.status}: ${rawText.slice(0, 500)}`);
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`Backboard returned non-JSON: ${rawText.slice(0, 200)}`);
  }

  const content = typeof data.content === 'string' ? data.content : '';
  return parseBackboardMessageContent(content);
}

/**
 * Load optional nonprofit-authored resource guide (used when RAG assistant id is not set).
 */
export async function loadCuratedResourceGuide() {
  try {
    return await fs.readFile(RESOURCE_GUIDE_PATH, 'utf8');
  } catch {
    return '';
  }
}

/**
 * @param {object} input
 * @param {string} input.mode
 * @param {string} [input.urgency]
 * @param {string} [input.language]
 * @param {string} [input.location]
 * @param {string[]} [input.needs]
 * @param {object} [options]
 * @param {string} [options.curatedContext] inline guide text (skips reading file if set)
 * @param {boolean} [options.preferAssistantRag] default: use env BACKBOARD_ASSISTANT_ID
 */
export async function matchResourcesWithBackboard(input, options = {}) {
  const apiKey = process.env.BACKBOARD_API_KEY;
  if (!apiKey) {
    throw new Error('BACKBOARD_API_KEY is not set');
  }

  const assistantId = process.env.BACKBOARD_ASSISTANT_ID;
  const useRag =
    options.preferAssistantRag !== false && typeof assistantId === 'string' && assistantId.trim().length > 0;

  if (useRag) {
    return matchViaAssistantRag(input, assistantId.trim());
  }

  const guide =
    options.curatedContext !== undefined ? options.curatedContext : await loadCuratedResourceGuide();

  return matchViaInlineFetch(input, apiKey, guide);
}

export function buildMatchInputFromCard(card, args = {}) {
  const sf = card.structured_fields || {};
  const urgencyVal =
    typeof card.urgency === 'object' && card.urgency !== null
      ? card.urgency.level || card.urgency
      : card.urgency;
  const needs = [];

  for (const key of ['reason_for_visit', 'bed_or_resource_need', 'requested_supplies', 'housing_status']) {
    if (sf[key]) {
      needs.push(String(sf[key]));
    }
  }
  if (Array.isArray(card.red_flags) && card.red_flags.length) {
    needs.push(...card.red_flags.map((r) => `Concern: ${r}`));
  }
  if (args.accessibility_needs) {
    needs.push(`Accessibility: ${args.accessibility_needs}`);
  }
  const lang = card.language || args.language || sf.language;
  if (lang && lang !== 'Unknown' && lang !== 'auto') {
    needs.push(`Language: ${lang}`);
  }
  if (card.insurance || sf.insurance_or_cost_concern) {
    needs.push(`Insurance/cost: ${card.insurance || sf.insurance_or_cost_concern}`);
  }

  const location =
    sf.city || sf.zip_code || sf.location || sf.county || 'Davis / Yolo County, CA';

  if (needs.length === 0) {
    needs.push(card.english_summary || card.transcript_summary || card.transcript || 'General intake support');
  }

  return {
    mode: card.mode || 'clinic',
    urgency: (urgencyVal || 'UNKNOWN').toString(),
    language: lang || 'Unknown',
    location: String(location),
    needs,
  };
}

/**
 * After an intake is saved, enrich resource_matches via Backboard and broadcast an update.
 */
export async function enrichIntakeWithBackboard(storedCard, args, broadcast, storage) {
  const input = buildMatchInputFromCard(storedCard, args);
  const matchOptions = {};
  if (!process.env.BACKBOARD_ASSISTANT_ID?.trim()) {
    matchOptions.curatedContext = await loadCuratedResourceGuide();
  }

  const { matches, escalation_note } = await matchResourcesWithBackboard(input, matchOptions);

  const existing = Array.isArray(storedCard.resource_matches) ? storedCard.resource_matches : [];
  const merged = [...existing];

  for (const m of matches) {
    if (!merged.some((e) => typeof e === 'object' && e?.name === m.name && e?.source === 'backboard')) {
      merged.push(m);
    }
  }

  const patch = {
    resource_matches: merged,
    backboard_escalation_note: escalation_note ? String(escalation_note) : '',
    backboard_matched_at: new Date(),
  };

  const updated = await storage.updateIntake(storedCard.id, patch);
  if (updated) {
    broadcast({ type: 'INTAKE_UPDATED', card: updated });
  }
}
