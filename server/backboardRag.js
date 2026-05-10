import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';
import { BackboardClient } from 'backboard-sdk';

const serverDir = path.dirname(fileURLToPath(import.meta.url));

/** Path to the markdown resource guide uploaded for RAG. */
export const RESOURCE_GUIDE_PATH = path.join(serverDir, 'data', 'yolo_resources.md');
export const RESOURCE_GUIDE_BASENAME = 'yolo_resources.md';

export function createBackboardClient() {
  const apiKey = process.env.BACKBOARD_API_KEY;
  if (!apiKey) {
    throw new Error('BACKBOARD_API_KEY is required');
  }
  return new BackboardClient({
    apiKey,
    baseUrl: process.env.BACKBOARD_BASE_URL,
    timeout: Number(process.env.BACKBOARD_TIMEOUT_MS) || 120_000,
  });
}

/**
 * Block until a document is indexed (or error). Default ~2 min max wait.
 */
export async function pollUntilDocumentIndexed(client, documentId, options = {}) {
  const maxAttempts = options.maxAttempts ?? 60;
  const delayMs = options.delayMs ?? 2000;

  for (let i = 0; i < maxAttempts; i += 1) {
    const doc = await client.getDocumentStatus(documentId);
    if (doc.status === 'indexed') {
      return doc;
    }
    if (doc.status === 'error' || doc.status === 'failed') {
      throw new Error(doc.statusMessage || `Document ${documentId} failed to index`);
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }

  throw new Error(`Timed out waiting for document ${documentId} to index`);
}

function guideDocMatches(doc) {
  const name = doc.filename || '';
  return (
    name === RESOURCE_GUIDE_BASENAME ||
    name.endsWith(`/${RESOURCE_GUIDE_BASENAME}`) ||
    name.includes('yolo_resources')
  );
}

/**
 * Ensure the CowmunityCare resource guide is uploaded and indexed on the assistant.
 * Skips upload if an indexed copy already exists (unless force).
 *
 * @param {string} assistantId
 * @param {{ force?: boolean }} [options]
 */
export async function syncResourceGuideToAssistant(assistantId, options = {}) {
  const { force = false } = options;
  const client = createBackboardClient();

  await access(RESOURCE_GUIDE_PATH);

  const docs = await client.listAssistantDocuments(assistantId);
  const existing = docs.find((d) => guideDocMatches(d));

  if (!force && existing) {
    if (existing.status === 'indexed') {
      return { action: 'skipped', document: existing };
    }
    if (existing.status !== 'error' && existing.status !== 'failed') {
      const indexed = await pollUntilDocumentIndexed(client, existing.documentId);
      return { action: 'waited', document: indexed };
    }
  }

  if (force && existing) {
    await client.deleteDocument(existing.documentId);
  }

  const uploaded = await client.uploadDocumentToAssistant(assistantId, RESOURCE_GUIDE_PATH);
  const indexed = await pollUntilDocumentIndexed(client, uploaded.documentId);

  return { action: 'uploaded', document: indexed };
}
