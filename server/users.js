import mongoose from 'mongoose';
import { connectDatabase } from './storage.js';

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, default: '' },
    name: { type: String, default: '' },
    language: { type: String, default: 'auto' },
    intakeCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'patients', versionKey: false },
);

export const Patient = mongoose.models.Patient || mongoose.model('Patient', userSchema);

function toClient(doc) {
  if (!doc) return null;
  const r = doc.toObject ? doc.toObject() : doc;
  const { _id, ...rest } = r;
  return rest;
}

async function nextUserId() {
  const count = await Patient.countDocuments();
  return `CC-${String(count + 1).padStart(4, '0')}`;
}

export async function createUser({ email, phone, name, language }) {
  await connectDatabase();
  const existing = await Patient.findOne({ email }).lean();
  if (existing) return { user: toClient(existing), isNew: false };

  const userId = await nextUserId();
  const doc = await Patient.create({ userId, email, phone: phone || '', name: name || '', language: language || 'auto' });
  return { user: toClient(doc), isNew: true };
}

export async function lookupUser(userId) {
  await connectDatabase();
  const doc = await Patient.findOne({ userId }).lean();
  return toClient(doc);
}

export async function incrementIntakeCount(userId) {
  await connectDatabase();
  await Patient.updateOne({ userId }, { $inc: { intakeCount: 1 } });
}
