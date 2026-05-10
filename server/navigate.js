import { haversineKm } from './facilities.js';

const PHOTON_BASE = 'https://photon.komoot.io/api';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const OSRM_BASE = 'https://router.project-osrm.org/route/v1';
const GEOAPIFY_AUTOCOMPLETE = 'https://api.geoapify.com/v1/geocode/autocomplete';
const GEOAPIFY_DETAILS = 'https://api.geoapify.com/v2/place-details';
const GOOGLE_PLACES_BASE = 'https://places.googleapis.com/v1';
const GOOGLE_DIRECTIONS = 'https://maps.googleapis.com/maps/api/directions/json';

function googleKey() {
  return process.env.GOOGLE_MAPS_API_KEY || null;
}

function geoapifyKey() {
  return process.env.GEOAPIFY_API_KEY || null;
}

function wheelchairToAccess(wc) {
  return {
    wheelchairAccessibleEntrance: wc === 'yes' ? true : wc === 'no' ? false : null,
    wheelchairLimited: wc === 'limited',
    wheelchairToilets: false,
    rawWheelchair: wc || null,
  };
}

const OSM_TYPE_MAP = { N: 'node', W: 'way', R: 'relation' };

function formatDistance(meters) {
  if (!meters && meters !== 0) return '';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function describeManeuver(step) {
  const m = step.maneuver || {};
  const type = m.type || '';
  const modifier = m.modifier || '';
  const name = step.name || '';
  if (type === 'depart') return `Head ${modifier || 'out'}${name ? ` on ${name}` : ''}`;
  if (type === 'arrive') return `Arrive at destination${name ? ` on ${name}` : ''}`;
  if (type === 'turn') return `Turn ${modifier}${name ? ` onto ${name}` : ''}`;
  if (type === 'continue') return `Continue${modifier ? ` ${modifier}` : ''}${name ? ` on ${name}` : ''}`;
  if (type === 'merge') return `Merge${modifier ? ` ${modifier}` : ''}${name ? ` onto ${name}` : ''}`;
  if (type === 'roundabout' || type === 'rotary') return `Take the roundabout${name ? ` to ${name}` : ''}`;
  if (type === 'fork') return `Keep ${modifier || 'ahead'}${name ? ` on ${name}` : ''}`;
  return `${type || 'Continue'}${modifier ? ` ${modifier}` : ''}${name ? ` on ${name}` : ''}`;
}

function placeIdFor(feature) {
  const osm = feature.properties?.osm_type;
  const id = feature.properties?.osm_id;
  if (!osm || !id) return null;
  return `${osm}:${id}`;
}

function decodePlaceId(placeId) {
  const [osmTypeShort, idStr] = String(placeId).split(':');
  return {
    osmType: OSM_TYPE_MAP[osmTypeShort] || null,
    osmId: Number(idStr),
  };
}

function readableAddress(props) {
  return [props.name, props.street, props.city, props.state, props.country]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(1) // drop name (already shown separately)
    .join(', ');
}

async function geoapifyCall(query, near, type, key) {
  const params = new URLSearchParams({ text: query, limit: '10', apiKey: key });
  if (type) params.set('type', type);
  if (near?.lat && near?.lng) {
    params.set('bias', `proximity:${near.lng},${near.lat}`);
    params.set('filter', `circle:${near.lng},${near.lat},40000`); // 40 km radius
  }
  const res = await fetch(`${GEOAPIFY_AUTOCOMPLETE}?${params.toString()}`);
  if (!res.ok) throw new Error(`Geoapify autocomplete failed: ${res.status}`);
  const data = await res.json();
  return data.features || [];
}

async function placesAutocompleteGeoapify(query, near, key) {
  // Run two queries in parallel and merge — amenities (POIs/businesses) first,
  // then unrestricted as fallback so addresses + neighborhoods still work.
  const [amenityFeatures, openFeatures] = await Promise.all([
    near ? geoapifyCall(query, near, 'amenity', key).catch(() => []) : Promise.resolve([]),
    geoapifyCall(query, near, null, key).catch(() => []),
  ]);
  const seen = new Set();
  const merged = [];
  for (const f of [...amenityFeatures, ...openFeatures]) {
    const id = f.properties?.place_id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    merged.push(f);
    if (merged.length >= 10) break;
  }
  return merged
    .map((f) => {
      const p = f.properties || {};
      const placeId = p.place_id;
      if (!placeId) return null;
      const lat = p.lat;
      const lng = p.lon;
      const name = p.name || p.address_line1 || p.street || query;
      const addr = p.formatted || p.address_line2 || '';
      const raw = p.datasource?.raw || {};
      const accessibility = wheelchairToAccess(raw.wheelchair);
      accessibility.wheelchairToilets = raw['toilets:wheelchair'] === 'yes';
      return {
        placeId: `gp:${placeId}`,
        text: addr || name,
        name,
        location: lat && lng ? { lat, lng } : null,
        types: [p.result_type, ...(p.categories || [])].filter(Boolean),
        accessibility,
        phone: raw.phone || raw['contact:phone'] || '',
        website: raw.website || raw['contact:website'] || '',
      };
    })
    .filter(Boolean);
}

async function placesAutocompletePhoton(query, near) {
  const params = new URLSearchParams({ q: query, limit: '8' });
  if (near?.lat && near?.lng) {
    params.set('lat', String(near.lat));
    params.set('lon', String(near.lng));
  }
  const res = await fetch(`${PHOTON_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`Photon failed: ${res.status}`);
  const data = await res.json();
  return (data.features || [])
    .map((f) => {
      const placeId = placeIdFor(f);
      if (!placeId) return null;
      const props = f.properties || {};
      const [lng, lat] = f.geometry?.coordinates || [];
      const name = props.name || props.street || query;
      const addr = readableAddress(props);
      return {
        placeId,
        text: addr ? `${name} — ${addr}` : name,
        name,
        location: lat && lng ? { lat, lng } : null,
        types: [props.type, props.osm_value, props.osm_key].filter(Boolean),
      };
    })
    .filter(Boolean);
}

async function placesAutocompleteGoogle(query, near, key) {
  const body = { input: query };
  if (near?.lat && near?.lng) {
    body.locationBias = {
      circle: { center: { latitude: near.lat, longitude: near.lng }, radius: 30000.0 },
    };
  }
  const res = await fetch(`${GOOGLE_PLACES_BASE}/places:autocomplete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Google autocomplete failed: ${res.status}`);
  const data = await res.json();
  return (data.suggestions || [])
    .filter((s) => s.placePrediction)
    .map((s) => ({
      placeId: `g:${s.placePrediction.placeId}`,
      text: s.placePrediction.text?.text || '',
      name: s.placePrediction.structuredFormat?.mainText?.text || s.placePrediction.text?.text || '',
      location: null,
      types: s.placePrediction.types || [],
    }));
}

export async function placesAutocomplete(query, near) {
  const gkey = googleKey();
  if (gkey) {
    try {
      const results = await placesAutocompleteGoogle(query, near, gkey);
      if (results.length) return results;
    } catch (e) {
      console.warn('[Google] autocomplete failed, trying Geoapify:', e.message);
    }
  }
  const key = geoapifyKey();
  if (key) {
    try {
      const results = await placesAutocompleteGeoapify(query, near, key);
      if (results.length) return results;
    } catch (e) {
      console.warn('[Geoapify] autocomplete failed, falling back to Photon:', e.message);
    }
  }
  return placesAutocompletePhoton(query, near);
}

async function fetchOsmTags({ osmType, osmId }) {
  if (!osmType || !osmId) return {};
  const data = `[out:json];${osmType}(${osmId});out tags 1;`;
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(data)}`,
  });
  if (!res.ok) return {};
  const json = await res.json();
  const el = (json.elements || [])[0];
  return el?.tags || {};
}

async function placeDetailsGoogle(placeId, key) {
  const id = String(placeId).replace(/^g:/, '');
  const fields = [
    'id', 'displayName', 'formattedAddress', 'location', 'types',
    'accessibilityOptions', 'internationalPhoneNumber', 'websiteUri',
  ].join(',');
  const res = await fetch(`${GOOGLE_PLACES_BASE}/places/${encodeURIComponent(id)}`, {
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fields },
  });
  if (!res.ok) throw new Error(`Google place details failed: ${res.status}`);
  const p = await res.json();
  const a = p.accessibilityOptions || {};
  return {
    placeId,
    name: p.displayName?.text || '',
    address: p.formattedAddress || '',
    location: p.location ? { lat: p.location.latitude, lng: p.location.longitude } : null,
    types: p.types || [],
    phone: p.internationalPhoneNumber || '',
    website: p.websiteUri || '',
    accessibility: {
      wheelchairAccessibleEntrance: a.wheelchairAccessibleEntrance ?? null,
      wheelchairLimited: false,
      wheelchairToilets: a.wheelchairAccessibleRestroom === true,
      rawWheelchair: a.wheelchairAccessibleEntrance === true ? 'yes' : a.wheelchairAccessibleEntrance === false ? 'no' : null,
    },
  };
}

export async function placeDetails(placeId, hint = null) {
  // Google path: place_id is prefixed "g:".
  if (String(placeId).startsWith('g:')) {
    const gkey = googleKey();
    if (gkey) {
      try { return await placeDetailsGoogle(placeId, gkey); } catch (e) { console.warn('[Google] place details failed:', e.message); }
    }
    return { placeId, name: hint?.name || '', address: hint?.address || '', location: hint?.location || null, types: hint?.types || [], phone: '', website: '', accessibility: wheelchairToAccess(null) };
  }
  // Geoapify path: place_id is prefixed "gp:". The hint already contains
  // accessibility, phone, and website populated from autocomplete, so we don't
  // need a second API call unless we want to enrich further.
  if (String(placeId).startsWith('gp:')) {
    return {
      placeId,
      name: hint?.name || '',
      address: hint?.address || '',
      location: hint?.location || null,
      types: hint?.types || [],
      phone: hint?.phone || '',
      website: hint?.website || '',
      accessibility: hint?.accessibility || wheelchairToAccess(null),
    };
  }

  // OSM/Photon path: query Overpass for the wheelchair tag.
  const decoded = decodePlaceId(placeId);
  let tags = {};
  try {
    tags = await fetchOsmTags(decoded);
  } catch {
    /* tolerate Overpass flakiness */
  }
  const accessibility = wheelchairToAccess(tags.wheelchair);
  accessibility.wheelchairToilets = tags['toilets:wheelchair'] === 'yes';

  return {
    placeId,
    name: hint?.name || tags.name || '',
    address: hint?.address || [tags['addr:street'], tags['addr:city']].filter(Boolean).join(', '),
    location: hint?.location || null,
    types: hint?.types || [tags.amenity, tags.shop, tags.leisure].filter(Boolean),
    phone: tags.phone || tags['contact:phone'] || '',
    website: tags.website || tags['contact:website'] || '',
    accessibility,
  };
}

async function directionsGoogle(origin, destination, mode, key) {
  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode,
    key,
  });
  if (mode === 'transit') params.set('alternatives', 'true');
  const res = await fetch(`${GOOGLE_DIRECTIONS}?${params.toString()}`);
  if (!res.ok) return { ok: false, status: 'GOOGLE_FAILED', error: `Google Directions ${res.status}` };
  const data = await res.json();
  if (data.status !== 'OK') return { ok: false, status: data.status, error: data.error_message || data.status };
  const route = data.routes[0];
  const leg = route.legs[0];
  const polylineCoords = decodeGooglePolyline(route.overview_polyline?.points || '');
  return {
    ok: true,
    summary: route.summary,
    polylineCoords,
    distanceMeters: leg.distance?.value || 0,
    distanceText: leg.distance?.text || formatDistance(leg.distance?.value || 0),
    durationSeconds: leg.duration?.value || 0,
    durationText: leg.duration?.text || formatDuration(leg.duration?.value || 0),
    steps: (leg.steps || []).map((s) => ({
      instruction: stripHtml(s.html_instructions || ''),
      distanceText: s.distance?.text || '',
      durationText: s.duration?.text || '',
      travelMode: s.travel_mode,
      transit: s.transit_details
        ? {
            line: s.transit_details.line?.short_name || s.transit_details.line?.name || '',
            vehicle: s.transit_details.line?.vehicle?.type || '',
            departureStop: s.transit_details.departure_stop?.name || '',
            arrivalStop: s.transit_details.arrival_stop?.name || '',
            numStops: s.transit_details.num_stops || 0,
          }
        : null,
    })),
  };
}

function stripHtml(s) { return s.replace(/<[^>]*>/g, ''); }

function decodeGooglePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

export async function directions(origin, destination, mode = 'walking') {
  const gkey = googleKey();
  if (gkey) {
    try {
      const result = await directionsGoogle(origin, destination, mode, gkey);
      if (result.ok) return result;
    } catch (e) {
      console.warn('[Google] directions failed, falling back to OSRM:', e.message);
    }
  }
  if (mode === 'transit') {
    return {
      ok: false,
      status: 'TRANSIT_UNAVAILABLE',
      error: 'Transit/bus routing requires GOOGLE_MAPS_API_KEY. Try walking or rideshare.',
    };
  }
  const profile = mode === 'driving' ? 'driving' : 'foot';
  const url = `${OSRM_BASE}/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);
  if (!res.ok) {
    return { ok: false, status: 'OSRM_FAILED', error: `OSRM ${res.status}` };
  }
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) {
    return { ok: false, status: data.code || 'NO_ROUTE', error: data.message || 'No route found' };
  }
  const route = data.routes[0];
  const leg = route.legs?.[0] || {};
  const coords = (route.geometry?.coordinates || []).map(([lng, lat]) => ({ lat, lng }));
  return {
    ok: true,
    summary: leg.summary || '',
    polylineCoords: coords,
    distanceMeters: Math.round(route.distance || 0),
    distanceText: formatDistance(route.distance || 0),
    durationSeconds: Math.round(route.duration || 0),
    durationText: formatDuration(route.duration || 0),
    steps: (leg.steps || []).map((s) => ({
      instruction: describeManeuver(s),
      distanceText: formatDistance(s.distance || 0),
      durationText: formatDuration(s.duration || 0),
      travelMode: profile === 'foot' ? 'WALKING' : 'DRIVING',
      transit: null,
    })),
  };
}

export function uberDeeplink(destination, dropoffName) {
  const params = new URLSearchParams({
    action: 'setPickup',
    pickup: 'my_location',
    'dropoff[latitude]': String(destination.lat),
    'dropoff[longitude]': String(destination.lng),
  });
  if (dropoffName) params.set('dropoff[nickname]', dropoffName);
  return `https://m.uber.com/ul/?${params.toString()}`;
}

export function recommendMode({ profile = {}, distanceMeters = 0, destAccess = null, destination = null, destName = '' }) {
  const usesWheelchair = profile.usesWheelchair === true || profile.mobilityLevel === 'wheelchair';
  const limited = profile.mobilityLevel === 'limited';
  const walkLimit = Number(profile.walkingLimitMeters) || null;

  const reasons = [];
  let primary = 'walk';
  const alternatives = [];
  let blocked = false;

  if (usesWheelchair) {
    if (destAccess && destAccess.wheelchairAccessibleEntrance === false) {
      blocked = true;
      reasons.push('OpenStreetMap reports this destination is not wheelchair accessible.');
    } else if (destAccess?.wheelchairLimited) {
      primary = 'wheelchair';
      reasons.push('Partial wheelchair access reported — may need help at the entrance.');
    } else if (destAccess?.wheelchairAccessibleEntrance === true) {
      primary = 'wheelchair';
      reasons.push('Wheelchair-accessible entrance confirmed in OpenStreetMap.');
    } else {
      primary = 'wheelchair';
      reasons.push('Routing on walking paths — call ahead to confirm accessibility (no OSM data).');
    }
  }

  if (!blocked && walkLimit && distanceMeters > walkLimit) {
    primary = distanceMeters > Math.max(walkLimit * 3, 1500) ? 'rideshare' : 'transit';
    reasons.push(`${Math.round(distanceMeters)} m exceeds your comfortable walking limit of ${walkLimit} m.`);
  } else if (!blocked && limited && distanceMeters > 800) {
    primary = 'transit';
    reasons.push('Limited mobility plus longer distance — consider transit or rideshare.');
  }

  if (primary !== 'walk' && primary !== 'wheelchair') alternatives.push('walk');
  if (primary !== 'transit') alternatives.push('transit');
  if (primary !== 'rideshare') alternatives.push('rideshare');

  const out = {
    primary: blocked ? null : primary,
    blocked,
    reason: reasons.join(' '),
    alternatives,
  };
  if (destination?.lat && destination?.lng) {
    out.uberDeeplink = uberDeeplink(destination, destName);
  }
  return out;
}

export { haversineKm };
