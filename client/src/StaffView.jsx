import { useCallback, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import IntakeCard from './IntakeCard.jsx';
import { useSocket } from './useSocket.js';

const URGENCY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default function StaffView() {
  const [cards, setCards] = useState([]);
  const [alert, setAlert] = useState(null);
  const [filters, setFilters] = useState({ mode: 'all', urgency: 'all', status: 'all', search: '' });
  const [sortBy, setSortBy] = useState('time');
  const [viewMode, setViewMode] = useState('grid');

  const handleSocketMessage = useCallback((message) => {
    if (message.type === 'INTAKE_SNAPSHOT') {
      setCards(message.cards || []);
    }

    if (message.type === 'NEW_INTAKE') {
      setCards((current) => [message.card, ...current]);
    }

    if (message.type === 'INTAKE_UPDATED') {
      setCards((current) =>
        current.map((card) =>
          card.id === message.card.id ? message.card : card,
        ),
      );
    }

    if (message.type === 'URGENCY_ALERT') {
      setAlert(message);
    }
  }, []);

  const { connected, send, error } = useSocket('/ws/staff', {
    onMessage: handleSocketMessage,
  });

  const filteredCards = useMemo(() => {
    const q = filters.search.toLowerCase();
    let result = cards.filter((card) => {
      const urgency = (card.urgency?.level || card.urgency || 'LOW').toUpperCase();
      const searchable = [
        card.patient?.name,
        card.structured_fields?.full_name,
        card.english_summary,
        card.language,
        card.patient?.language,
      ].filter(Boolean).join(' ').toLowerCase();
      return (
        (filters.mode === 'all' || card.mode === filters.mode) &&
        (filters.urgency === 'all' || urgency === filters.urgency) &&
        (filters.status === 'all' || card.status === filters.status) &&
        (!q || searchable.includes(q))
      );
    });
    if (sortBy === 'urgency') {
      result = [...result].sort((a, b) => {
        const ua = (a.urgency?.level || a.urgency || 'LOW').toUpperCase();
        const ub = (b.urgency?.level || b.urgency || 'LOW').toUpperCase();
        return (URGENCY_ORDER[ua] ?? 3) - (URGENCY_ORDER[ub] ?? 3);
      });
    } else if (sortBy === 'mode') {
      result = [...result].sort((a, b) => (a.mode || '').localeCompare(b.mode || ''));
    } else {
      result = [...result].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    return result;
  }, [cards, filters, sortBy]);

  function updateStatus(id, status) {
    setCards((current) =>
      current.map((card) =>
        card.id === id ? { ...card, status } : card,
      ),
    );
    send({ type: 'UPDATE_STATUS', id, status });
  }

  return (
    <main className="staff-shell">
      <header className="staff-header">
        <div>
          <p className="eyebrow">Staff dashboard</p>
          <h1>VoiceBridge intake queue</h1>
        </div>
        <div className={connected ? 'connection is-live' : 'connection'}>
          <span />
          {connected ? 'Live' : 'Offline'}
        </div>
      </header>

      <nav className="staff-tabs">
        <NavLink className={({ isActive }) => isActive ? 'staff-tab active' : 'staff-tab'} end to="/staff">Queue</NavLink>
        <NavLink className={({ isActive }) => isActive ? 'staff-tab active' : 'staff-tab'} to="/staff/appointments">Appointments</NavLink>
        <NavLink className={({ isActive }) => isActive ? 'staff-tab active' : 'staff-tab'} to="/staff/analytics">Analytics</NavLink>
      </nav>

      {alert && (
        <section className="alert-banner" role="alert">
          <div>
            <p className="eyebrow">Urgency alert</p>
            <h2>{alert.mode || 'clinic'} · {alert.level}: {alert.reason}</h2>
            <p>{(alert.symptoms || []).join(', ') || 'Symptoms pending'}</p>
          </div>
          <button type="button" onClick={() => setAlert(null)}>
            Dismiss
          </button>
        </section>
      )}

      {error && <p className="inline-error">{error}</p>}

      <section className="queue-panel">
        <div className="queue-header">
          <div>
            <p className="eyebrow">Universal case records</p>
            <h2>Intake cards</h2>
          </div>
          <div className="queue-controls">
            <span className="status-pill">{filteredCards.length} shown · {cards.length} total</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="time">Newest first</option>
              <option value="urgency">By urgency</option>
              <option value="mode">By mode</option>
            </select>
            <div className="view-toggle">
              <button className={viewMode === 'grid' ? 'is-active' : ''} type="button" onClick={() => setViewMode('grid')}>Grid</button>
              <button className={viewMode === 'list' ? 'is-active' : ''} type="button" onClick={() => setViewMode('list')}>List</button>
            </div>
          </div>
        </div>

        <div className="filter-bar">
          <select
            value={filters.mode}
            onChange={(event) => setFilters((current) => ({ ...current, mode: event.target.value }))}
          >
            <option value="all">All modes</option>
            <option value="clinic">Clinic</option>
            <option value="shelter">Shelter</option>
            <option value="food_aid">Food aid</option>
          </select>
          <select
            value={filters.urgency}
            onChange={(event) => setFilters((current) => ({ ...current, urgency: event.target.value }))}
          >
            <option value="all">All urgency</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="referred">Referred</option>
            <option value="resolved">Resolved</option>
          </select>
          <input
            placeholder="Search name, summary, language…"
            type="search"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
        </div>

        {filteredCards.length === 0 ? (
          <div className="empty-state">
            <p>No intake cards yet.</p>
            <span>Clinic, shelter, and food-aid records appear here in real time.</span>
          </div>
        ) : viewMode === 'list' ? (
          <div className="cards-list">
            {filteredCards.map((card) => (
              <IntakeCard
                compact
                key={card.id}
                card={card}
                onStatusChange={updateStatus}
              />
            ))}
          </div>
        ) : (
          <div className="cards-grid">
            {filteredCards.map((card) => (
              <IntakeCard
                key={card.id}
                card={card}
                onStatusChange={updateStatus}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
