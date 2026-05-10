import { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSocket } from './useSocket.js';

const BASE = `http://${window.location.hostname}:3001`;
const URGENCY_COLORS = { CRITICAL: '#9f1d20', HIGH: '#b84f0a', MEDIUM: '#f5c242', LOW: '#1f6b3a' };
const SPEC_LABELS = {
  general_practice: 'General Practice',
  cardiology: 'Cardiology',
  social_work: 'Social Work',
  pediatrics: 'Pediatrics',
  psychiatry: 'Psychiatry',
  interpreter: 'Interpreter',
};
const FACILITY_TYPE_LABELS = {
  hospital: 'Hospital',
  free_clinic: 'Healthcare',
  urgent_care: 'Urgent Care',
  shelter: 'Housing',
  food_bank: 'Hunger',
  pharmacy: 'Pharmacy',
};
const FACILITY_TYPE_COLORS = {
  hospital: '#be2020',
  free_clinic: '#0d274e',
  urgent_care: '#0d274e',
  shelter: '#0d274e',
  food_bank: '#f5c242',
  pharmacy: '#0d274e',
};

function chipTextColor(levelOrType) {
  return ['CRITICAL', 'HIGH', 'LOW', 'hospital', 'free_clinic', 'urgent_care', 'shelter', 'pharmacy'].includes(levelOrType) ? '#ffffff' : '#0d274e';
}

const EMPTY_DOCTOR = { name: '', specialization: 'general_practice', phone: '', location: '', facility_id: '' };
const EMPTY_SLOT = { date: '', time: '' };
const EMPTY_FACILITY = { name: '', type: 'free_clinic', address: '', city: '', zip: '', phone: '', hours: '' };

export default function AppointmentsView() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState('bookings');

  // Add doctor form
  const [doctorForm, setDoctorForm] = useState(EMPTY_DOCTOR);
  const [slots, setSlots] = useState([{ ...EMPTY_SLOT }]);
  const [savingDoctor, setSavingDoctor] = useState(false);
  const [doctorSuccess, setDoctorSuccess] = useState('');

  // Add facility form
  const [facilityForm, setFacilityForm] = useState(EMPTY_FACILITY);
  const [savingFacility, setSavingFacility] = useState(false);
  const [facilitySuccess, setFacilitySuccess] = useState('');

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');

  useEffect(() => {
    fetch(`${BASE}/appointments`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch((e) => setLoadError(e.message));

    fetch(`${BASE}/doctors`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => setDoctors(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch(`${BASE}/facilities`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => setFacilities(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleSocketMessage = useCallback((message) => {
    if (message.type === 'NEW_APPOINTMENT') {
      setAppointments((c) => {
        if (c.some((a) => a.id === message.appointment.id)) return c;
        return [message.appointment, ...c];
      });
    }
    if (message.type === 'APPOINTMENT_UPDATED') setAppointments((c) => c.map((a) => a.id === message.appointment.id ? message.appointment : a));
    if (message.type === 'SLOT_ADDED') {
      setDoctors((c) => c.map((d) => d.id === message.slot.doctor_id ? { ...d, slots: [...(d.slots || []), message.slot] } : d));
    }
    if (message.type === 'SLOT_BOOKED') {
      setDoctors((c) => c.map((d) => d.id === message.doctor_id
        ? { ...d, slots: (d.slots || []).map((s) => s.id === message.slot_id ? { ...s, booked: true } : s) }
        : d));
    }
    if (message.type === 'NEW_FACILITY') {
      setFacilities((c) => [...c, message.facility]);
    }
  }, []);

  const { connected } = useSocket('/ws/staff', { onMessage: handleSocketMessage });

  async function updateStatus(id, status) {
    setAppointments((c) => c.map((a) => a.id === id ? { ...a, status } : a));
    await fetch(`${BASE}/appointments/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }

  async function handleAddDoctor(e) {
    e.preventDefault();
    setSavingDoctor(true);
    setDoctorSuccess('');
    try {
      const res = await fetch(`${BASE}/doctors`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctorForm),
      });
      const doctor = await res.json();
      const validSlots = slots.filter((s) => s.date && s.time);
      await Promise.all(validSlots.map((s) =>
        fetch(`${BASE}/doctors/${doctor.id}/slots`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(s),
        })
      ));
      const fullRes = await fetch(`${BASE}/doctors`);
      setDoctors(await fullRes.json());
      setDoctorForm(EMPTY_DOCTOR);
      setSlots([{ ...EMPTY_SLOT }]);
      setDoctorSuccess(`Dr. ${doctor.name} added with ${validSlots.length} slot(s).`);
    } finally { setSavingDoctor(false); }
  }

  async function handleAddFacility(e) {
    e.preventDefault();
    setSavingFacility(true);
    setFacilitySuccess('');
    try {
      const res = await fetch(`${BASE}/facilities`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facilityForm),
      });
      const facility = await res.json();
      setFacilityForm(EMPTY_FACILITY);
      setFacilitySuccess(`${facility.name} added successfully.`);
    } finally { setSavingFacility(false); }
  }

  async function handleAddSlot(doctorId) {
    const date = prompt('Date (YYYY-MM-DD):');
    const time = prompt('Time (e.g. 2:00 PM):');
    if (!date || !time) return;
    await fetch(`${BASE}/doctors/${doctorId}/slots`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, time }),
    });
    const res = await fetch(`${BASE}/doctors`);
    setDoctors(await res.json());
  }

  const filtered = appointments.filter((a) =>
    (filterStatus === 'all' || a.status === filterStatus) &&
    (filterUrgency === 'all' || a.urgency === filterUrgency)
  ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const facilityMap = Object.fromEntries(facilities.map((f) => [f.id, f]));

  return (
    <main className="staff-shell" id="main-content">
      <header className="staff-header">
        <div><p className="eyebrow">Staff dashboard</p><h1>CowmunityCare intake queue</h1></div>
        <div className={connected ? 'connection is-live' : 'connection'} role="status" aria-live="polite"><span />{connected ? 'Live' : 'Offline'}</div>
      </header>

      <nav className="staff-tabs" aria-label="Staff dashboard sections">
        <NavLink className={({ isActive }) => isActive ? 'staff-tab active' : 'staff-tab'} end to="/staff">Queue</NavLink>
        <NavLink className={({ isActive }) => isActive ? 'staff-tab active' : 'staff-tab'} to="/staff/appointments">Appointments</NavLink>
        <NavLink className={({ isActive }) => isActive ? 'staff-tab active' : 'staff-tab'} to="/staff/analytics">Analytics</NavLink>
      </nav>

      <div className="appt-page-tabs">
        <button aria-pressed={activeTab === 'bookings'} className={activeTab === 'bookings' ? 'appt-page-tab active' : 'appt-page-tab'} type="button" onClick={() => setActiveTab('bookings')}>
          Booked appointments <span className="appt-count">{appointments.length}</span>
        </button>
        <button aria-pressed={activeTab === 'doctors'} className={activeTab === 'doctors' ? 'appt-page-tab active' : 'appt-page-tab'} type="button" onClick={() => setActiveTab('doctors')}>
          Doctors &amp; availability <span className="appt-count">{doctors.length}</span>
        </button>
        <button aria-pressed={activeTab === 'facilities'} className={activeTab === 'facilities' ? 'appt-page-tab active' : 'appt-page-tab'} type="button" onClick={() => setActiveTab('facilities')}>
          Facilities <span className="appt-count">{facilities.length}</span>
        </button>
        <button aria-pressed={activeTab === 'add'} className={activeTab === 'add' ? 'appt-page-tab active' : 'appt-page-tab'} type="button" onClick={() => setActiveTab('add')}>
          + Add doctor
        </button>
        <button aria-pressed={activeTab === 'add-facility'} className={activeTab === 'add-facility' ? 'appt-page-tab active' : 'appt-page-tab'} type="button" onClick={() => setActiveTab('add-facility')}>
          + Add facility
        </button>
      </div>

      {activeTab === 'bookings' && (
        <section className="queue-panel">
          <div className="queue-header">
            <div><p className="eyebrow">Bot-confirmed patient appointments</p><h2>Bookings</h2></div>
          </div>
          <div className="filter-bar">
            <select aria-label="Filter appointments by status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select aria-label="Filter appointments by urgency" value={filterUrgency} onChange={(e) => setFilterUrgency(e.target.value)}>
              <option value="all">All urgency</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          {loadError && <p className="inline-error" role="alert">{loadError}</p>}
          {filtered.length === 0 ? (
            <div className="empty-state"><p>No appointments yet. They appear here when the bot books one with a patient.</p></div>
          ) : (
            <div className="appt-table-wrap">
              <table className="appt-table">
                <caption className="sr-only">Booked appointments with patient, doctor, facility, urgency, status, and available actions.</caption>
                <thead><tr>
                  <th>Patient</th><th>Doctor</th><th>Specialization</th>
                  <th>Facility</th><th>Date</th><th>Time</th>
                  <th>Urgency</th><th>Reason</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map((a) => {
                    const facility = facilityMap[a.facility_id];
                    const facilityLabel = a.facility_name || facility?.name || a.location || '—';
                    const facilityCity = facility?.city || '';
                    return (
                      <tr key={a.id} className="appt-row bot-row">
                        <td className="appt-name">{a.patient_name}</td>
                        <td>{a.doctor_name || '—'}</td>
                        <td>{SPEC_LABELS[a.specialization] || a.specialization || '—'}</td>
                        <td>
                          <span className="facility-cell">
                            {facilityLabel}
                            {facilityCity && facilityLabel !== facilityCity && <span className="facility-city">{facilityCity}</span>}
                          </span>
                        </td>
                        <td className="appt-time">{a.slot_date || '—'}</td>
                        <td className="appt-time">{a.slot_time || '—'}</td>
                        <td><span className="urgency-chip" style={{ background: URGENCY_COLORS[a.urgency], color: chipTextColor(a.urgency) }}>{a.urgency}</span></td>
                        <td className="appt-reason">{a.reason}</td>
                        <td><span className={`appt-status ${a.status}`}>{a.status}</span></td>
                        <td className="appt-actions">
                          {a.status === 'confirmed' && <button type="button" aria-label={`Mark appointment for ${a.patient_name} complete`} onClick={() => updateStatus(a.id, 'completed')}>Complete</button>}
                          {a.status !== 'cancelled' && a.status !== 'completed' && <button className="cancel-btn" type="button" aria-label={`Cancel appointment for ${a.patient_name}`} onClick={() => updateStatus(a.id, 'cancelled')}>Cancel</button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'doctors' && (
        <section className="queue-panel">
          <div className="queue-header">
            <div><p className="eyebrow">Available doctors and open slots</p><h2>Doctor availability</h2></div>
          </div>
          {doctors.length === 0 ? (
            <div className="empty-state"><p>No doctors added yet.</p></div>
          ) : (
            <div className="doctor-grid">
              {doctors.map((d) => {
                const available = (d.slots || []).filter((s) => !s.booked);
                const booked = (d.slots || []).filter((s) => s.booked);
                const facility = facilityMap[d.facility_id];
                return (
                  <div key={d.id} className="doctor-card">
                    <div className="doctor-card-header">
                      <div>
                        <p className="doctor-name">{d.name}</p>
                        <p className="doctor-spec">{SPEC_LABELS[d.specialization] || d.specialization}</p>
                        <p className="doctor-meta">
                          {facility ? <><strong>{facility.name}</strong> · {facility.city}</> : d.location}
                          {d.phone ? ` · ${d.phone}` : ''}
                        </p>
                      </div>
                      <div className="slot-counts">
                        <span className="slot-available">{available.length} open</span>
                        <span className="slot-booked">{booked.length} booked</span>
                      </div>
                    </div>
                    <div className="slot-list">
                      {available.slice(0, 6).map((s) => (
                        <span key={s.id} className="slot-chip available">{s.date} {s.time}</span>
                      ))}
                      {available.length > 6 && <span className="slot-chip more">+{available.length - 6} more</span>}
                      {available.length === 0 && <span className="slot-chip none">No open slots</span>}
                    </div>
                    <button className="add-slot-btn" type="button" onClick={() => handleAddSlot(d.id)}>+ Add slot</button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === 'facilities' && (
        <section className="queue-panel">
          <div className="queue-header">
            <div><p className="eyebrow">Hospitals, clinics, shelters, and more</p><h2>Facility network</h2></div>
          </div>
          {facilities.length === 0 ? (
            <div className="empty-state"><p>No facilities added yet.</p></div>
          ) : (
            <div className="doctor-grid">
              {facilities.map((f) => {
                const docCount = doctors.filter((d) => d.facility_id === f.id).length;
                return (
                  <div key={f.id} className="doctor-card">
                    <div className="doctor-card-header">
                      <div>
                        <p className="doctor-name">{f.name}</p>
                        <p className="doctor-spec">
                          <span
                            className="urgency-chip"
                            style={{ background: FACILITY_TYPE_COLORS[f.type] || '#8fa4b8', color: chipTextColor(f.type), fontSize: 11 }}
                          >
                            {FACILITY_TYPE_LABELS[f.type] || f.type}
                          </span>
                        </p>
                        <p className="doctor-meta">{f.address}, {f.city}{f.zip ? ` ${f.zip}` : ''}</p>
                        <p className="doctor-meta">{f.phone}{f.hours ? ` · ${f.hours}` : ''}</p>
                      </div>
                      <div className="slot-counts">
                        <span className="slot-available">{docCount} doctor{docCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === 'add' && (
        <section className="queue-panel">
          <div className="queue-header">
            <div><p className="eyebrow">Add to doctor roster</p><h2>New doctor</h2></div>
          </div>
          <form className="appt-form" onSubmit={handleAddDoctor}>
            <div className="appt-form-grid">
              <label>Name<input required placeholder="Dr. Full Name" value={doctorForm.name} onChange={(e) => setDoctorForm((f) => ({ ...f, name: e.target.value }))} /></label>
              <label>Specialization
                <select value={doctorForm.specialization} onChange={(e) => setDoctorForm((f) => ({ ...f, specialization: e.target.value }))}>
                  {Object.entries(SPEC_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label>Facility
                <select value={doctorForm.facility_id} onChange={(e) => setDoctorForm((f) => ({ ...f, facility_id: e.target.value }))}>
                  <option value="">— Select facility —</option>
                  {facilities.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.city})</option>)}
                </select>
              </label>
              <label>Room / Office<input placeholder="Room 204" value={doctorForm.location} onChange={(e) => setDoctorForm((f) => ({ ...f, location: e.target.value }))} /></label>
              <label>Phone<input placeholder="(530) 555-0100" value={doctorForm.phone} onChange={(e) => setDoctorForm((f) => ({ ...f, phone: e.target.value }))} /></label>
            </div>

            <p className="eyebrow" style={{ marginTop: 16 }}>Available time slots</p>
            {slots.map((slot, i) => (
              <div key={i} className="slot-row">
                <input aria-label={`Slot ${i + 1} date`} type="date" value={slot.date} onChange={(e) => setSlots((s) => s.map((x, j) => j === i ? { ...x, date: e.target.value } : x))} />
                <input aria-label={`Slot ${i + 1} time`} placeholder="2:00 PM" value={slot.time} onChange={(e) => setSlots((s) => s.map((x, j) => j === i ? { ...x, time: e.target.value } : x))} />
                {slots.length > 1 && <button type="button" className="cancel-btn" aria-label={`Remove slot ${i + 1}`} onClick={() => setSlots((s) => s.filter((_, j) => j !== i))}>✕</button>}
              </div>
            ))}
            {doctorSuccess && <p className="user-error" role="status" style={{ color: '#154872' }}>{doctorSuccess}</p>}
            <div className="doctor-form-actions">
              <button type="button" className="add-slot-inline" onClick={() => setSlots((s) => [...s, { ...EMPTY_SLOT }])}>+ Add another slot</button>
              <button className="start-session-button doctor-save-button" disabled={savingDoctor} type="submit">
                {savingDoctor ? 'Saving…' : 'Save doctor'}
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === 'add-facility' && (
        <section className="queue-panel">
          <div className="queue-header">
            <div><p className="eyebrow">Expand the facility network</p><h2>New facility</h2></div>
          </div>
          <form className="appt-form" onSubmit={handleAddFacility}>
            <div className="appt-form-grid">
              <label>Facility name<input required placeholder="Sutter Davis Hospital" value={facilityForm.name} onChange={(e) => setFacilityForm((f) => ({ ...f, name: e.target.value }))} /></label>
              <label>Type
                <select value={facilityForm.type} onChange={(e) => setFacilityForm((f) => ({ ...f, type: e.target.value }))}>
                  {Object.entries(FACILITY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label>Street address<input placeholder="2000 Sycamore Lane" value={facilityForm.address} onChange={(e) => setFacilityForm((f) => ({ ...f, address: e.target.value }))} /></label>
              <label>City<input placeholder="Davis" value={facilityForm.city} onChange={(e) => setFacilityForm((f) => ({ ...f, city: e.target.value }))} /></label>
              <label>ZIP<input placeholder="95616" value={facilityForm.zip} onChange={(e) => setFacilityForm((f) => ({ ...f, zip: e.target.value }))} /></label>
              <label>Phone<input placeholder="(530) 756-6440" value={facilityForm.phone} onChange={(e) => setFacilityForm((f) => ({ ...f, phone: e.target.value }))} /></label>
              <label style={{ gridColumn: '1 / -1' }}>Hours<input placeholder="ER: 24/7 · Clinics: Mon-Fri 8 AM-5 PM" value={facilityForm.hours} onChange={(e) => setFacilityForm((f) => ({ ...f, hours: e.target.value }))} /></label>
            </div>
            {facilitySuccess && <p className="user-error" role="status" style={{ color: '#154872' }}>{facilitySuccess}</p>}
            <button className="start-session-button" disabled={savingFacility} type="submit" style={{ marginTop: 16 }}>
              {savingFacility ? 'Saving…' : 'Save facility'}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
