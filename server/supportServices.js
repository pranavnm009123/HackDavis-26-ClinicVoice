import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectDatabase } from './storage.js';
import { getFacilityById, getAllFacilities, accessScore } from './facilities.js';

const BARRIER_TYPES = ['wheelchair', 'elevator', 'ramp', 'bathroom', 'interpreter', 'language', 'transport', 'forms', 'location', 'other'];

const barrierSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    facility_id: { type: String, index: true },
    facility_name: { type: String, default: '' },
    barrier_type: { type: String, enum: BARRIER_TYPES, required: true },
    notes: { type: String, default: '' },
    reported_by: { type: String, default: 'anonymous' },
    timestamp: { type: Date, default: Date.now, index: true },
    status: { type: String, default: 'open' },
  },
  { collection: 'barriers', versionKey: false },
);

const BarrierReport = mongoose.models.BarrierReport || mongoose.model('BarrierReport', barrierSchema);

function toClient(doc) {
  if (!doc) return null;
  const r = doc.toObject ? doc.toObject() : doc;
  const { _id, ...rest } = r;
  return rest;
}

export async function listBarriers(facilityId = null) {
  await connectDatabase();
  const query = facilityId ? { facility_id: facilityId } : {};
  return (await BarrierReport.find(query).sort({ timestamp: -1 }).lean()).map(toClient);
}

export async function createBarrier(data) {
  await connectDatabase();
  const doc = await BarrierReport.create({ ...data, id: crypto.randomUUID() });
  return toClient(doc);
}

export function accessScoreBreakdown(facility) {
  return {
    score: accessScore(facility),
    breakdown: {
      mobility: facility.wheelchair_accessible,
      language: (facility.languages_supported?.length ?? 0) > 1,
      interpreter: facility.has_interpreter,
      transport: facility.transport_nearby,
      forms: facility.forms_assistance,
    },
    known_barriers: facility.known_barriers ?? [],
  };
}

const NEED_KEYS = {
  wheelchair: 'mobility',
  wheelchair_accessible: 'mobility',
  mobility: 'mobility',
  ramp: 'mobility',
  elevator: 'mobility',
  spanish: 'language',
  interpreter: 'interpreter',
  language: 'language',
  multilingual: 'language',
  transport: 'transport',
  bus: 'transport',
  transportation: 'transport',
  forms: 'forms',
  'form help': 'forms',
};

export function matchAccessibility(accessibilityNeeds, facility) {
  const needsRaw = Array.isArray(accessibilityNeeds)
    ? accessibilityNeeds
    : typeof accessibilityNeeds === 'string' && accessibilityNeeds !== 'Not collected'
      ? [accessibilityNeeds]
      : [];

  const dimensions = new Set();
  for (const need of needsRaw) {
    const lower = need.toLowerCase();
    for (const [keyword, dim] of Object.entries(NEED_KEYS)) {
      if (lower.includes(keyword)) dimensions.add(dim);
    }
  }

  const matched = [];
  const missing = [];

  if (dimensions.has('mobility')) {
    (facility.wheelchair_accessible ? matched : missing).push('Wheelchair access');
  }
  if (dimensions.has('language')) {
    ((facility.languages_supported?.length ?? 0) > 1 ? matched : missing).push('Multilingual support');
  }
  if (dimensions.has('interpreter')) {
    (facility.has_interpreter ? matched : missing).push('Interpreter available');
  }
  if (dimensions.has('transport')) {
    (facility.transport_nearby ? matched : missing).push('Transit nearby');
  }
  if (dimensions.has('forms')) {
    (facility.forms_assistance ? matched : missing).push('Forms assistance');
  }

  return { matched, missing };
}

export async function getAccessScoreForFacility(facilityId) {
  const facility = await getFacilityById(facilityId);
  if (!facility) return null;

  const barriers = await listBarriers(facilityId);
  const barrierTags = [...new Set(barriers.map((b) => b.barrier_type))];
  const result = accessScoreBreakdown(facility);
  result.known_barriers = [...new Set([...result.known_barriers, ...barrierTags])];
  result.facility = facility;
  return result;
}

export async function getFacilitiesWithScores() {
  const facilities = await getAllFacilities();
  return facilities.map((f) => ({
    ...f,
    ...accessScoreBreakdown(f),
  }));
}
