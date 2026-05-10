import crypto from 'node:crypto';
import mongoose from 'mongoose';

const intakeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    mode: { type: String, enum: ['clinic', 'shelter', 'food_aid'], default: 'clinic', index: true },
    status: { type: String, default: 'new', index: true },
    language: { type: String, default: 'Unknown' },
    patient: { type: mongoose.Schema.Types.Mixed, default: {} },
    visit: { type: mongoose.Schema.Types.Mixed, default: {} },
    urgency: { type: mongoose.Schema.Types.Mixed, default: {} },
    structured_fields: { type: mongoose.Schema.Types.Mixed, default: {} },
    transcript: { type: String, default: '' },
    transcript_summary: { type: String, default: '' },
    english_summary: { type: String, default: '' },
    recommended_next_step: { type: String, default: '' },
    accessibility: { type: String, default: '' },
    accessibility_needs: { type: [String], default: [] },
    support_contact: { type: mongoose.Schema.Types.Mixed, default: null },
    insurance: { type: String, default: '' },
    resource_matches: { type: [mongoose.Schema.Types.Mixed], default: [] },
    resources: { type: [mongoose.Schema.Types.Mixed], default: [] },
    red_flags: { type: [String], default: [] },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    collection: 'intakes',
    versionKey: false,
  },
);

export const Intake = mongoose.models.Intake || mongoose.model('Intake', intakeSchema);
let nextConnectionRetryAt = 0;
let lastConnectionError = '';

function normalizeRecord(record) {
  const normalized = {
    ...record,
    id: record.id || crypto.randomUUID(),
    timestamp: record.timestamp ? new Date(record.timestamp) : new Date(),
    status: record.status || 'new',
    mode: record.mode || 'clinic',
  };

  normalized.language =
    normalized.language || normalized.patient?.language || normalized.structured_fields?.language || 'Unknown';
  normalized.recommended_next_step =
    normalized.recommended_next_step || normalized.urgency?.suggested_next_step || '';
  normalized.resource_matches = normalized.resource_matches || normalized.resources || [];

  return normalized;
}

function toClientRecord(document) {
  if (!document) {
    return null;
  }

  const record = document.toObject ? document.toObject() : document;
  const { _id, ...rest } = record;

  return {
    ...rest,
    _id: _id?.toString?.() || _id,
    timestamp: rest.timestamp instanceof Date ? rest.timestamp.toISOString() : rest.timestamp,
  };
}

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required for CowmunityCare MongoDB storage.');
  }

  if (Date.now() < nextConnectionRetryAt) {
    throw new Error(lastConnectionError || 'MongoDB is temporarily unavailable.');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500,
    });
    lastConnectionError = '';
  } catch (error) {
    lastConnectionError = error.message;
    nextConnectionRetryAt = Date.now() + 10000;
    throw error;
  }

  return mongoose.connection;
}

export function getDatabaseStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return states[mongoose.connection.readyState] || 'unknown';
}

export async function save(record) {
  await connectDatabase();
  const normalized = normalizeRecord(record);
  const document = await Intake.findOneAndUpdate(
    { id: normalized.id },
    { $set: normalized },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return toClientRecord(document);
}

export async function getAll() {
  await connectDatabase();
  const records = await Intake.find({}).sort({ timestamp: -1 }).lean();

  return records.map(toClientRecord);
}

export async function getById(id) {
  await connectDatabase();
  const record = await Intake.findOne({ id }).lean();

  return toClientRecord(record);
}

export async function updateStatus(id, status) {
  await connectDatabase();
  const updated = await Intake.findOneAndUpdate(
    { id },
    { $set: { status } },
    { new: true },
  ).lean();

  return toClientRecord(updated);
}

export async function updateIntake(id, fields) {
  await connectDatabase();
  const updated = await Intake.findOneAndUpdate(
    { id },
    { $set: fields },
    { new: true },
  ).lean();

  return toClientRecord(updated);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await connectDatabase();
  const record = await save({
    status: 'new',
    mode: 'clinic',
    patient: { name: 'Demo Patient', language: 'Spanish', interpreter_needed: true },
    structured_fields: { reason_for_visit: 'Demo visit' },
  });

  console.log('Saved record:', record);
  console.log('All records:', await getAll());
  console.log('Reviewed record:', await updateStatus(record.id, 'reviewed'));
  await mongoose.disconnect();
}
