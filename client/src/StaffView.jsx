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
    <main className="staff-shell" id="main-content">
      <header className="staff-header">
        <div className="brand-lockup">
          <p className="eyebrow">Accessible Community Intake · Staff</p>
          <h1>CowmunityCare intake queue</h1>
          <p className="brand-tagline">
            Triage live voice intakes: urgency flags, structured fields, and status updates in one queue.
          </p>
        </div>
        <div className={connected ? 'connection is-live' : 'connection'} role="status" aria-live="polite">
          <span />
          {connected ? 'Live' : 'Offline'}
        </div>
      </header>

      <nav className="staff-tabs" aria-label="Staff dashboard sections">
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
          <button type="button" aria-label="Dismiss urgency alert" onClick={() => setAlert(null)}>
            Dismiss
          </button>
        </section>
      )}

      {error && <p className="inline-error" role="alert">{error}</p>}

      <section className="queue-panel">
        <div className="queue-header">
          <div>
            <p className="eyebrow">
              {filters.mode === 'all' ? 'All categories' : filters.mode === 'food_aid' ? 'Food Aid' : filters.mode === 'clinic' ? 'Free Clinic' : filters.mode === 'support_services' ? 'Access & Support' : 'Shelter'}
            </p>
            <h2>Intake requests</h2>
          </div>
          <div className="queue-controls">
            <span className="status-pill">{filteredCards.length} shown · {cards.length} total</span>
            <select aria-label="Sort intake requests" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="time">Newest first</option>
              <option value="urgency">By urgency</option>
              <option value="mode">By mode</option>
            </select>
            <div className="view-toggle">
              <button aria-pressed={viewMode === 'grid'} className={viewMode === 'grid' ? 'is-active' : ''} type="button" onClick={() => setViewMode('grid')}>Grid</button>
              <button aria-pressed={viewMode === 'list'} className={viewMode === 'list' ? 'is-active' : ''} type="button" onClick={() => setViewMode('list')}>List</button>
            </div>
          </div>
        </div>

        <div className="category-tabs">
          {[
            { value: 'all', label: 'All requests' },
            { value: 'clinic', label: 'Free Clinic' },
            { value: 'shelter', label: 'Shelter' },
            { value: 'food_aid', label: 'Food Aid' },
            { value: 'support_services', label: 'Access & Support' },
          ].map(({ value, label }) => {
            const count = value === 'all' ? cards.length : cards.filter((c) => c.mode === value).length;
            return (
              <button
                key={value}
                className={`category-tab cat-${value}${filters.mode === value ? ' active' : ''}`}
                aria-pressed={filters.mode === value}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, mode: value }))}
              >
                {label}
                <span className="cat-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="filter-bar filter-bar-3col">
          <select
            aria-label="Filter by urgency"
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
            aria-label="Filter by status"
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
            aria-label="Search intake requests"
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
