import { useEffect, useState } from 'react';
import {
  Bar, BarChart, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { NavLink } from 'react-router-dom';

const BASE = `http://${window.location.hostname}:3001`;
const URGENCY_COLORS = { CRITICAL: '#be2020', HIGH: '#d86d1f', MEDIUM: '#b38b08', LOW: '#6b7a74' };
const INSURANCE_COLORS = { Insured: '#3a7d5a', Uninsured: '#be2020', Unknown: '#9aa9a1' };

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
}

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

const MODE_LABELS = { all: 'All categories', clinic: 'Free Clinic', shelter: 'Shelter', food_aid: 'Food Aid' };

export default function AnalyticsView() {
  const [intakes, setIntakes] = useState(null);
  const [appointments, setAppointments] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [selectedMode, setSelectedMode] = useState('all');

  useEffect(() => {
    fetch(`${BASE}/intakes`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => setIntakes(Array.isArray(data) ? data : []))
      .catch((err) => setLoadError(err.message.includes('503') || err.message.includes('fetch')
        ? 'Database is disconnected — whitelist your IP in MongoDB Atlas to load analytics.'
        : `Failed to load intakes: ${err.message}`));

    fetch(`${BASE}/appointments`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => setAppointments([]));
  }, []);

  const allIntakes = intakes ?? [];
  const filteredIntakes = selectedMode === 'all' ? allIntakes : allIntakes.filter((c) => c.mode === selectedMode);

  // Filter appointments by mode using intake_id cross-reference
  const filteredIntakeIds = new Set(filteredIntakes.map((c) => c.id));
  const allAppts = appointments ?? [];
  const filteredAppts = selectedMode === 'all'
    ? allAppts
    : allAppts.filter((a) => a.intake_id && filteredIntakeIds.has(a.intake_id));

  const days = getLast7Days();

  const volumeData = days.map((day) => ({
    date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    intakes: filteredIntakes.filter((c) => c.timestamp && new Date(c.timestamp).toDateString() === day.toDateString()).length,
    appointments: filteredAppts.filter((a) => a.timestamp && new Date(a.timestamp).toDateString() === day.toDateString()).length,
  }));

  const urgencyCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  filteredIntakes.forEach((c) => {
    const level = ((c.urgency?.level || c.urgency) ?? 'LOW').toUpperCase();
    if (level in urgencyCounts) urgencyCounts[level]++;
  });
  const urgencyData = Object.entries(urgencyCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const modeCounts = { clinic: 0, shelter: 0, food_aid: 0 };
  allIntakes.forEach((c) => { if (c.mode in modeCounts) modeCounts[c.mode]++; });
  const modeData = [
    { name: 'Clinic', count: modeCounts.clinic },
    { name: 'Shelter', count: modeCounts.shelter },
    { name: 'Food Aid', count: modeCounts.food_aid },
  ];

  const langMap = {};
  filteredIntakes.forEach((c) => {
    const lang = c.language || c.patient?.language || 'Unknown';
    langMap[lang] = (langMap[lang] || 0) + 1;
  });
  const langData = Object.entries(langMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  // Appointments by facility (filtered by mode)
  const facilityMap = {};
  filteredAppts.forEach((a) => {
    const key = a.facility_name || 'Unassigned';
    facilityMap[key] = (facilityMap[key] || 0) + 1;
  });
  const facilityData = Object.entries(facilityMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  // Insurance status breakdown from filtered intakes
  const insuranceCounts = { Insured: 0, Uninsured: 0, Unknown: 0 };
  filteredIntakes.forEach((c) => {
    const raw = c.structured_fields?.insurance_or_cost_concern || '';
    insuranceCounts[parseInsuranceStatus(raw)]++;
  });
  const insuranceData = Object.entries(insuranceCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const total = filteredIntakes.length;
  const apptTotal = filteredAppts.length;
  const criticalCount = filteredIntakes.filter((c) => ((c.urgency?.level || c.urgency) ?? '').toUpperCase() === 'CRITICAL').length;
  const highRiskCount = filteredIntakes.filter((c) => ['CRITICAL', 'HIGH'].includes(((c.urgency?.level || c.urgency) ?? '').toUpperCase())).length;
  const uninsuredCount = insuranceCounts.Uninsured;
  const langCount = new Set(filteredIntakes.map((c) => c.language || 'Unknown')).size;

  // Shelter-specific: housing status breakdown
  const housingMap = {};
  if (selectedMode === 'shelter' || selectedMode === 'all') {
    filteredIntakes.filter((c) => c.mode === 'shelter').forEach((c) => {
      const val = c.structured_fields?.current_housing_status || 'Not collected';
      housingMap[val] = (housingMap[val] || 0) + 1;
    });
  }
  const housingData = Object.entries(housingMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

  // Food aid-specific: household size distribution
  const householdMap = {};
  if (selectedMode === 'food_aid' || selectedMode === 'all') {
    filteredIntakes.filter((c) => c.mode === 'food_aid').forEach((c) => {
      const val = c.structured_fields?.household_size || 'Unknown';
      householdMap[val] = (householdMap[val] || 0) + 1;
    });
  }
  const householdData = Object.entries(householdMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }));

  return (
    <main className="analytics-shell">
      <header className="staff-header">
        <div>
          <p className="eyebrow">Staff dashboard</p>
          <h1>Intake insights</h1>
        </div>
        <div className="connection is-live"><span />Live</div>
      </header>

      <nav className="staff-tabs">
        <NavLink className={({ isActive }) => isActive ? 'staff-tab active' : 'staff-tab'} end to="/staff">Queue</NavLink>
        <NavLink className={({ isActive }) => isActive ? 'staff-tab active' : 'staff-tab'} to="/staff/appointments">Appointments</NavLink>
        <NavLink className={({ isActive }) => isActive ? 'staff-tab active' : 'staff-tab'} to="/staff/analytics">Analytics</NavLink>
      </nav>

      {loadError && <div className="analytics-error">{loadError}</div>}

      {intakes && (
        <>
          <div className="category-tabs" style={{ marginBottom: '24px' }}>
            {Object.entries(MODE_LABELS).map(([value, label]) => {
              const count = value === 'all' ? allIntakes.length : allIntakes.filter((c) => c.mode === value).length;
              return (
                <button
                  key={value}
                  className={`category-tab cat-${value}${selectedMode === value ? ' active' : ''}`}
                  type="button"
                  onClick={() => setSelectedMode(value)}
                >
                  {label}
                  <span className="cat-count">{count}</span>
                </button>
              );
            })}
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
              <p className="eyebrow">{selectedMode === 'shelter' ? 'High risk cases' : 'Critical alerts'}</p>
              <strong style={{ color: '#be2020' }}>{selectedMode === 'shelter' ? highRiskCount : criticalCount}</strong>
            </div>
            <div className="summary-stat">
              <p className="eyebrow">{selectedMode === 'shelter' ? 'Safety risk flagged' : selectedMode === 'food_aid' ? 'High urgency' : 'Uninsured patients'}</p>
              <strong style={{ color: '#d86d1f' }}>
                {selectedMode === 'shelter'
                  ? filteredIntakes.filter((c) => c.structured_fields?.safety_risk && c.structured_fields.safety_risk !== 'Not collected' && c.structured_fields.safety_risk !== 'No').length
                  : selectedMode === 'food_aid'
                  ? filteredIntakes.filter((c) => ((c.urgency?.level || c.urgency) ?? '').toUpperCase() === 'HIGH').length
                  : uninsuredCount}
              </strong>
            </div>
            <div className="summary-stat">
              <p className="eyebrow">Languages</p>
              <strong>{langCount}</strong>
            </div>
          </div>

          <div className="chart-grid">
            <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
              <h3>Activity — last 7 days</h3>
              {total === 0 && apptTotal === 0 ? <EmptyChart /> : (
                <ResponsiveContainer height={210} width="100%">
                  <LineChart data={volumeData}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="intakes" dot={false} name="Intakes" stroke="#17382d" strokeWidth={2.5} type="monotone" />
                    <Line dataKey="appointments" dot={false} name="Appointments" stroke="#d86d1f" strokeWidth={2} type="monotone" strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="chart-card">
              <h3>Urgency breakdown</h3>
              {urgencyData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer height={210} width="100%">
                  <PieChart>
                    <Pie cx="50%" cy="50%" data={urgencyData} dataKey="value" innerRadius={52} nameKey="name" outerRadius={88}>
                      {urgencyData.map((entry) => (
                        <Cell fill={URGENCY_COLORS[entry.name] ?? '#9aa9a1'} key={entry.name} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {selectedMode === 'shelter' ? (
              <div className="chart-card">
                <h3>Housing status</h3>
                {housingData.length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer height={210} width="100%">
                    <BarChart data={housingData} layout="vertical">
                      <XAxis allowDecimals={false} tick={{ fontSize: 11 }} type="number" />
                      <YAxis dataKey="name" tick={{ fontSize: 10 }} type="category" width={110} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#d86d1f" name="Cases" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : selectedMode === 'food_aid' ? (
              <div className="chart-card">
                <h3>Household size</h3>
                {householdData.length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer height={210} width="100%">
                    <BarChart data={householdData} layout="vertical">
                      <XAxis allowDecimals={false} tick={{ fontSize: 11 }} type="number" />
                      <YAxis dataKey="name" tick={{ fontSize: 11 }} type="category" width={72} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#b38b08" name="Cases" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <div className="chart-card">
                <h3>Insurance status</h3>
                {insuranceData.length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer height={210} width="100%">
                    <PieChart>
                      <Pie cx="50%" cy="50%" data={insuranceData} dataKey="value" innerRadius={52} nameKey="name" outerRadius={88}>
                        {insuranceData.map((entry) => (
                          <Cell fill={INSURANCE_COLORS[entry.name] ?? '#9aa9a1'} key={entry.name} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            <div className="chart-card">
              <h3>Appointments by facility</h3>
              {facilityData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer height={210} width="100%">
                  <BarChart data={facilityData} layout="vertical">
                    <XAxis allowDecimals={false} tick={{ fontSize: 11 }} type="number" />
                    <YAxis dataKey="name" tick={{ fontSize: 10 }} type="category" width={130} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#17382d" name="Appointments" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="chart-card">
              <h3>Requests by category</h3>
              {allIntakes.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer height={210} width="100%">
                  <BarChart data={modeData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#17382d" name="Intakes" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="chart-card">
              <h3>Languages spoken</h3>
              {langData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer height={210} width="100%">
                  <BarChart data={langData} layout="vertical">
                    <XAxis allowDecimals={false} tick={{ fontSize: 11 }} type="number" />
                    <YAxis dataKey="name" tick={{ fontSize: 11 }} type="category" width={72} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#5f776c" name="Intakes" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      {!intakes && !loadError && (
        <div className="empty-state"><p>Loading analytics…</p></div>
      )}
    </main>
  );
}
