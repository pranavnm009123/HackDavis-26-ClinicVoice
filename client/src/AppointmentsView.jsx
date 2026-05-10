import { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSocket } from './useSocket.js';

const URGENCY_COLORS = { CRITICAL: '#be2020', HIGH: '#d86d1f', MEDIUM: '#b38b08', LOW: '#3a7d5a' };
const TYPE_LABELS = {
  nurse_triage: 'Nurse Triage',
  clinic_review: 'Clinic Review',
  interpreter: 'Interpreter',
  social_worker: 'Social Worker',
  emergency_escalation: 'Emergency',
};
const TIME_ORDER = { ASAP: 0, Today: 1, 'Within 48h': 2, 'This week': 3 };

const EMPTY_FORM = {
  patient_name: '',
  appointment_type: 'clinic_review',
  urgency: 'MEDIUM',
  reason: '',
  suggested_time: 'This week',
  notes: '',
};

export default function AppointmentsView() {
  const [appointments, setAppointments] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');

  useEffect(() => {
    fetch(`http://${window.location.hostname}:3001/appointments`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch((e) => setLoadError(e.message));
  }, []);

  const handleSocketMessage = useCallback((message) => {
    if (message.type === 'NEW_APPOINTMENT') {
      setAppointments((cur) => [message.appointment, ...cur]);
    }
    if (message.type === 'APPOINTMENT_UPDATED') {
      setAppointments((cur) =>
        cur.map((a) => (a.id === message.appointment.id ? message.appointment : a)),
      );
    }
  }, []);

  const { connected } = useSocket('/ws/staff', { onMessage: handleSocketMessage });

  async function updateStatus(id, status) {
    setAppointments((cur) => cur.map((a) => (a.id === id ? { ...a, status } : a)));
    await fetch(`http://${window.location.hostname}:3001/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:3001/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm(EMPTY_FORM);
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  const filtered = appointments
    .filter((a) => (filterStatus === 'all' || a.status === filterStatus) &&
                   (filterUrgency === 'all' || a.urgency === filterUrgency))
    .sort((a, b) => (TIME_ORDER[a.suggested_time] ?? 9) - (TIME_ORDER[b.suggested_time] ?? 9));

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

      <section className="queue-panel">
        <div className="queue-header">
          <div>
            <p className="eyebrow">Bot-suggested + staff-added</p>
            <h2>Appointments</h2>
          </div>
          <button className="add-appt-btn" type="button" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Add appointment'}
          </button>
        </div>

        {showForm && (
          <form className="appt-form" onSubmit={handleAdd}>
            <div className="appt-form-grid">
              <label>
                Patient name
                <input required value={form.patient_name} onChange={(e) => setForm((f) => ({ ...f, patient_name: e.target.value }))} />
              </label>
              <label>
                Type
                <select value={form.appointment_type} onChange={(e) => setForm((f) => ({ ...f, appointment_type: e.target.value }))}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label>
                Urgency
                <select value={form.urgency} onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}>
                  {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>
              <label>
                Suggested time
                <select value={form.suggested_time} onChange={(e) => setForm((f) => ({ ...f, suggested_time: e.target.value }))}>
                  {['ASAP', 'Today', 'Within 48h', 'This week'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="appt-form-wide">
                Reason
                <input required value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
              </label>
              <label className="appt-form-wide">
                Notes
                <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </label>
            </div>
            <button className="start-session-button" disabled={saving} type="submit">
              {saving ? 'Saving…' : 'Save appointment'}
            </button>
          </form>
        )}

        <div className="filter-bar">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={filterUrgency} onChange={(e) => setFilterUrgency(e.target.value)}>
            <option value="all">All urgency</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {loadError && <p className="inline-error">{loadError}</p>}

        {filtered.length === 0 ? (
          <div className="empty-state"><p>No appointments yet.</p></div>
        ) : (
          <div className="appt-table-wrap">
            <table className="appt-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Urgency</th>
                  <th>Reason</th>
                  <th>When</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className={a.source === 'bot' ? 'appt-row bot-row' : 'appt-row'}>
                    <td className="appt-name">{a.patient_name}</td>
                    <td>{TYPE_LABELS[a.appointment_type] || a.appointment_type}</td>
                    <td>
                      <span className="urgency-chip" style={{ background: URGENCY_COLORS[a.urgency] }}>
                        {a.urgency}
                      </span>
                    </td>
                    <td className="appt-reason">{a.reason}{a.notes ? <span className="appt-notes"> — {a.notes}</span> : ''}</td>
                    <td className="appt-time">{a.suggested_time}</td>
                    <td>
                      <span className={`source-chip ${a.source}`}>{a.source === 'bot' ? 'Bot' : 'Staff'}</span>
                    </td>
                    <td>
                      <span className={`appt-status ${a.status}`}>{a.status}</span>
                    </td>
                    <td className="appt-actions">
                      {a.status === 'pending' && (
                        <button type="button" onClick={() => updateStatus(a.id, 'confirmed')}>Confirm</button>
                      )}
                      {a.status === 'confirmed' && (
                        <button type="button" onClick={() => updateStatus(a.id, 'completed')}>Complete</button>
                      )}
                      {a.status !== 'cancelled' && a.status !== 'completed' && (
                        <button className="cancel-btn" type="button" onClick={() => updateStatus(a.id, 'cancelled')}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
