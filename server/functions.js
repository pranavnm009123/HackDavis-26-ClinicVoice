import crypto from 'node:crypto';
import { generateIntakeCard } from './claude.js';
import * as defaultStorage from './storage.js';
import * as appointmentsStorage from './appointments.js';
import * as doctorStorage from './doctors.js';
import * as facilityStorage from './facilities.js';
import { sendAppointmentConfirmation, sendIntakeConfirmation, sendResourceEmail } from './email.js';
import { matchResourcesWithBackboard, enrichIntakeWithBackboard, loadCuratedResourceGuide } from './backboardMatch.js';
import { getFacilitiesWithScores, matchAccessibility } from './supportServices.js';

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

function withCollectedContact(structuredFields, userContext) {
  if (!userContext) return structuredFields;
  return {
    ...structuredFields,
    full_name: structuredFields.full_name || userContext.name || 'Not collected',
    contact_email: structuredFields.contact_email || userContext.email || 'Not collected',
    contact_phone: structuredFields.contact_phone || userContext.phone || 'Not collected',
  };
}

function dedupeResources(resources) {
  const seen = new Set();
  const output = [];
  for (const resource of resources) {
    const name = typeof resource === 'string' ? resource : resource?.name;
    if (!name) continue;
    const key = String(name).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(resource);
  }
  return output;
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

function getUrgencyLevel(card, args) {
  const rawLevel =
    card?.urgency?.level ||
    card?.urgency ||
    args?.urgency ||
    'LOW';
  const level = String(rawLevel).toUpperCase();
  return ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(level) ? level : 'LOW';
}

function getSpecialization(mode, urgency) {
  if (urgency === 'CRITICAL' || urgency === 'HIGH') return 'general_practice';
  if (mode === 'shelter') return 'social_work';
  return 'general_practice';
}

async function createFollowUpAppointment({
  args,
  card,
  storedCard,
  structuredFields,
  mode,
  broadcast,
  userContext,
}) {
  const urgency = getUrgencyLevel(card, args);
  const appointment = await appointmentsStorage.saveAppointment({
    id: `intake-${storedCard.id}`,
    intake_id: storedCard.id,
    patient_name:
      structuredFields.full_name ||
      card?.patient?.name ||
      userContext?.name ||
      'Unknown',
    specialization: getSpecialization(mode, urgency),
    urgency,
    reason:
      structuredFields.reason_for_visit ||
      structuredFields.bed_or_resource_need ||
      structuredFields.requested_supplies ||
      card?.visit?.reason ||
      args.english_summary ||
      args.transcript ||
      'Follow-up from CowmunityCare intake',
    source: 'bot',
    status: 'pending',
    notes: card?.recommended_next_step || args.recommended_next_step || '',
    timestamp: new Date().toISOString(),
  });

  broadcast({ type: 'NEW_APPOINTMENT', appointment });

  if (userContext?.email) {
    sendAppointmentConfirmation({
      to: userContext.email,
      userId: userContext.userId,
      name: userContext.name,
      appointment,
    }).catch((e) => console.warn('[Email] appt confirmation failed:', e.message));
  }

  return appointment;
}

export async function request_navigation(args, context = {}) {
  const ws = context.patientWs;
  if (!ws || ws.readyState !== 1) return { success: false, error: 'patient socket not open' };
  ws.send(
    JSON.stringify({
      type: 'NAVIGATE_REQUEST',
      query: args.destination_query || '',
      reason: args.reason || '',
    }),
  );
  return { success: true, opened: true };
}

export async function tag_urgency(args, broadcast, context = {}) {
  broadcast({
    type: 'URGENCY_ALERT',
    mode: args.mode || context.mode || 'clinic',
    ...args,
  });
  return { success: true };
}

export async function finalize_intake(args, broadcast, storage = defaultStorage, context = {}, userContext = null) {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const structuredFields = withCollectedContact(parseJsonish(args.structured_fields, {}), userContext);
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

  let emailCard = storedCard;
  if (process.env.BACKBOARD_API_KEY) {
    try {
      emailCard = await enrichIntakeWithBackboard(storedCard, args, broadcast, storage);
    } catch (e) {
      console.warn('[Backboard] resource enrichment failed:', e.message);
    }
  }

  if (!Array.isArray(emailCard?.resource_matches) || emailCard.resource_matches.length === 0) {
    const category = MODE_DEFAULT_RESOURCE_CATEGORY[mode] || 'clinic';
    const curated = await getCuratedResources(category);
    const fallback = curated.length ? curated.slice(0, 5) : FALLBACK_RESOURCES[category] || [];
    emailCard = { ...emailCard, resource_matches: fallback };
  }

  let appointment = null;
  if (context.languagePreference === 'sign_language') {
    try {
      appointment = await createFollowUpAppointment({
        args,
        card,
        storedCard,
        structuredFields,
        mode,
        broadcast,
        userContext,
      });
    } catch (error) {
      console.warn('[Appointments] auto follow-up failed:', error.message);
    }
  }

  const patientEmail = structuredFields.contact_email || userContext?.email;
  if (patientEmail && patientEmail !== 'Not collected') {
    sendIntakeConfirmation({
      to: patientEmail,
      name: structuredFields.full_name || card?.patient?.name || userContext?.name || '',
      card: emailCard || storedCard,
      mode,
      structuredFields,
      appointment,
    }).catch((e) => console.warn('[Email] Intake confirmation failed:', e.message));
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
  grocery_store: [
    { name: 'Nugget Markets', address: '1414 E Covell Blvd, Davis, CA', phone: '(530) 753-7000', hours: 'Daily 6 AM–11 PM', type: 'grocery_store' },
    { name: 'Safeway', address: '1431 W Covell Blvd, Davis, CA', phone: '(530) 758-6440', hours: 'Daily 24 hours', type: 'grocery_store' },
    { name: 'Target', address: '3900 Chiles Rd, Davis, CA', phone: '(530) 756-5900', hours: 'Daily 8 AM–10 PM', type: 'grocery_store' },
    { name: 'El Super (Woodland)', address: '180 W Main St, Woodland, CA', phone: '(530) 668-1600', hours: 'Daily 7 AM–10 PM', type: 'grocery_store' },
  ],
  insurance_help: [
    { name: 'Medi-Cal Enrollment (Yolo County HHS)', address: '137 N Cottonwood St, Woodland, CA', phone: '(530) 661-2750', hours: 'Mon-Fri 8 AM-5 PM', type: 'insurance_help' },
    { name: 'Covered California', address: 'Online or in-person at CommuniCare', phone: '1-800-300-1506', hours: 'Mon-Fri 8 AM-6 PM', type: 'insurance_help' },
    { name: 'CommuniCare — Enrollment Assister', address: '215 W Beamer St, Woodland, CA', phone: '(530) 668-2600', hours: 'Mon-Fri 8 AM-6 PM', type: 'insurance_help' },
  ],
};

const CATEGORY_TO_MODE = {
  clinic: 'clinic', shelter: 'shelter', housing: 'shelter', food: 'food_aid', food_aid: 'food_aid',
  grocery_store: 'food_aid', pharmacy: 'clinic', interpreter: 'clinic', emergency_line: 'clinic', insurance_help: 'clinic',
};

const MODE_DEFAULT_RESOURCE_CATEGORY = {
  clinic: 'clinic',
  shelter: 'housing',
  food_aid: 'food',
};

const HOUSING_STATIC = [
  {
    name: 'UC Davis Off-Campus Housing Portal',
    type: 'search_portal',
    url: 'https://housing.ucdavis.edu/off-campus',
    phone: '(530) 752-2033',
    description: 'Official UC Davis portal — rentals, sublets, and roommates near campus posted by local landlords. Filter by price, distance, and unit type.',
    price_range: 'Varies',
    distance: 'Online portal (all Davis distances)',
  },
  {
    name: 'West Village (UC Davis)',
    type: 'apartment_complex',
    url: 'https://westvillage.ucdavis.edu',
    phone: '(530) 756-7070',
    description: 'University-managed community on the west edge of campus; studios to 4BR townhomes. Designed for students and UC Davis affiliates.',
    price_range: '$1,500–$3,200/mo',
    distance: 'Adjacent to campus (west side)',
  },
  {
    name: 'Russell Park (UC Davis)',
    type: 'apartment_complex',
    url: 'https://housing.ucdavis.edu/apartments/russell-park/',
    phone: '(530) 752-2033',
    description: 'UC Davis apartment community near campus for students and families; availability runs through the housing application process.',
    price_range: 'Varies',
    distance: 'Near central campus',
  },
  {
    name: 'Orchard Park (UC Davis)',
    type: 'apartment_complex',
    url: 'https://housing.ucdavis.edu/apartments/orchard-park/',
    phone: '(530) 752-2033',
    description: 'UC Davis apartment community for students and student families; useful for graduate/family housing searches.',
    price_range: 'Varies',
    distance: 'UC Davis campus',
  },
  {
    name: 'Solano Park (UC Davis)',
    type: 'apartment_complex',
    url: 'https://housing.ucdavis.edu/apartments/solano-park/',
    phone: '(530) 752-2033',
    description: 'UC Davis apartment community often relevant for student family housing and campus-adjacent options.',
    price_range: 'Varies',
    distance: 'UC Davis campus',
  },
  {
    name: 'Craigslist Davis Apartments',
    type: 'search_portal',
    url: 'https://sacramento.craigslist.org/search/apa?postal=95616&search_distance=3',
    description: 'Live daily listings within 3 miles of Davis. Filter by price and bedrooms on the page.',
    price_range: 'Varies — filter on site',
    distance: 'Within 3 miles of 95616',
  },
  {
    name: 'Zillow Rentals — Davis, CA',
    type: 'search_portal',
    url: 'https://www.zillow.com/davis-ca/rentals/',
    description: 'Current rental listings in Davis with photos, floor plans, and online applications.',
    price_range: 'Varies',
    distance: 'Davis and surrounding area',
  },
];

function cleanMarkdownText(value) {
  return String(value || '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function firstUrl(value) {
  const text = cleanMarkdownText(value);
  const url = text.match(/https?:\/\/[^\s)]+|(?:[a-z0-9-]+\.)+(?:edu|org|gov|com|net)(?:\/[^\s)]*)?/i)?.[0] || '';
  return url.replace(/[.,;:]+$/, '');
}

function firstPhone(value) {
  return cleanMarkdownText(value).match(/\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}|(?:911|988)\b/)?.[0] || '';
}

function categoryMatchesResource(category, resource) {
  const type = String(resource.type || '').toLowerCase();
  const haystack = `${resource.name} ${resource.description} ${resource.nextStep}`.toLowerCase();
  if (category === 'housing') return type.includes('housing') || haystack.includes('housing') || haystack.includes('rental');
  if (category === 'shelter') return type.includes('shelter') || type.includes('crisis');
  if (category === 'food') return type.includes('food');
  if (category === 'grocery_store') return type.includes('grocery');
  if (category === 'clinic') return type.includes('clinic');
  if (category === 'pharmacy') return type.includes('pharmacy');
  if (category === 'interpreter') return type.includes('interpreter') || haystack.includes('language');
  if (category === 'emergency_line') return type.includes('crisis') || type.includes('emergency') || haystack.includes('911') || haystack.includes('988');
  if (category === 'insurance_help') return type.includes('insurance') || haystack.includes('medi-cal') || haystack.includes('covered california');
  return type.includes(category);
}

function parseGuideTableResources(guideText, category) {
  const resources = [];
  for (const line of String(guideText || '').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || /^(\|\s*-+)/.test(trimmed)) continue;
    const cells = trimmed.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 3 || /^name$/i.test(cleanMarkdownText(cells[0]))) continue;

    const name = cleanMarkdownText(cells[0]);
    const type = cleanMarkdownText(cells[1]).split('/')[0].trim();
    const description = cleanMarkdownText(cells[2]);
    const contact = cleanMarkdownText(cells[3] || '');
    const extra = cleanMarkdownText(cells.slice(4).join(' '));
    const resource = {
      name,
      type: type || category,
      phone: firstPhone(contact) || firstPhone(extra),
      address: /\b\d{2,6}\s+[A-Za-z][A-Za-z0-9 .'-]*(?:St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive|Way|Court|Ct)\b/i.test(extra) ? extra : '',
      url: firstUrl(contact) || firstUrl(extra),
      why: description,
      nextStep: extra || description,
      source: 'yolo_resources.md',
    };

    if (categoryMatchesResource(category, resource)) {
      resources.push(resource);
    }
  }
  return resources;
}

async function getCuratedResources(category) {
  const guideResources = parseGuideTableResources(await loadCuratedResourceGuide(), category);
  const staticResources =
    category === 'housing'
      ? HOUSING_STATIC.map((r) => ({
        name: r.name,
        type: r.type,
        phone: r.phone || '',
        address: r.distance || '',
        url: r.url,
        why: r.description,
        nextStep: r.description,
        source: 'local_static',
      }))
      : [];
  return dedupeResources([...guideResources, ...staticResources]);
}

async function fetchCraigslistListings(budgetMax, unitType) {
  let url = 'https://sacramento.craigslist.org/search/apa?format=rss&postal=95616&search_distance=3&sort=date';
  if (budgetMax) url += `&max_price=${budgetMax}`;
  if (unitType && unitType !== 'any') {
    const brMap = { studio: '0', '1br': '1', '2br': '2', '3br': '3' };
    const br = brMap[unitType];
    if (br !== undefined) {
      url += `&min_bedrooms=${br}&max_bedrooms=${br}`;
    }
  }

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CowmunityCare/1.0)' },
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) throw new Error(`Craigslist returned ${response.status}`);

  const text = await response.text();
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;

  while ((m = itemRe.exec(text)) !== null && items.length < 5) {
    const chunk = m[1];
    const title = (chunk.match(/<title><!\[CDATA\[(.*?)\]\]>/)?.[1] ?? chunk.match(/<title>(.*?)<\/title>/)?.[1] ?? '').trim();
    const rawLink = chunk.match(/<link>(.*?)<\/link>/)?.[1]?.trim() ?? '';
    // Craigslist sometimes puts the URL after <link/> as a text node
    const link = rawLink || (chunk.match(/<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/)?.[1] ?? '');
    const price = title.match(/\$[\d,]+/)?.[0] ?? chunk.match(/\$[\d,]+/)?.[0] ?? 'contact for price';
    const decoded = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
    if (decoded && link) items.push({ title: decoded, price, url: link, source: 'Craigslist' });
  }

  return items;
}

export async function search_housing(args) {
  const { location_preference, budget_max, unit_type } = args;

  let liveListings = [];
  try {
    liveListings = await fetchCraigslistListings(budget_max, unit_type);
  } catch (e) {
    console.warn('[Housing] Craigslist scrape failed:', e.message);
  }

  const searchLinks = HOUSING_STATIC.map((r) => {
    if (budget_max && r.type === 'search_portal' && r.url.includes('craigslist')) {
      return { ...r, url: r.url + `&max_price=${budget_max}` };
    }
    if (budget_max && r.url.includes('zillow')) {
      return { ...r, url: r.url + `?price=0-${budget_max}` };
    }
    return r;
  });

  return {
    live_listings: liveListings,
    search_links: searchLinks,
    filters_applied: {
      location: location_preference,
      budget_max: budget_max ?? null,
      unit_type: unit_type ?? 'any',
    },
    note: liveListings.length > 0
      ? `Found ${liveListings.length} current listings near Davis. Availability and prices change daily — confirm with landlords.`
      : 'Live listings unavailable right now. Share the search links below with the patient so they can browse current options.',
  };
}

export async function lookup_resources(args) {
  const curatedResources = await getCuratedResources(args.category);

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
        resources: dedupeResources([
          ...matches.map((m) => ({
            name: m.name, address: m.address || '', phone: m.phone || '',
            url: m.url || '', type: m.type, why: m.why || '', nextStep: m.nextStep || '',
          })),
          ...curatedResources,
        ]).slice(0, 7),
        escalation_note: escalation_note || null,
        category: args.category,
      };
    } catch (e) {
      console.warn('[Backboard] lookup_resources failed, using fallback:', e.message);
    }
  }
  return {
    resources: curatedResources.length ? curatedResources.slice(0, 7) : FALLBACK_RESOURCES[args.category] || FALLBACK_RESOURCES.clinic,
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

export async function check_resource_access(args) {
  const { needs = [], facility_type, patient_city } = args;
  const TYPE_MAP = {
    clinic: 'free_clinic', free_clinic: 'free_clinic', hospital: 'hospital',
    shelter: 'shelter', food_bank: 'food_bank', food: 'food_bank',
    pharmacy: 'pharmacy', urgent_care: 'urgent_care',
  };
  const normalizedType = TYPE_MAP[facility_type] || null;
  const allFacilities = await getFacilitiesWithScores();
  const typed = normalizedType ? allFacilities.filter((f) => f.type === normalizedType) : allFacilities;

  const coords = getPatientCoords(patient_city);
  const sorted = coords
    ? typed
        .map((f) => ({
          ...f,
          _distKm: f.lat && f.lng
            ? Math.round(facilityStorage.haversineKm(coords.lat, coords.lng, f.lat, f.lng) * 10) / 10
            : 9999,
        }))
        .sort((a, b) => a._distKm - b._distKm)
    : typed;

  const results = sorted.slice(0, 3).map((facility) => {
    const { matched, missing } = matchAccessibility(needs, facility);
    return {
      name: facility.name,
      type: facility.type,
      address: facility.address ? `${facility.address}, ${facility.city}, CA` : '',
      phone: facility.phone || '',
      hours: facility.hours || '',
      access_score: facility.score ?? 0,
      access_breakdown: facility.breakdown ?? {},
      matched,
      missing,
      known_barriers: facility.known_barriers ?? [],
      distance_label: coords && facility._distKm != null && facility._distKm < 9999
        ? `${Math.round(facility._distKm * 0.621371 * 10) / 10} mi away`
        : 'Distance unknown',
    };
  });

  if (!results.length) {
    return { results: [], note: 'No facilities of this type found. Staff should conduct a manual search.' };
  }
  return { results, patient_city: patient_city || 'Unknown', needs };
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

export async function send_email(args) {
  const { to, subject, body_text } = args;
  if (!to || !to.includes('@')) return { success: false, error: 'Invalid email address.' };
  await sendResourceEmail({ to, subject, bodyText: body_text });
  return { success: true, message: `Email sent to ${to}.` };
}

export const handlers = {
  tag_urgency,
  finalize_intake,
  lookup_resources,
  search_housing,
  send_email,
  get_available_slots,
  find_nearest_facility,
  check_resource_access,
  book_appointment,
  request_navigation,
};

export async function dispatchFunctionCall(name, args, broadcast, storage = defaultStorage, context = {}, userContext = null) {
  const handler = handlers[name];
  if (!handler) return { success: false, error: `Unknown function: ${name}` };

  if (name === 'finalize_intake') return handler(args, broadcast, storage, context, userContext);
  if (name === 'tag_urgency') return handler(args, broadcast, context);
  if (name === 'book_appointment') return handler(args, broadcast, userContext);
  if (name === 'request_navigation') return handler(args, context);
  return handler(args);
}
