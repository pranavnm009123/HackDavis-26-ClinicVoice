import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectDatabase } from './storage.js';
import { Facility } from './facilities.js';

const doctorSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    specialization: {
      type: String,
      enum: ['general_practice', 'cardiology', 'social_work', 'pediatrics', 'psychiatry', 'interpreter'],
      required: true,
    },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    facility_id: { type: String, default: '' },
    facility_name: { type: String, default: '' },
  },
  { collection: 'doctors', versionKey: false },
);

const slotSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    doctor_id: { type: String, required: true, index: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    booked: { type: Boolean, default: false },
    appointment_id: { type: String, default: '' },
  },
  { collection: 'slots', versionKey: false },
);

export const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema);
export const Slot = mongoose.models.Slot || mongoose.model('Slot', slotSchema);

function toClient(doc) {
  if (!doc) return null;
  const r = doc.toObject ? doc.toObject() : doc;
  const { _id, ...rest } = r;
  return rest;
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

const SEED_DOCTORS = [
  { name: 'Dr. Sarah Chen', specialization: 'general_practice', phone: '(530) 555-0101', location: 'Room 204', facility_name: 'Davis Community Clinic' },
  { name: 'Dr. Marcus Williams', specialization: 'cardiology', phone: '(530) 555-0102', location: 'Room 312', facility_name: 'Sutter Davis Hospital' },
  { name: 'Dr. Priya Patel', specialization: 'social_work', phone: '(530) 555-0103', location: 'Room 108', facility_name: 'Davis Community Clinic' },
  { name: 'Dr. James Lee', specialization: 'pediatrics', phone: '(530) 555-0104', location: 'Room 215', facility_name: 'CommuniCare Health Centers' },
  { name: 'Dr. Aisha Malik', specialization: 'psychiatry', phone: '(530) 555-0105', location: 'Room 310', facility_name: 'Sutter Davis Hospital' },
  { name: 'Maria Santos', specialization: 'interpreter', phone: '(530) 555-0106', location: 'Room 101', facility_name: 'Davis Community Clinic' },
];

const SLOT_TIMES = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '3:30 PM'];

export async function seedIfEmpty() {
  await connectDatabase();
  await Doctor.deleteMany({});
  await Slot.deleteMany({});

  const facilityDocs = await Facility.find({}).lean();
  const facilityByName = Object.fromEntries(facilityDocs.map((f) => [f.name, f]));

  const doctors = SEED_DOCTORS.map((d) => {
    const facility = facilityByName[d.facility_name];
    return { ...d, id: crypto.randomUUID(), facility_id: facility?.id || '', facility_name: d.facility_name };
  });
  await Doctor.insertMany(doctors);

  const slots = [];
  for (const doctor of doctors) {
    for (let dayOffset = 0; dayOffset <= 4; dayOffset++) {
      for (const time of SLOT_TIMES) {
        slots.push({ id: crypto.randomUUID(), doctor_id: doctor.id, date: daysFromNow(dayOffset), time, booked: false });
      }
    }
  }
  await Slot.insertMany(slots);
}

export async function getAllDoctors() {
  await connectDatabase();
  return (await Doctor.find({}).lean()).map(toClient);
}

export async function saveDoctor(data) {
  await connectDatabase();
  const doc = await Doctor.create({ ...data, id: data.id || crypto.randomUUID() });
  return toClient(doc);
}

export async function addSlot({ doctor_id, date, time }) {
  await connectDatabase();
  const doc = await Slot.create({ id: crypto.randomUUID(), doctor_id, date, time, booked: false });
  return toClient(doc);
}

export async function getAvailableSlots(specialization, patientLat = null, patientLng = null) {
  await connectDatabase();
  const query = specialization ? { specialization } : {};
  const doctors = await Doctor.find(query).lean();
  const doctorIds = doctors.map((d) => d.id);
  const today = daysFromNow(0);

  const slots = await Slot.find({ doctor_id: { $in: doctorIds }, booked: false, date: { $gte: today } })
    .sort({ date: 1, time: 1 })
    .limit(20)
    .lean();

  const doctorMap = Object.fromEntries(doctors.map((d) => [d.id, d]));

  const facilityIds = [...new Set(doctors.map((d) => d.facility_id).filter(Boolean))];
  const facilityDocs = facilityIds.length
    ? await Facility.find({ id: { $in: facilityIds } }).lean()
    : [];
  const facilityMap = Object.fromEntries(facilityDocs.map((f) => [f.id, f]));

  const enriched = slots.map((s) => {
    const doctor = toClient(doctorMap[s.doctor_id]);
    const facility = doctor?.facility_id ? toClient(facilityMap[doctor.facility_id]) : null;
    return { ...toClient(s), doctor, facility };
  });

  if (patientLat != null && patientLng != null) {
    const { haversineKm } = await import('./facilities.js');
    enriched.sort((a, b) => {
      const distA = a.facility ? haversineKm(patientLat, patientLng, a.facility.lat, a.facility.lng) : 9999;
      const distB = b.facility ? haversineKm(patientLat, patientLng, b.facility.lat, b.facility.lng) : 9999;
      if (Math.abs(distA - distB) > 1) return distA - distB;
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.time < b.time ? -1 : 1;
    });
  }

  return enriched;
}

export async function bookSlot(slotId, appointmentId) {
  await connectDatabase();
  const slot = await Slot.findOneAndUpdate(
    { id: slotId, booked: false },
    { $set: { booked: true, appointment_id: appointmentId } },
    { new: true },
  ).lean();
  return toClient(slot);
}

export async function getDoctorSlots(doctorId) {
  await connectDatabase();
  const slots = await Slot.find({ doctor_id: doctorId }).sort({ date: 1, time: 1 }).lean();
  return slots.map(toClient);
}
