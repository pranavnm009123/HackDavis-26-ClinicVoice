import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { NavLink } from 'react-router-dom';

const URGENCY_COLORS = { CRITICAL: '#be2020', HIGH: '#d86d1f', MEDIUM: '#b38b08', LOW: '#6b7a74' };

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
}

function EmptyChart() {
  return <div className="chart-empty">No data yet</div>;
}

export default function AnalyticsView() {
  const [intakes, setIntakes] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetch(`http://${window.location.hostname}:3001/intakes`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => setIntakes(Array.isArray(data) ? data : []))
      .catch((err) => setLoadError(err.message.includes('503') || err.message.includes('fetch')
        ? 'Database is disconnected — whitelist your IP in MongoDB Atlas to load analytics.'
        : `Failed to load intakes: ${err.message}`));
  }, []);

  const days = getLast7Days();
  const volumeData = (intakes ?? []).length > 0
    ? days.map((day) => ({
        date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: (intakes ?? []).filter((c) => c.timestamp && new Date(c.timestamp).toDateString() === day.toDateString()).length,
      }))
    : days.map((day) => ({ date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: 0 }));

  const urgencyCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  (intakes ?? []).forEach((c) => {
    const level = ((c.urgency?.level || c.urgency) ?? 'LOW').toUpperCase();
    if (level in urgencyCounts) urgencyCounts[level]++;
  });
  const urgencyData = Object.entries(urgencyCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const modeCounts = { clinic: 0, shelter: 0, food_aid: 0 };
  (intakes ?? []).forEach((c) => { if (c.mode in modeCounts) modeCounts[c.mode]++; });
  const modeData = [
    { name: 'Clinic', count: modeCounts.clinic },
    { name: 'Shelter', count: modeCounts.shelter },
    { name: 'Food Aid', count: modeCounts.food_aid },
  ];

  const langMap = {};
  (intakes ?? []).forEach((c) => {
    const lang = c.language || c.patient?.language || 'Unknown';
    langMap[lang] = (langMap[lang] || 0) + 1;
  });
  const langData = Object.entries(langMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  const total = intakes?.length ?? 0;
  const criticalCount = (intakes ?? []).filter((c) => ((c.urgency?.level || c.urgency) ?? '').toUpperCase() === 'CRITICAL').length;
  const langCount = new Set((intakes ?? []).map((c) => c.language || 'Unknown')).size;
  const pendingCount = (intakes ?? []).filter((c) => c.status === 'new').length;

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
        <NavLink className={({ isActive }) => isActive ? 'staff-tab active' : 'staff-tab'} to="/staff/analytics">Analytics</NavLink>
      </nav>

      {loadError && <div className="analytics-error">{loadError}</div>}

      {intakes && (
        <>
          <div className="analytics-summary-row">
            <div className="summary-stat">
              <p className="eyebrow">Total intakes</p>
              <strong>{total}</strong>
            </div>
            <div className="summary-stat">
              <p className="eyebrow">Pending review</p>
              <strong>{pendingCount}</strong>
            </div>
            <div className="summary-stat">
              <p className="eyebrow">Critical alerts</p>
              <strong style={{ color: '#be2020' }}>{criticalCount}</strong>
            </div>
            <div className="summary-stat">
              <p className="eyebrow">Languages</p>
              <strong>{langCount}</strong>
            </div>
          </div>

          <div className="chart-grid">
            <div className="chart-card">
              <h3>Intakes — last 7 days</h3>
              {total === 0 ? <EmptyChart /> : (
                <ResponsiveContainer height={210} width="100%">
                  <LineChart data={volumeData}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                    <Tooltip />
                    <Line dataKey="count" dot={false} name="Intakes" stroke="#17382d" strokeWidth={2.5} type="monotone" />
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

            <div className="chart-card">
              <h3>Mode distribution</h3>
              {total === 0 ? <EmptyChart /> : (
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
