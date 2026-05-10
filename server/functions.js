import crypto from 'node:crypto';
import { generateIntakeCard } from './claude.js';
import * as defaultStorage from './storage.js';
import * as appointmentsStorage from './appointments.js';
import * as doctorStorage from './doctors.js';
import * as facilityStorage from './facilities.js';
import { sendAppointmentConfirmation } from './email.js';
import { matchResourcesWithBackboard, enrichIntakeWithBackboard, loadCuratedResourceGuide } from './backboardMatch.js';

function parseJsonish(value, fallback) {
  if (Array.isArray(value) || (value && typeof value === 'object')) {
    return value;
  }
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// Approximate centroids for Yolo County area cities
const CITY_COORDS = {
  davis: { lat: 38.5449, lng: -121.7405 },
  woodland: { lat: 38.6785, lng: -121.7733 },
  'west sacramento': { lat: 38.5783, lng: -121.5316 },
  sacramento: { lat: 38.5816, lng: -121.4944 },
  winters: { lat: 38.5252, lng: -121.9727 },
  dixon: { lat: 38.4455, lng: -121.8232 },
  vacaville: { lat: 38.3566, lng: -121.9877 },
  'yolo county': { lat: 38.6785, lng: -121.7733 },
};

function getPatientCoords(city) {
  if (!city) return null;
  const key = city.toLowerCase().trim();
  // Try exact match first, then prefix match
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  const match = Object.entries(CITY_COORDS).find(([k]) => key.includes(k) || k.includes(key));
  return match ? match[1] : null;
}

export async function tag_urgency(args, broadcast, context = {}) {
  broadcast({
    type: 'URGENCY_ALERT',
    mode: args.mode || context.mode || 'clinic',
    ...args,
  });
  return { success: true };
}

export async function finalize_intake(args, broadcast, storage = defaultStorage, context = {}) {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const structuredFields = parseJsonish(args.structured_fields, {});
  const resourceMatches = parseJsonish(args.resource_matches, []);
  const mode = args.mode || context.mode || 'clinic';
  const card = await generateIntakeCard({
    ...args,
    mode,
    structured_fields: structuredFields,
    resource_matches: resourceMatches,
    id,
    timestamp,
    status: 'new',
  });

  const storedCard = await storage.save({
    ...card,
    id,
    mode,
    language: card.language || args.language || structuredFields.language || 'Unknown',
    structured_fields: card.structured_fields || structuredFields,
    resource_matches: card.resource_matches || resourceMatches,
    red_flags: card.red_flags || args.red_flags || [],
    transcript: args.transcript || '',
    timestamp,
    status: card.status || 'new',
  });

  broadcast({ type: 'NEW_INTAKE', card: storedCard });

  if (process.env.BACKBOARD_API_KEY) {
    enrichIntakeWithBackboard(storedCard, args, broadcast, storage).catch((e) =>
      console.warn('[Backboard] resource enrichment failed:', e.message),
    );
  }

  return { success: true, id: storedCard.id };
}

const FALLBACK_RESOURCES = {
  clinic: [
    { name: 'Davis Community Clinic', address: '2051 John Jones Rd, Davis, CA', phone: '(530) 758-2060', hours: 'Mon-Fri 8 AM-5 PM', type: 'clinic' },
    { name: 'CommuniCare Health Centers', address: '215 W Beamer St, Woodland, CA', phone: '(530) 668-2600', hours: 'Mon-Fri 8 AM-6 PM', type: 'clinic' },
  ],
  shelter: [
    { name: 'Fourth and Hope', address: '1901 E Beamer St, Woodland, CA', phone: '(530) 661-1218', hours: 'Daily intake by phone', type: 'shelter' },
    { name: 'Empower Yolo', address: '175 Walnut St, Woodland, CA', phone: '(530) 661-6333', hours: '24/7 crisis line', type: 'shelter' },
  ],
  food: [
    { name: 'Yolo Food Bank', address: '233 Harter Ave, Woodland, CA', phone: '(530) 668-0690', hours: 'Distribution times vary', type: 'food' },
    { name: 'Davis Community Meals and Housing', address: '1111 H St, Davis, CA', phone: '(530) 756-4008', hours: 'Meal programs vary', type: 'food' },
  ],
  pharmacy: [
    { name: 'Rite Aid Pharmacy', address: 'Near Davis, CA', phone: '(530) 753-9810', hours: 'Mon-Fri 9 AM-9 PM', type: 'pharmacy' },
    { name: 'CVS Pharmacy', address: 'Near Davis, CA', phone: '(530) 758-8226', hours: 'Daily 8 AM-10 PM', type: 'pharmacy' },
  ],
  interpreter: [
    { name: 'Yolo County Language Access Line', address: 'Remote support near Davis, CA', phone: '(530) 555-0147', hours: 'Mon-Fri 8 AM-6 PM', type: 'interpreter' },
    { name: 'Community Interpreter Network', address: 'Phone and video support', phone: '(530) 555-0190', hours: 'By appointment', type: 'interpreter' },
  ],
  emergency_line: [
    { name: 'Emergency Services', address: 'Call 911 for immediate life-threatening danger', phone: '911', hours: '24/7', type: 'emergency_line' },
    { name: '988 Suicide and Crisis Lifeline', address: 'Phone, text, and chat support', phone: '988', hours: '24/7', type: 'emergency_line' },
  ],
  housing: [
    { name: 'UC Davis Student Housing', address: 'UC Davis campus, Davis, CA', phone: '(530) 752-2033', hours: 'Mon-Fri 8 AM-5 PM', type: 'housing', url: 'housing.ucdavis.edu' },
    { name: 'UC Davis Off-Campus Housing Portal', address: 'Online resource', phone: '(530) 752-2033', hours: 'Online 24/7', type: 'housing', url: 'housing.ucdavis.edu/off-campus' },
    { name: 'UC Davis Dean of Students — Basic Needs', address: 'South Hall, UC Davis, Davis, CA', phone: '(530) 752-4633', hours: 'Mon-Fri 8 AM-5 PM', type: 'housing' },
    { name: 'Yolo County Housing Authority (Section 8)', address: '147 W Main St, Woodland, CA', phone: '(530) 662-5428', hours: 'Mon-Fri 8 AM-5 PM', type: 'housing' },
    { name: 'Legal Services of Northern California — Tenant Rights', address: '515 12th St, Sacramento, CA', phone: '(530) 662-1065', hours: 'Mon-Fri 9 AM-5 PM', type: 'housing' },
  ],
  insurance_help: [
    { name: 'Medi-Cal Enrollment (Yolo County HHS)', address: '137 N Cottonwood St, Woodland, CA', phone: '(530) 661-2750', hours: 'Mon-Fri 8 AM-5 PM', type: 'insurance_help' },
    { name: 'Covered California', address: 'Online or in-person at CommuniCare', phone: '1-800-300-1506', hours: 'Mon-Fri 8 AM-6 PM', type: 'insurance_help' },
    { name: 'CommuniCare — Enrollment Assister', address: '215 W Beamer St, Woodland, CA', phone: '(530) 668-2600', hours: 'Mon-Fri 8 AM-6 PM', type: 'insurance_help' },
  ],
};

const CATEGORY_TO_MODE = {
  clinic: 'clinic', shelter: 'shelter', housing: 'shelter', food: 'food_aid', food_aid: 'food_aid',
  pharmacy: 'clinic', interpreter: 'clinic', emergency_line: 'clinic', insurance_help: 'clinic',
};

export async function lookup_resources(args) {
  if (process.env.BACKBOARD_API_KEY) {
    try {
      const { matches, escalation_note } = await Promise.race([
        (async () => {
          const guide = await loadCuratedResourceGuide();
          return matchResourcesWithBackboard(
            {
              mode: CATEGORY_TO_MODE[args.category] || 'clinic',
              needs: [args.category || 'general support'],
              location: args.city ? `${args.city}, CA` : 'Davis / Yolo County, CA',
            },
            { curatedContext: guide, preferAssistantRag: false },
          );
        })(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Backboard timeout after 7s')), 7000),
        ),
      ]);
      return {
        resources: matches.map((m) => ({
          name: m.name, address: m.address || '', phone: m.phone || '',
          type: m.type, why: m.why || '', nextStep: m.nextStep || '',
        })),
        escalation_note: escalation_note || null,
        category: args.category,
      };
    } catch (e) {
      console.warn('[Backboard] lookup_resources failed, using fallback:', e.message);
    }
  }
  return {
    resources: FALLBACK_RESOURCES[args.category] || FALLBACK_RESOURCES.clinic,
    category: args.category,
  };
}

export async function get_available_slots(args) {
  const coords = getPatientCoords(args.patient_city);
  const slots = await doctorStorage.getAvailableSlots(
    args.specialization || null,
    coords?.lat ?? null,
    coords?.lng ?? null,
  );

  if (!slots.length) {
    return { available: false, message: 'No available slots found for this specialization right now. Please ask staff to add availability.' };
  }

  const formatted = slots.slice(0, 5).map((s) => ({
    slot_id: s.id,
    doctor_name: s.doctor?.name || 'Unknown',
    specialization: s.doctor?.specialization || '',
    location: s.doctor?.location || '',
    facility_name: s.facility?.name || s.doctor?.facility_name || '',
    facility_city: s.facility?.city || '',
    facility_address: s.facility ? `${s.facility.address}, ${s.facility.city}, CA` : '',
    distance_km: coords && s.facility
      ? Math.round(facilityStorage.haversineKm(coords.lat, coords.lng, s.facility.lat, s.facility.lng) * 10) / 10
      : null,
    date: s.date,
    time: s.time,
  }));

  return { available: true, slots: formatted };
}

export async function find_nearest_facility(args) {
  const { type, patient_city } = args;
  const coords = getPatientCoords(patient_city);

  if (!coords) {
    const facilities = await facilityStorage.getAllFacilities();
    const filtered = type ? facilities.filter((f) => f.type === type) : facilities;
    return {
      facilities: filtered.slice(0, 3).map((f) => ({
        name: f.name, type: f.type, address: `${f.address}, ${f.city}, CA`,
        phone: f.phone, hours: f.hours, distance_label: 'Distance unknown',
      })),
      note: 'Could not determine your location. Here are available options in the area.',
    };
  }

  const nearest = await facilityStorage.getNearestFacilities(coords.lat, coords.lng, type || null, 3);
  return {
    facilities: nearest.map((f) => {
      const km = Math.round(f.distanceKm * 10) / 10;
      const miles = Math.round(f.distanceKm * 0.621371 * 10) / 10;
      return {
        name: f.name, type: f.type,
        address: `${f.address}, ${f.city}, CA`,
        phone: f.phone, hours: f.hours,
        distance_km: km,
        distance_label: `${miles} mi away`,
      };
    }),
    patient_city: patient_city || 'Unknown',
  };
}

export async function book_appointment(args, broadcast, userContext = null) {
  const { slot_id, patient_name, reason, urgency, notes, intake_id } = args;
  const id = crypto.randomUUID();
  const bookedSlot = await doctorStorage.bookSlot(slot_id, id);
  if (!bookedSlot) {
    return { success: false, message: 'That slot was just taken. Please choose another.' };
  }
  const doctors = await doctorStorage.getAllDoctors();
  const doctor = doctors.find((d) => d.id === bookedSlot.doctor_id);
  const facility = doctor?.facility_id ? await facilityStorage.getFacilityById(doctor.facility_id) : null;

  const appointment = await appointmentsStorage.saveAppointment({
    id,
    patient_name: patient_name || userContext?.name || 'Unknown',
    doctor_id: bookedSlot.doctor_id,
    doctor_name: doctor?.name || '',
    specialization: doctor?.specialization || '',
    location: doctor?.location || '',
    facility_id: facility?.id || doctor?.facility_id || '',
    facility_name: facility?.name || doctor?.facility_name || '',
    slot_id,
    slot_date: bookedSlot.date,
    slot_time: bookedSlot.time,
    urgency: urgency || 'LOW',
    reason: reason || '',
    notes: notes || '',
    intake_id: intake_id || '',
    source: 'bot',
    status: 'confirmed',
    timestamp: new Date().toISOString(),
  });

  broadcast({ type: 'NEW_APPOINTMENT', appointment });
  broadcast({ type: 'SLOT_BOOKED', slot_id, doctor_id: bookedSlot.doctor_id });

  if (userContext?.email) {
    sendAppointmentConfirmation({
      to: userContext.email,
      userId: userContext.userId,
      name: userContext.name,
      appointment,
    }).catch((e) => console.warn('[Email] appt confirmation failed:', e.message));
  }

  const locationStr = facility
    ? `${facility.name}, ${facility.address}, ${facility.city}`
    : doctor?.location || '';

  return {
    success: true,
    message: `Appointment confirmed with ${doctor?.name || 'the doctor'} on ${bookedSlot.date} at ${bookedSlot.time}${locationStr ? ` at ${locationStr}` : ''}.`,
  };
}

export const handlers = {
  tag_urgency,
  finalize_intake,
  lookup_resources,
  get_available_slots,
  find_nearest_facility,
  book_appointment,
};

export async function dispatchFunctionCall(name, args, broadcast, storage = defaultStorage, context = {}, userContext = null) {
  const handler = handlers[name];
  if (!handler) return { success: false, error: `Unknown function: ${name}` };

  if (name === 'finalize_intake') return handler(args, broadcast, storage, context);
  if (name === 'tag_urgency') return handler(args, broadcast, context);
  if (name === 'book_appointment') return handler(args, broadcast, userContext);
  return handler(args);
}
