import path from 'node:path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { dispatchFunctionCall } from './functions.js';
import { buildSystemInstruction, isValidMode } from './intakeTemplates.js';
import * as defaultStorage from './storage.js';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const MODEL = 'gemini-3.1-flash-live-preview';

const functionDeclarations = [
  {
    name: 'tag_urgency',
    description: 'Flag urgent warning signs in real time for staff.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        mode: {
          type: Type.STRING,
          enum: ['clinic', 'shelter', 'food_aid'],
        },
        level: {
          type: Type.STRING,
          enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        },
        reason: { type: Type.STRING },
        symptoms: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ['level', 'reason', 'symptoms'],
    },
  },
  {
    name: 'finalize_intake',
    description: 'Create the structured case record once required fields for the selected mode are collected.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        mode: {
          type: Type.STRING,
          enum: ['clinic', 'shelter', 'food_aid'],
        },
        language: { type: Type.STRING },
        transcript: {
          type: Type.STRING,
          description: 'Concise transcript or conversation summary in the original language or mixed language.',
        },
        english_summary: {
          type: Type.STRING,
          description: 'Concise staff-facing English summary.',
        },
        structured_fields: {
          type: Type.STRING,
          description: 'Valid JSON object string keyed by field names for the selected mode.',
        },
        urgency: { type: Type.STRING },
        red_flags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        accessibility_needs: { type: Type.STRING },
        recommended_next_step: { type: Type.STRING },
        resource_matches: {
          type: Type.STRING,
          description: 'Valid JSON array string of resource matches or resource names.',
        },
      },
      required: [
        'mode',
        'language',
        'transcript',
        'english_summary',
        'structured_fields',
        'urgency',
        'red_flags',
        'accessibility_needs',
        'recommended_next_step',
      ],
    },
  },
  {
    name: 'lookup_resources',
    description: 'Return demo local resources by category and city.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          enum: ['clinic', 'shelter', 'food', 'pharmacy', 'interpreter', 'emergency_line'],
        },
        city: { type: Type.STRING },
      },
      required: ['category', 'city'],
    },
  },
  {
    name: 'schedule_appointment',
    description: 'Create a follow-up appointment for the patient and notify staff. Call this when urgency is HIGH or CRITICAL, or when the patient clearly needs nurse triage, a social worker, an interpreter, or a clinic review.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        patient_name: { type: Type.STRING },
        appointment_type: {
          type: Type.STRING,
          enum: ['nurse_triage', 'clinic_review', 'interpreter', 'social_worker', 'emergency_escalation'],
        },
        urgency: {
          type: Type.STRING,
          enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
        },
        reason: { type: Type.STRING },
        suggested_time: {
          type: Type.STRING,
          enum: ['ASAP', 'Today', 'Within 48h', 'This week'],
        },
        notes: { type: Type.STRING },
        intake_id: { type: Type.STRING },
      },
      required: ['patient_name', 'appointment_type', 'urgency', 'reason', 'suggested_time'],
    },
  },
];

function sendJson(ws, payload) {
  if (ws?.readyState === 1) {
    ws.send(JSON.stringify(payload));
  }
}

function getPartMimeRate(mimeType) {
  const match = mimeType?.match(/rate=(\d+)/);
  return match ? Number(match[1]) : 24000;
}

/** Normalize snake_case Live API payloads (JSON) alongside camelCase. */
function getLiveServerContent(message) {
  return message.serverContent ?? message.server_content;
}

function forwardServerContent(message, patientWs) {
  const content = getLiveServerContent(message);

  if (!content) {
    return;
  }

  const inputTx = content.inputTranscription ?? content.input_transcription;
  if (inputTx?.text) {
    sendJson(patientWs, {
      type: 'transcript',
      role: 'user',
      text: inputTx.text,
    });
  }

  const outputTx = content.outputTranscription ?? content.output_transcription;
  if (outputTx?.text) {
    sendJson(patientWs, {
      type: 'transcript',
      role: 'model',
      text: outputTx.text,
    });
  }

  const modelTurn = content.modelTurn ?? content.model_turn;
  const parts = modelTurn?.parts || [];
  for (const part of parts) {
    const inlineData = part.inlineData ?? part.inline_data;
    const mimeType = inlineData?.mimeType ?? inlineData?.mime_type;

    if (inlineData?.data && mimeType?.startsWith('audio/')) {
      sendJson(patientWs, {
        type: 'audio',
        data: inlineData.data,
        sampleRate: getPartMimeRate(mimeType),
      });
    }
  }

  if (content.interrupted) {
    sendJson(patientWs, { type: 'audio_interrupted' });
  }
}

async function handleToolCall(message, session, broadcast, storage, context) {
  const toolCall = message.toolCall ?? message.tool_call;
  const rawCalls = toolCall?.functionCalls ?? toolCall?.function_calls ?? [];
  const functionCalls = rawCalls.map((call) => ({
    id: call.id,
    name: call.name,
    args: call.args ?? call.arguments ?? {},
  }));

  if (!functionCalls.length) {
    return;
  }

  const functionResponses = await Promise.all(
    functionCalls.map(async (call) => {
      try {
        const response = await dispatchFunctionCall(
          call.name,
          call.args || {},
          broadcast,
          storage,
          context,
          userContext,
        );

        return {
          id: call.id,
          name: call.name,
          response,
        };
      } catch (error) {
        return {
          id: call.id,
          name: call.name,
          response: {
            success: false,
            error: error.message,
          },
        };
      }
    }),
  );

  session.sendToolResponse({ functionResponses });
}

export async function createGeminiSession({
  patientWs,
  broadcast,
  storage = defaultStorage,
  mode = 'clinic',
  languagePreference = 'auto',
  userContext = null,
}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required to create a Gemini Live session.');
  }

  if (!isValidMode(mode)) {
    throw new Error(`Unsupported intake mode: ${mode}`);
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  let session;
  session = await ai.live.connect({
    model: MODEL,
    config: {
      responseModalities: ['AUDIO'],
      /* Prefer minimal latency; Gemini 3.1 Live documents LOW for light reasoning. */
      thinkingConfig: { thinkingLevel: 'MINIMAL' },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Aoede',
          },
        },
      },
      systemInstruction: buildSystemInstruction(mode, languagePreference),
      tools: [{ functionDeclarations }],
    },
    callbacks: {
      onopen: () => {
        sendJson(patientWs, { type: 'session', status: 'connected', mode });
      },
      onmessage: async (message) => {
        forwardServerContent(message, patientWs);
        await handleToolCall(message, session, broadcast, storage, { mode });
      },
      onerror: (error) => {
        sendJson(patientWs, {
          type: 'session',
          status: 'error',
          message: error.message || 'Gemini Live session error',
        });
      },
      onclose: () => {
        sendJson(patientWs, { type: 'session', status: 'closed' });
      },
    },
  });

  /* Gemini 3.1 Flash Live: incremental user content during the session should use
     sendRealtimeInput, not sendClientContent (unless seeding history explicitly). */
  session.sendRealtimeInput({ text: 'Hello.' });

  return {
    sendAudio(base64Pcm) {
      session.sendRealtimeInput({
        audio: {
          data: base64Pcm,
          mimeType: 'audio/pcm;rate=16000',
        },
      });
    },
    sendVideo(base64Jpeg) {
      session.sendRealtimeInput({
        video: {
          data: base64Jpeg,
          mimeType: 'image/jpeg',
        },
      });
    },
    sendText(text) {
      session.sendRealtimeInput({ text });
    },
    close() {
      session.close();
    },
  };
}

export { MODEL, functionDeclarations };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`Gemini session module ready for ${MODEL}`);
  console.log(`Registered functions: ${functionDeclarations.map((fn) => fn.name).join(', ')}`);
}
