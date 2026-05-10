import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { useAuth } from './useAuth.jsx';
import useGeolocation from './useGeolocation.js';

const API = 'http://localhost:3001';
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const LIBRARIES = ['places'];
const DEFAULT_CENTER = { lat: 38.5449, lng: -121.7405 }; // Davis, CA

const QUESTIONS = [
  {
    key: 'usesWheelchair',
    label: 'Do you use a wheelchair or mobility scooter?',
    type: 'yesno',
  },
  {
    key: 'walkingLimitMeters',
    label: 'About how far can you comfortably walk in one trip?',
    type: 'choice',
    options: [
      { value: 200, label: 'A short block (~200 m)' },
      { value: 500, label: 'A few blocks (~500 m)' },
      { value: 1000, label: 'About a kilometer' },
      { value: 3000, label: 'No real limit' },
    ],
  },
  {
    key: 'mobilityLevel',
    label: 'How would you describe your overall mobility?',
    type: 'choice',
    options: [
      { value: 'none', label: 'No issues' },
      { value: 'limited', label: 'Limited — I tire easily or have some pain' },
      { value: 'wheelchair', label: 'I rely on a wheelchair' },
    ],
  },
];

function nextMissingQuestion(profile) {
  for (const q of QUESTIONS) {
    const v = profile?.[q.key];
    if (q.key === 'usesWheelchair') {
      if (v === undefined || v === null) return q;
      continue;
    }
    if (q.key === 'walkingLimitMeters') {
      if (profile?.usesWheelchair === true) continue;
      if (!v) return q;
      continue;
    }
    if (!v) return q;
  }
  return null;
}

function FitBounds({ map, origin, destination }) {
  useEffect(() => {
    if (!map || !window.google) return;
    if (origin && destination) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(destination);
      map.fitBounds(bounds, 60);
    } else if (origin) {
      map.setCenter(origin);
      map.setZoom(14);
    }
  }, [map, origin, destination]);
  return null;
}

export default function NavigatePanel({ initialQuery = '', onClose = null, embedded = false }) {
  const { user, isLoggedIn, updateProfile } = useAuth();
  const { coords } = useGeolocation();
  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: MAPS_KEY || 'MISSING',
    libraries: LIBRARIES,
    preventGoogleFontsLoading: true,
  });
  const [mapInstance, setMapInstance] = useState(null);

  const [guestProfile, setGuestProfile] = useState({});
  const profile = useMemo(
    () => (isLoggedIn ? (user?.profile || {}) : guestProfile),
    [isLoggedIn, user, guestProfile],
  );

  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [route, setRoute] = useState(null);
  const [mode, setMode] = useState('walking');
  const [recommendation, setRecommendation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);
  const lastInitialRef = useRef('');
  const suppressSuggestionsRef = useRef(false);

  // Auto-search when initialQuery changes (e.g. voice trigger)
  useEffect(() => {
    if (initialQuery && initialQuery !== lastInitialRef.current) {
      setQuery(initialQuery);
      lastInitialRef.current = initialQuery;
    }
  }, [initialQuery]);

  const origin = coords;
  const destination = selected?.location || null;

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (suppressSuggestionsRef.current) {
      suppressSuggestionsRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/navigate/places`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, near: origin }),
        });
        const data = await res.json();
        setSuggestions(data.results || []);
      } catch (e) {
        setError(e.message);
      }
    }, 280);
  }, [query, origin]);

  const pickPlace = useCallback(async (s) => {
    suppressSuggestionsRef.current = true;
    setQuery(s.text);
    setSuggestions([]);
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/navigate/place/${encodeURIComponent(s.placeId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hint: { name: s.name, location: s.location, types: s.types, address: s.text, accessibility: s.accessibility, phone: s.phone, website: s.website } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'place lookup failed');
      setSelected(data.place);
      setRoute(null);
      setRecommendation(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, []);

  // Auto-pick the top suggestion when triggered by voice (initialQuery present)
  useEffect(() => {
    if (initialQuery && suggestions.length > 0 && !selected && query === initialQuery) {
      pickPlace(suggestions[0]);
    }
  }, [initialQuery, suggestions, selected, query, pickPlace]);

  useEffect(() => {
    if (!selected || !origin) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError('');
      try {
        const recRes = await fetch(`${API}/api/navigate/recommend`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(isLoggedIn ? { Authorization: `Bearer ${localStorage.getItem('cv_token')}` } : {}),
          },
          body: JSON.stringify({
            origin,
            destination: selected.location,
            destName: selected.name,
            destAccess: selected.accessibility,
            overrideProfile: isLoggedIn ? null : guestProfile,
          }),
        });
        const rec = await recRes.json();
        if (cancelled) return;
        setRecommendation(rec);
        const initialMode = rec.primary === 'rideshare' ? 'driving' : 'walking';
        setMode(initialMode);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selected, origin, isLoggedIn, guestProfile]);

  useEffect(() => {
    if (!selected?.location || !origin) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        const res = await fetch(`${API}/api/navigate/directions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ origin, destination: selected.location, mode }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.ok) { setRoute(data); setError(''); }
        else { setRoute(null); setError(data.error || 'No route'); }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [mode, selected, origin]);

  const answer = useCallback(async (key, value) => {
    if (isLoggedIn) {
      try { await updateProfile({ [key]: value }); }
      catch (e) { setError(e.message); }
    } else {
      setGuestProfile((p) => ({ ...p, [key]: value }));
    }
  }, [isLoggedIn, updateProfile]);

  const pendingQ = nextMissingQuestion(profile);
  const polylinePath = useMemo(
    () => (route?.polylineCoords || []).map((c) => ({ lat: c.lat, lng: c.lng })),
    [route],
  );

  const accessBlocked = recommendation?.blocked;
  const wheelEntrance = selected?.accessibility?.wheelchairAccessibleEntrance;
  const wheelLimited = selected?.accessibility?.wheelchairLimited;
  const initialCenter = origin || DEFAULT_CENTER;

  return (
    <>
      <section className={`nav-panel ${embedded ? 'nav-panel-embedded' : ''}`}>
        {embedded && onClose && (
          <button className="nav-close" type="button" onClick={onClose} aria-label="Close">×</button>
        )}
        <h1 className="nav-title">Find a place you can reach</h1>
        <p className="nav-sub">
          Tell us where you'd like to go. We'll plan a route that fits your mobility and pick the best way to get there.
        </p>

        <div className="nav-search">
          <input
            autoFocus
            className="nav-input"
            placeholder="Search a place — e.g. Central Park, Trader Joe's"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {suggestions.length > 0 && (
            <ul className="nav-suggestions">
              {suggestions.map((s) => (
                <li key={s.placeId}>
                  <button type="button" onClick={() => pickPlace(s)}>{s.text}</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {pendingQ && selected && (
          <div className="nav-question">
            <div className="nav-question-label">{pendingQ.label}</div>
            {pendingQ.type === 'yesno' && (
              <div className="nav-question-row">
                <button type="button" className="nav-chip" onClick={() => answer(pendingQ.key, true)}>Yes</button>
                <button type="button" className="nav-chip" onClick={() => answer(pendingQ.key, false)}>No</button>
              </div>
            )}
            {pendingQ.type === 'choice' && (
              <div className="nav-question-grid">
                {pendingQ.options.map((opt) => (
                  <button key={opt.value} type="button" className="nav-chip" onClick={() => answer(pendingQ.key, opt.value)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
            <div className="nav-question-hint">
              {isLoggedIn ? "We'll save this to your profile so you don't have to answer again." : 'Sign in to save your answers.'}
            </div>
          </div>
        )}

        {!pendingQ && (
          <div className="nav-chips-row">
            {profile.usesWheelchair === true && <span className="nav-chip nav-chip-on">Wheelchair user</span>}
            {profile.walkingLimitMeters && <span className="nav-chip nav-chip-on">Walk limit: {profile.walkingLimitMeters} m</span>}
            {profile.mobilityLevel && profile.mobilityLevel !== 'none' && (
              <span className="nav-chip nav-chip-on">Mobility: {profile.mobilityLevel}</span>
            )}
            {isLoggedIn && <Link className="nav-chip nav-chip-link" to="/settings">Edit</Link>}
          </div>
        )}

        {selected && (
          <div className="nav-dest">
            <div className="nav-dest-name">{selected.name}</div>
            <div className="nav-dest-addr">{selected.address}</div>
            {wheelEntrance === false && (
              <div className="nav-warning">⚠️ OpenStreetMap reports this destination is not wheelchair accessible.</div>
            )}
            {wheelEntrance === true && (
              <div className="nav-ok">♿ Wheelchair-accessible per OpenStreetMap.</div>
            )}
            {wheelLimited && (
              <div className="nav-ok" style={{ background: '#fff8e1', borderLeftColor: '#d4a017', color: '#6b4f00' }}>
                ⚠️ Partial wheelchair access reported — call ahead to confirm.
              </div>
            )}
            {wheelEntrance === null && !wheelLimited && (
              <div className="nav-ok" style={{ background: '#eef2f7', borderLeftColor: '#5a6378', color: '#3a4250' }}>
                ℹ️ No accessibility info on file in OpenStreetMap. Calling ahead is a good idea.
              </div>
            )}
          </div>
        )}

        {recommendation && !accessBlocked && (
          <>
            <div className="nav-mode-tabs" role="tablist">
              {[
                { id: 'walking', label: profile.usesWheelchair ? 'Wheelchair' : 'Walk' },
                { id: 'transit', label: 'Transit / Bus' },
                { id: 'driving', label: 'Rideshare' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={mode === t.id}
                  className={`nav-tab ${mode === t.id ? 'nav-tab-active' : ''}`}
                  onClick={() => setMode(t.id)}
                >
                  {t.label}
                  {(
                    (t.id === 'walking' && (recommendation.primary === 'walk' || recommendation.primary === 'wheelchair')) ||
                    (t.id === 'driving' && recommendation.primary === 'rideshare')
                  ) && <span className="nav-tab-badge">Recommended</span>}
                </button>
              ))}
            </div>
            {recommendation.reason && <div className="nav-reason">{recommendation.reason}</div>}
            {mode === 'transit' && (
              <div className="nav-warning" style={{ marginBottom: 16 }}>
                Transit/bus routing is not available with our free map data. Try Walk or Rideshare, or check your local transit app.
              </div>
            )}
          </>
        )}

        {route && (
          <div className="nav-route">
            <div className="nav-route-summary">
              <span className="nav-route-time">{route.durationText}</span>
              <span className="nav-route-dist">{route.distanceText}</span>
            </div>
            <ol className="nav-steps">
              {route.steps.map((s, i) => (
                <li key={i} className="nav-step">
                  <span>{s.instruction}</span>
                  <span className="nav-step-meta">{s.distanceText} · {s.durationText}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {mode === 'driving' && recommendation?.uberDeeplink && (
          <a href={recommendation.uberDeeplink} target="_blank" rel="noopener noreferrer" className="nav-uber-btn">
            Open in Uber
          </a>
        )}

        {error && <div className="nav-error">{error}</div>}
        {busy && <div className="nav-busy">Loading…</div>}
      </section>

      <section className="nav-map-wrap">
        {!MAPS_KEY && (
          <div className="nav-map-placeholder">
            Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>client/.env</code> to render the map.
          </div>
        )}
        {MAPS_KEY && mapsLoaded && (
          <GoogleMap
            mapContainerClassName="nav-map"
            center={initialCenter}
            zoom={destination ? 14 : 13}
            onLoad={(m) => setMapInstance(m)}
            options={{ disableDefaultUI: false, zoomControl: true, streetViewControl: false, mapTypeControl: false }}
          >
            {origin && <Marker position={origin} label="A" />}
            {destination && <Marker position={destination} label="B" />}
            {polylinePath.length > 0 && (
              <Polyline path={polylinePath} options={{ strokeColor: '#022851', strokeWeight: 5, strokeOpacity: 0.85 }} />
            )}
            <FitBounds map={mapInstance} origin={origin} destination={destination} />
          </GoogleMap>
        )}
        {MAPS_KEY && !mapsLoaded && <div className="nav-map-placeholder">Loading map…</div>}
      </section>
    </>
  );
}
