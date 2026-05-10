import { useEffect, useState } from 'react';
import {
  Bar, BarChart, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { NavLink } from 'react-router-dom';

const BASE = `http://${window.location.hostname}:3001`;

// Match :root CSS variables exactly
const C = {
  blue:    '#0d274e',
  blueMid: '#154872',
  gold:    '#f5c242',
  goldWarm:'#b38b08',
  danger:  '#be2020',
  warning: '#b85412',
  muted:   '#8fa4b8',
};

const URGENCY_COLORS  = { CRITICAL: C.danger, HIGH: C.warning, MEDIUM: C.goldWarm, LOW: C.blueMid };
const INSURANCE_COLORS = { Insured: C.blueMid, Uninsured: C.danger, Unknown: C.muted };

const MODE_LABELS = {
  all:              'All categories',
  clinic:           'Healthcare',
  shelter:          'Housing',
  food_aid:         'Hunger',
  support_services: 'Access & Support',
};

function parseInsuranceStatus(value) {
  if (!value || value === 'Not collected') return 'Unknown';
  const v = value.toLowerCase();
  if (v.includes('no insurance') || v === 'no' || v === 'uninsured' || v.includes('none')) return 'Uninsured';
  if (v.includes('medi-cal') || v.includes('medicare') || v.includes('insurance') || v.includes('covered') || v.includes('yes')) return 'Insured';
  return 'Unknown';
}

function EmptyChart() {
  return <div className="chart-empty">No data yet</div>;
}

function buildVolumeData(range, intakes, appts) {
  if (range === 'all') {
    return Array.from({ length: 6 }, (_, i) => {
      const m = new Date();
      m.setDate(1);
      m.setMonth(m.getMonth() - (5 - i));
      const yr = m.getFullYear();
      const mo = m.getMonth();
      return {
        date: m.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        intakes: intakes.filter((c) => { if (!c.timestamp) return false; const t = new Date(c.timestamp); return t.getFullYear() === yr && t.getMonth() === mo; }).length,
        appointments: appts.filter((a) => { if (!a.timestamp) return false; const t = new Date(a.timestamp); return t.getFullYear() === yr && t.getMonth() === mo; }).length,
      };
    });
  }
  const n = range === '30d' ? 30 : 7;
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    const ds = d.toDateString();
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      intakes: intakes.filter((c) => c.timestamp && new Date(c.timestamp).toDateString() === ds).length,
      appointments: appts.filter((a) => a.timestamp && new Date(a.timestamp).toDateString() === ds).length,
    };
  });
}

export default function AnalyticsView() {
  const [intakes, setIntakes]           = useState(null);
  const [appointments, setAppointments] = useState(null);
  const [loadError, setLoadError]       = useState('');
  const [selectedMode, setSelectedMode] = useState('all');
  const [dateRange, setDateRange]       = useState('7d');

  useEffect(() => {
    fetch(`${BASE}/intakes`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => setIntakes(Array.isArray(data) ? data : []))
      .catch((err) => setLoadError(
        err.message.includes('503') || err.message.includes('fetch')
          ? 'Database is disconnected — whitelist your IP in MongoDB Atlas to load analytics.'
          : `Failed to load intakes: ${err.message}`,
      ));

    fetch(`${BASE}/appointments`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => setAppointments([]));
  }, []);

  const allIntakes = intakes ?? [];
  const allAppts   = appointments ?? [];

  // Date boundary (null = no filter)
  const rangeStart = (() => {
    if (dateRange === 'all') return null;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (dateRange === '30d' ? 29 : 6));
    return d;
  })();

  // Mode-only filter (used for mode distribution chart, always all-time per mode)
  const modeFiltered = selectedMode === 'all'
    ? allIntakes
    : allIntakes.filter((c) => c.mode === selectedMode);

  // Mode + date filter (used for all stats and charts)
  const filteredIntakes = rangeStart
    ? modeFiltered.filter((c) => c.timestamp && new Date(c.timestamp) >= rangeStart)
    : modeFiltered;

  const filteredIntakeIds = new Set(filteredIntakes.map((c) => c.id));
  const modeAppts = selectedMode === 'all'
    ? allAppts
    : allAppts.filter((a) => a.intake_id && filteredIntakeIds.has(a.intake_id));
  const filteredAppts = rangeStart
    ? modeAppts.filter((a) => a.timestamp && new Date(a.timestamp) >= rangeStart)
    : modeAppts;

  // ── Stats ──────────────────────────────────────────────────────
  const total       = filteredIntakes.length;
  const apptTotal   = filteredAppts.length;
  const criticalCount = filteredIntakes.filter((c) => ((c.urgency?.level || c.urgency) ?? '').toUpperCase() === 'CRITICAL').length;
  const highRiskCount = filteredIntakes.filter((c) => ['CRITICAL', 'HIGH'].includes(((c.urgency?.level || c.urgency) ?? '').toUpperCase())).length;
  const langCount   = new Set(filteredIntakes.map((c) => c.language || 'Unknown')).size;

  const insuranceCounts = { Insured: 0, Uninsured: 0, Unknown: 0 };
  filteredIntakes.forEach((c) => {
    insuranceCounts[parseInsuranceStatus(c.structured_fields?.insurance_or_cost_concern || '')]++;
  });
  const uninsuredCount = insuranceCounts.Uninsured;
  const insuranceData  = Object.entries(insuranceCounts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

  const urgencyCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  filteredIntakes.forEach((c) => {
    const lvl = ((c.urgency?.level || c.urgency) ?? 'LOW').toUpperCase();
    if (lvl in urgencyCounts) urgencyCounts[lvl]++;
  });
  const urgencyData = Object.entries(urgencyCounts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

  // Category distribution — date-filtered but not mode-filtered (always shows all 4 categories)
  const allDateFiltered = rangeStart
    ? allIntakes.filter((c) => c.timestamp && new Date(c.timestamp) >= rangeStart)
    : allIntakes;
  const modeCounts = { clinic: 0, shelter: 0, food_aid: 0, support_services: 0 };
  allDateFiltered.forEach((c) => { if (c.mode in modeCounts) modeCounts[c.mode]++; });
  const modeData = [
    { name: 'Healthcare',     count: modeCounts.clinic },
    { name: 'Housing',        count: modeCounts.shelter },
    { name: 'Hunger',         count: modeCounts.food_aid },
    { name: 'Access & Support', count: modeCounts.support_services },
  ];

  // Languages
  const langMap = {};
  filteredIntakes.forEach((c) => {
    const lang = c.language || c.patient?.language || 'Unknown';
    langMap[lang] = (langMap[lang] || 0) + 1;
  });
  const langData = Object.entries(langMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }));

  // Appointments by facility
  const facilityMap = {};
  filteredAppts.forEach((a) => { const k = a.facility_name || 'Unassigned'; facilityMap[k] = (facilityMap[k] || 0) + 1; });
  const facilityData = Object.entries(facilityMap).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));

  // Housing status (shelter)
  const housingMap = {};
  filteredIntakes.filter((c) => c.mode === 'shelter').forEach((c) => {
    const v = c.structured_fields?.current_housing_status || 'Not collected';
    housingMap[v] = (housingMap[v] || 0) + 1;
  });
  const housingData = Object.entries(housingMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

  // Household size (food_aid)
  const householdMap = {};
  filteredIntakes.filter((c) => c.mode === 'food_aid').forEach((c) => {
    const v = c.structured_fields?.household_size || 'Unknown';
    householdMap[v] = (householdMap[v] || 0) + 1;
  });
  const householdData = Object.entries(householdMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }));

  // Help type needed (support_services)
  const helpTypeMap = {};
  filteredIntakes.filter((c) => c.mode === 'support_services').forEach((c) => {
    const v = c.structured_fields?.help_type_needed || 'Not collected';
    helpTypeMap[v] = (helpTypeMap[v] || 0) + 1;
  });
  const helpTypeData = Object.entries(helpTypeMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

  // Contextual stat 3 & 4 labels/values
  const stat3Label = selectedMode === 'shelter' ? 'High risk cases' : 'Critical alerts';
  const stat3Value = selectedMode === 'shelter' ? highRiskCount : criticalCount;
  const stat4Label = selectedMode === 'shelter' ? 'Safety risk flagged'
    : selectedMode === 'food_aid' ? 'High urgency'
    : selectedMode === 'support_services' ? 'High urgency'
    : 'Uninsured patients';
  const stat4Value = selectedMode === 'shelter'
    ? filteredIntakes.filter((c) => c.structured_fields?.safety_risk && c.structured_fields.safety_risk !== 'Not collected' && c.structured_fields.safety_risk !== 'No').length
    : (selectedMode === 'food_aid' || selectedMode === 'support_services')
      ? filteredIntakes.filter((c) => ((c.urgency?.level || c.urgency) ?? '').toUpperCase() === 'HIGH').length
      : uninsuredCount;

  const activityLabel = dateRange === 'all' ? 'last 6 months' : dateRange === '30d' ? 'last 30 days' : 'last 7 days';
  const volumeData    = buildVolumeData(dateRange, filteredIntakes, filteredAppts);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <main className="analytics-shell" id="main-content">
      <header className="staff-header">
        <div className="brand-lockup">
          <p className="eyebrow">CowmunityCare · Analytics</p>
          <h1>Insights</h1>
          <p className="brand-tagline">Intake volume, urgency mix, modes, and languages over recent activity.</p>
        </div>
        <div className="connection is-live" role="status" aria-live="polite"><span />Live</div>
      </header>

      <nav className="staff-tabs" aria-label="Staff dashboard sections">
        <NavLink className={({ isActive }) => isActive ? 'staff-tab active' : 'staff-tab'} end to="/staff">Queue</NavLink>
        <NavLink className={({ isActive }) => isActive ? 'staff-tab active' : 'staff-tab'} to="/staff/appointments">Appointments</NavLink>
        <NavLink className={({ isActive }) => isActive ? 'staff-tab active' : 'staff-tab'} to="/staff/analytics">Analytics</NavLink>
      </nav>

      {loadError && <div className="analytics-error" role="alert">{loadError}</div>}

      {intakes && (
        <>
          <div className="analytics-controls">
            <div className="category-tabs">
              {Object.entries(MODE_LABELS).map(([value, label]) => {
                const count = value === 'all' ? allIntakes.length : allIntakes.filter((c) => c.mode === value).length;
                return (
                  <button
                    key={value}
                    className={`category-tab cat-${value}${selectedMode === value ? ' active' : ''}`}
                    aria-pressed={selectedMode === value}
                    type="button"
                    onClick={() => setSelectedMode(value)}
                  >
                    {label}
                    <span className="cat-count">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="date-range-tabs">
              {[['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['all', 'All time']].map(([value, label]) => (
                <button
                  key={value}
                  className={`date-tab${dateRange === value ? ' active' : ''}`}
                  type="button"
                  onClick={() => setDateRange(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="analytics-summary-row">
            <div className="summary-stat">
              <p className="eyebrow">{selectedMode === 'all' ? 'Total intakes' : `${MODE_LABELS[selectedMode]} intakes`}</p>
              <strong>{total}</strong>
            </div>
            <div className="summary-stat">
              <p className="eyebrow">Appointments booked</p>
              <strong>{apptTotal}</strong>
            </div>
            <div className="summary-stat">
              <p className="eyebrow">{stat3Label}</p>
              <strong style={{ color: C.danger }}>{stat3Value}</strong>
            </div>
            <div className="summary-stat">
              <p className="eyebrow">{stat4Label}</p>
              <strong style={{ color: C.warning }}>{stat4Value}</strong>
            </div>
            <div className="summary-stat">
              <p className="eyebrow">Languages</p>
              <strong>{langCount}</strong>
            </div>
          </div>

          <div className="chart-grid">
            {/* Activity — full width, label changes with date range */}
            <div className="chart-card" role="img" aria-label={`Activity over ${activityLabel}`} style={{ gridColumn: '1 / -1' }}>
              <h3>Activity — {activityLabel}</h3>
              {total === 0 && apptTotal === 0 ? <EmptyChart /> : (
                <ResponsiveContainer height={210} width="100%">
                  <LineChart data={volumeData}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="intakes" dot={false} name="Intakes" stroke={C.blue} strokeWidth={2.5} type="monotone" />
                    <Line dataKey="appointments" dot={false} name="Appointments" stroke={C.warning} strokeWidth={2} strokeDasharray="4 2" type="monotone" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Urgency breakdown */}
            <div className="chart-card" role="img" aria-label={`Urgency: ${criticalCount} critical, ${highRiskCount} high-risk`}>
              <h3>Urgency breakdown</h3>
              {urgencyData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer height={210} width="100%">
                  <PieChart>
                    <Pie cx="50%" cy="50%" data={urgencyData} dataKey="value" innerRadius={52} nameKey="name" outerRadius={88}>
                      {urgencyData.map((entry) => (
                        <Cell fill={URGENCY_COLORS[entry.name] ?? C.muted} key={entry.name} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Mode-specific chart */}
            {selectedMode === 'shelter' ? (
              <div className="chart-card" role="img" aria-label="Housing status breakdown">
                <h3>Housing status</h3>
                {housingData.length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer height={210} width="100%">
                    <BarChart data={housingData} layout="vertical">
                      <XAxis allowDecimals={false} tick={{ fontSize: 11 }} type="number" />
                      <YAxis dataKey="name" tick={{ fontSize: 10 }} type="category" width={110} />
                      <Tooltip />
                      <Bar dataKey="count" fill={C.warning} name="Cases" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : selectedMode === 'food_aid' ? (
              <div className="chart-card" role="img" aria-label="Household size breakdown">
                <h3>Household size</h3>
                {householdData.length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer height={210} width="100%">
                    <BarChart data={householdData} layout="vertical">
                      <XAxis allowDecimals={false} tick={{ fontSize: 11 }} type="number" />
                      <YAxis dataKey="name" tick={{ fontSize: 11 }} type="category" width={72} />
                      <Tooltip />
                      <Bar dataKey="count" fill={C.gold} name="Cases" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : selectedMode === 'support_services' ? (
              <div className="chart-card" role="img" aria-label="Help type needed breakdown">
                <h3>Help type needed</h3>
                {helpTypeData.length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer height={210} width="100%">
                    <BarChart data={helpTypeData} layout="vertical">
                      <XAxis allowDecimals={false} tick={{ fontSize: 11 }} type="number" />
                      <YAxis dataKey="name" tick={{ fontSize: 10 }} type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill={C.blueMid} name="Cases" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <div className="chart-card" role="img" aria-label={`Insurance status: ${uninsuredCount} uninsured`}>
                <h3>Insurance status</h3>
                {insuranceData.length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer height={210} width="100%">
                    <PieChart>
                      <Pie cx="50%" cy="50%" data={insuranceData} dataKey="value" innerRadius={52} nameKey="name" outerRadius={88}>
                        {insuranceData.map((entry) => (
                          <Cell fill={INSURANCE_COLORS[entry.name] ?? C.muted} key={entry.name} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {/* Appointments by facility */}
            <div className="chart-card" role="img" aria-label={`Appointments by facility: ${facilityData.length} facilities`}>
              <h3>Appointments by facility</h3>
              {facilityData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer height={210} width="100%">
                  <BarChart data={facilityData} layout="vertical">
                    <XAxis allowDecimals={false} tick={{ fontSize: 11 }} type="number" />
                    <YAxis dataKey="name" tick={{ fontSize: 10 }} type="category" width={130} />
                    <Tooltip />
                    <Bar dataKey="count" fill={C.blue} name="Appointments" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/*
              When a specific mode is selected, "Requests by category" is meaningless
              (you already know the category). Swap it for Languages so the grid stays full.
              When "All categories" is selected, show both Requests by category and Languages.
            */}
            {selectedMode !== 'all' ? (
              <div className="chart-card" role="img" aria-label={`Languages spoken: ${langCount} languages`}>
                <h3>Languages spoken</h3>
                {langData.length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer height={210} width="100%">
                    <BarChart data={langData} layout="vertical">
                      <XAxis allowDecimals={false} tick={{ fontSize: 11 }} type="number" />
                      <YAxis dataKey="name" tick={{ fontSize: 11 }} type="category" width={72} />
                      <Tooltip />
                      <Bar dataKey="count" fill={C.gold} name="Intakes" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <>
                <div className="chart-card" role="img" aria-label="Requests by category">
                  <h3>Requests by category</h3>
                  {allIntakes.length === 0 ? <EmptyChart /> : (
                    <ResponsiveContainer height={210} width="100%">
                      <BarChart data={modeData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                        <Tooltip />
                        <Bar dataKey="count" fill={C.blue} name="Intakes" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="chart-card" role="img" aria-label={`Languages spoken: ${langCount} languages`}>
                  <h3>Languages spoken</h3>
                  {langData.length === 0 ? <EmptyChart /> : (
                    <ResponsiveContainer height={210} width="100%">
                      <BarChart data={langData} layout="vertical">
                        <XAxis allowDecimals={false} tick={{ fontSize: 11 }} type="number" />
                        <YAxis dataKey="name" tick={{ fontSize: 11 }} type="category" width={72} />
                        <Tooltip />
                        <Bar dataKey="count" fill={C.gold} name="Intakes" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {!intakes && !loadError && (
        <div className="empty-state"><p>Loading analytics…</p></div>
      )}
    </main>
  );
}
