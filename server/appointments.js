import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectDatabase } from './storage.js';

const appointmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    patient_name: { type: String, default: 'Unknown' },
    appointment_type: {
      type: String,
      enum: ['nurse_triage', 'clinic_review', 'interpreter', 'social_worker', 'emergency_escalation'],
      default: 'clinic_review',
    },
    urgency: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'LOW' },
    reason: { type: String, default: '' },
    suggested_time: { type: String, default: 'This week' },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
    source: { type: String, enum: ['bot', 'staff'], default: 'staff' },
    intake_id: { type: String, default: '' },
    notes: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { collection: 'appointments', versionKey: false },
);

export const Appointment =
  mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

function toClient(doc) {
  if (!doc) return null;
  const r = doc.toObject ? doc.toObject() : doc;
  const { _id, ...rest } = r;
  return { ...rest, timestamp: rest.timestamp instanceof Date ? rest.timestamp.toISOString() : rest.timestamp };
}

const SEED = [
  {
    patient_name: 'Maria Garcia',
    appointment_type: 'nurse_triage',
    urgency: 'HIGH',
    reason: 'Persistent chest tightness for 3 days',
    suggested_time: 'Today',
    status: 'pending',
    source: 'bot',
    notes: 'Possible cardiac — do not delay',
  },
  {
    patient_name: 'James Okafor',
    appointment_type: 'clinic_review',
    urgency: 'MEDIUM',
    reason: 'Recurring headaches with dizziness',
    suggested_time: 'Within 48h',
    status: 'confirmed',
    source: 'bot',
    notes: '',
  },
  {
    patient_name: 'Lin Wei',
    appointment_type: 'interpreter',
    urgency: 'LOW',
    reason: 'Mandarin-speaking — needs interpreter for follow-up',
    suggested_time: 'This week',
    status: 'pending',
    source: 'staff',
    notes: 'Yolo County Language Access Line',
  },
  {
    patient_name: 'Sofia Reyes',
    appointment_type: 'social_worker',
    urgency: 'HIGH',
    reason: 'Unsafe home situation disclosed during intake',
    suggested_time: 'Today',
    status: 'confirmed',
    source: 'bot',
    notes: 'Safety planning required',
  },
  {
    patient_name: 'David Kim',
    appointment_type: 'clinic_review',
    urgency: 'LOW',
    reason: 'Routine hypertension follow-up',
    suggested_time: 'This week',
    status: 'completed',
    source: 'staff',
    notes: '',
  },
];

export async function seedIfEmpty() {
  await connectDatabase();
  const count = await Appointment.countDocuments();
  if (count > 0) return;
  const docs = SEED.map((s) => ({ ...s, id: crypto.randomUUID(), timestamp: new Date() }));
  await Appointment.insertMany(docs);
}

export async function getAll() {
  await connectDatabase();
  const docs = await Appointment.find({}).sort({ timestamp: -1 }).lean();
  return docs.map(toClient);
}

export async function saveAppointment(record) {
  await connectDatabase();
  const data = { ...record, id: record.id || crypto.randomUUID(), timestamp: record.timestamp || new Date() };
  const doc = await Appointment.findOneAndUpdate(
    { id: data.id },
    { $set: data },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return toClient(doc);
}

export async function updateAppointment(id, fields) {
  await connectDatabase();
  const doc = await Appointment.findOneAndUpdate({ id }, { $set: fields }, { new: true }).lean();
  return toClient(doc);
}
