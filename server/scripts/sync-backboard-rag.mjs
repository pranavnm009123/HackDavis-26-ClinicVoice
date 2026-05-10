#!/usr/bin/env node
/**
 * One-time / CI: create a Backboard assistant (optional), upload server/data/yolo_resources.md,
 * and wait until it is indexed for RAG. Prints env vars to add to .env.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  createBackboardClient,
  syncResourceGuideToAssistant,
  RESOURCE_GUIDE_PATH,
} from '../backboardRag.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.join(scriptDir, '..');
const repoRoot = path.join(serverDir, '..');

dotenv.config({ path: path.join(repoRoot, '.env') });
dotenv.config({ path: path.join(serverDir, '.env') });

const argv = new Set(process.argv.slice(2));
const createAssistant = argv.has('--create-assistant');
const force = argv.has('--force');

async function main() {
  if (!process.env.BACKBOARD_API_KEY) {
    console.error('Missing BACKBOARD_API_KEY in .env');
    process.exitCode = 1;
    return;
  }

  const client = createBackboardClient();
  let assistantId = process.env.BACKBOARD_ASSISTANT_ID;

  if (createAssistant || !assistantId) {
    const assistant = await client.createAssistant({
      name: 'VoiceBridge Resource Intelligence',
      description: 'RAG-backed nonprofit resource matching for VoiceBridge intakes.',
      system_prompt:
        'You are VoiceBridge resource intelligence. Ground recommendations in documents attached to this assistant (nonprofit resource guides). When asked for JSON, respond with only valid JSON — no markdown fences. Never diagnose medical conditions; focus on connecting people to appropriate services and crisis lines when needed.',
    });
    assistantId = assistant.assistantId;
    console.log('\nCreated assistant. Add to your .env:\n');
    console.log(`BACKBOARD_ASSISTANT_ID=${assistantId}\n`);
  }

  console.log(`Syncing ${RESOURCE_GUIDE_PATH} → assistant ${assistantId} ...`);
  const result = await syncResourceGuideToAssistant(assistantId, { force });
  console.log('Result:', result.action, result.document?.status || '');
  if (result.document?.chunkCount != null) {
    console.log('Chunks:', result.document.chunkCount, 'tokens:', result.document.totalTokens ?? 'n/a');
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
