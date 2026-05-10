import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectDatabase } from './storage.js';

const facilitySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['hospital', 'free_clinic', 'urgent_care', 'shelter', 'food_bank', 'pharmacy'],
      required: true,
    },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    zip: { type: String, default: '' },
    phone: { type: String, default: '' },
    hours: { type: String, default: '' },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
  },
  { collection: 'facilities', versionKey: false },
);

export const Facility = mongoose.models.Facility || mongoose.model('Facility', facilitySchema);

function toClient(doc) {
  if (!doc) return null;
  const r = doc.toObject ? doc.toObject() : doc;
  const { _id, ...rest } = r;
  return rest;
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SEED_FACILITIES = [
  {
    name: 'Sutter Davis Hospital',
    type: 'hospital',
    address: '2000 Sycamore Lane',
    city: 'Davis',
    zip: '95616',
    phone: '(530) 756-6440',
    hours: 'ER: 24/7 · Clinics: Mon-Fri 8 AM-5 PM',
    lat: 38.5447,
    lng: -121.7536,
  },
  {
    name: 'Davis Community Clinic',
    type: 'free_clinic',
    address: '2051 John Jones Rd',
    city: 'Davis',
    zip: '95616',
    phone: '(530) 758-2060',
    hours: 'Mon-Fri 8 AM-5 PM',
    lat: 38.5474,
    lng: -121.756,
  },
  {
    name: 'CommuniCare Health Centers',
    type: 'free_clinic',
    address: '215 W Beamer St',
    city: 'Woodland',
    zip: '95695',
    phone: '(530) 668-2600',
    hours: 'Mon-Fri 8 AM-6 PM',
    lat: 38.6743,
    lng: -121.7736,
  },
  {
    name: 'Woodland Memorial Hospital',
    type: 'hospital',
    address: '1325 Cottonwood St',
    city: 'Woodland',
    zip: '95695',
    phone: '(530) 662-3961',
    hours: 'ER: 24/7 · Clinics: Mon-Fri 8 AM-5 PM',
    lat: 38.6793,
    lng: -121.7776,
  },
  {
    name: 'UC Davis Medical Center',
    type: 'hospital',
    address: '2315 Stockton Blvd',
    city: 'Sacramento',
    zip: '95817',
    phone: '(916) 734-2011',
    hours: 'ER: 24/7',
    lat: 38.5495,
    lng: -121.4564,
  },
  {
    name: 'Fourth and Hope',
    type: 'shelter',
    address: '1901 E Beamer St',
    city: 'Woodland',
    zip: '95776',
    phone: '(530) 661-1218',
    hours: 'Daily intake by phone',
    lat: 38.668,
    lng: -121.7506,
  },
  {
    name: 'Yolo Food Bank',
    type: 'food_bank',
    address: '233 Harter Ave',
    city: 'Woodland',
    zip: '95776',
    phone: '(530) 668-0690',
    hours: 'Distribution times vary — call ahead',
    lat: 38.6678,
    lng: -121.7756,
  },
];

export async function seedIfEmpty() {
  await connectDatabase();
  await Facility.deleteMany({});
  const facilities = SEED_FACILITIES.map((f) => ({ ...f, id: crypto.randomUUID() }));
  await Facility.insertMany(facilities);
  return facilities;
}

export async function getAllFacilities() {
  await connectDatabase();
  return (await Facility.find({}).lean()).map(toClient);
}

export async function getFacilityById(id) {
  await connectDatabase();
  return toClient(await Facility.findOne({ id }).lean());
}

export async function saveFacility(data) {
  await connectDatabase();
  const doc = await Facility.create({ ...data, id: data.id || crypto.randomUUID() });
  return toClient(doc);
}

export async function getNearestFacilities(patientLat, patientLng, type = null, limit = 3) {
  await connectDatabase();
  const query = type ? { type } : {};
  const facilities = (await Facility.find(query).lean()).map(toClient);
  return facilities
    .map((f) => ({ ...f, distanceKm: haversineKm(patientLat, patientLng, f.lat, f.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}
