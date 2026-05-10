import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {
  placesAutocomplete,
  placeDetails,
  directions,
  recommendMode,
  haversineKm,
} from '../navigate.js';

const JWT_SECRET = process.env.JWT_SECRET || 'clinicvoice-dev-secret';

async function loadOptionalUser(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(payload.userId).lean();
      if (user) req.userProfile = user.profile || {};
    } catch {
      /* ignore — guest */
    }
  }
  next();
}

const router = Router();
router.use(loadOptionalUser);

router.post('/navigate/places', async (req, res) => {
  try {
    const { query, near } = req.body || {};
    if (!query || query.trim().length < 2) return res.json({ results: [] });
    const results = await placesAutocomplete(query.trim(), near);
    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/navigate/place/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    const details = await placeDetails(placeId, req.body?.hint || null);
    res.json({ place: details });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/navigate/directions', async (req, res) => {
  try {
    const { origin, destination, mode } = req.body || {};
    if (!origin?.lat || !destination?.lat) {
      return res.status(400).json({ error: 'origin and destination with lat/lng required' });
    }
    const route = await directions(origin, destination, mode || 'walking');
    res.json(route);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/navigate/recommend', async (req, res) => {
  try {
    const { destination, destName, destAccess, origin, distanceMeters, overrideProfile } = req.body || {};
    const profile = { ...(req.userProfile || {}), ...(overrideProfile || {}) };

    let dist = Number(distanceMeters) || 0;
    if (!dist && origin?.lat && destination?.lat) {
      dist = Math.round(haversineKm(origin.lat, origin.lng, destination.lat, destination.lng) * 1000);
    }

    const rec = recommendMode({
      profile,
      distanceMeters: dist,
      destAccess: destAccess || null,
      destination,
      destName: destName || '',
    });
    res.json({ ...rec, distanceMeters: dist, profileKnown: !!req.userProfile });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
