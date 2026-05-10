import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectDatabase } from './storage.js';

const appointmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    patient_name: { type: String, default: 'Unknown' },
    doctor_id: { type: String, default: '' },
    doctor_name: { type: String, default: '' },
    specialization: { type: String, default: '' },
    slot_id: { type: String, default: '' },
    slot_date: { type: String, default: '' },
    slot_time: { type: String, default: '' },
    urgency: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'LOW' },
    reason: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'confirmed' },
    source: { type: String, enum: ['bot', 'staff'], default: 'staff' },
    intake_id: { type: String, default: '' },
    location: { type: String, default: '' },
    facility_id: { type: String, default: '' },
    facility_name: { type: String, default: '' },
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

export async function seedIfEmpty() {
  await connectDatabase();
  // Remove any documents from the old schema (had appointment_type / suggested_time fields)
  await Appointment.deleteMany({ $or: [{ appointment_type: { $exists: true } }, { suggested_time: { $exists: true } }] });
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
