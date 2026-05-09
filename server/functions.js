import crypto from 'node:crypto';
import { generateIntakeCard } from './claude.js';
import * as defaultStorage from './storage.js';

function parseJsonish(value, fallback) {
  if (Array.isArray(value) || (value && typeof value === 'object')) {
    return value;
  }

  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function tag_urgency(args, broadcast, context = {}) {
  broadcast({
    type: 'URGENCY_ALERT',
    mode: args.mode || context.mode || 'clinic',
    ...args,
  });

  return { success: true };
}

export async function finalize_intake(args, broadcast, storage = defaultStorage, context = {}) {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const structuredFields = parseJsonish(args.structured_fields, {});
  const resourceMatches = parseJsonish(args.resource_matches, []);
  const mode = args.mode || context.mode || 'clinic';
  const card = await generateIntakeCard({
    ...args,
    mode,
    structured_fields: structuredFields,
    resource_matches: resourceMatches,
    id,
    timestamp,
    status: 'new',
  });

  const storedCard = await storage.save({
    ...card,
    id,
    mode,
    language: card.language || args.language || structuredFields.language || 'Unknown',
    structured_fields: card.structured_fields || structuredFields,
    resource_matches: card.resource_matches || resourceMatches,
    red_flags: card.red_flags || args.red_flags || [],
    transcript: args.transcript || '',
    timestamp,
    status: card.status || 'new',
  });

  broadcast({
    type: 'NEW_INTAKE',
    card: storedCard,
  });

  return { success: true, id: storedCard.id };
}

export async function lookup_resources(args) {
  const resourcesByCategory = {
    clinic: [
      {
        name: 'Davis Community Clinic',
        address: '2051 John Jones Rd, Davis, CA',
        phone: '(530) 758-2060',
        hours: 'Mon-Fri 8:00 AM-5:00 PM',
        type: 'clinic',
      },
      {
        name: 'CommuniCare Health Centers',
        address: '215 W Beamer St, Woodland, CA',
        phone: '(530) 668-2600',
        hours: 'Mon-Fri 8:00 AM-6:00 PM',
        type: 'clinic',
      },
    ],
    shelter: [
      {
        name: 'Fourth and Hope',
        address: '1901 E Beamer St, Woodland, CA',
        phone: '(530) 661-1218',
        hours: 'Daily intake by phone',
        type: 'shelter',
      },
      {
        name: 'Empower Yolo',
        address: '175 Walnut St, Woodland, CA',
        phone: '(530) 661-6333',
        hours: '24/7 crisis line',
        type: 'shelter',
      },
    ],
    food: [
      {
        name: 'Yolo Food Bank',
        address: '233 Harter Ave, Woodland, CA',
        phone: '(530) 668-0690',
        hours: 'Distribution times vary',
        type: 'food',
      },
      {
        name: 'Davis Community Meals and Housing',
        address: '1111 H St, Davis, CA',
        phone: '(530) 756-4008',
        hours: 'Meal programs vary',
        type: 'food',
      },
    ],
    pharmacy: [
      {
        name: 'Rite Aid Pharmacy',
        address: `Near ${args.city || 'Davis'}, CA`,
        phone: '(530) 753-9810',
        hours: 'Mon-Fri 9:00 AM-9:00 PM',
        type: 'pharmacy',
      },
      {
        name: 'CVS Pharmacy',
        address: `Near ${args.city || 'Davis'}, CA`,
        phone: '(530) 758-8226',
        hours: 'Daily 8:00 AM-10:00 PM',
        type: 'pharmacy',
      },
    ],
    interpreter: [
      {
        name: 'Yolo County Language Access Line',
        address: `Remote support near ${args.city || 'Davis'}, CA`,
        phone: '(530) 555-0147',
        hours: 'Mon-Fri 8:00 AM-6:00 PM',
        type: 'interpreter',
      },
      {
        name: 'Community Interpreter Network',
        address: 'Phone and video support',
        phone: '(530) 555-0190',
        hours: 'By appointment',
        type: 'interpreter',
      },
    ],
    emergency_line: [
      {
        name: 'Emergency Services',
        address: 'Call 911 for immediate life-threatening danger',
        phone: '911',
        hours: '24/7',
        type: 'emergency_line',
      },
      {
        name: '988 Suicide and Crisis Lifeline',
        address: 'Phone, text, and chat support',
        phone: '988',
        hours: '24/7',
        type: 'emergency_line',
      },
    ],
  };

  return resourcesByCategory[args.category] || resourcesByCategory.clinic;
}

export const handlers = {
  tag_urgency,
  finalize_intake,
  lookup_resources,
};

export async function dispatchFunctionCall(
  name,
  args,
  broadcast,
  storage = defaultStorage,
  context = {},
) {
  const handler = handlers[name];

  if (!handler) {
    return { success: false, error: `Unknown function: ${name}` };
  }

  if (name === 'finalize_intake') {
    return handler(args, broadcast, storage, context);
  }

  if (name === 'tag_urgency') {
    return handler(args, broadcast, context);
  }

  return handler(args);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const broadcast = (event) => console.log('broadcast:', JSON.stringify(event, null, 2));

  await tag_urgency(
    {
      level: 'CRITICAL',
      reason: 'Chest pain with left arm pain',
      symptoms: ['chest pain', 'left arm pain'],
    },
    broadcast,
  );

  console.log(
    'resources:',
    await lookup_resources({ category: 'clinic', city: 'Davis' }),
  );
}
