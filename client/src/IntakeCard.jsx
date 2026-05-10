import { useState } from 'react';

const BASE = `http://${window.location.hostname}:3001`;

const BARRIER_TYPES = [
  { value: 'wheelchair', label: 'Wheelchair / mobility' },
  { value: 'elevator', label: 'Elevator broken' },
  { value: 'ramp', label: 'No ramp' },
  { value: 'bathroom', label: 'Inaccessible bathroom' },
  { value: 'interpreter', label: 'No interpreter' },
  { value: 'language', label: 'Language barrier' },
  { value: 'transport', label: 'Transport barrier' },
  { value: 'forms', label: 'Forms inaccessible' },
  { value: 'location', label: 'Inaccessible location' },
  { value: 'other', label: 'Other' },
];

function AccessBadge({ label, ok }) {
  return (
    <span className={`access-badge ${ok ? 'ok' : 'warn'}`}>
      {ok ? '✓' : '!'} {label}
    </span>
  );
}

function CareCircle({ contact, summary }) {
  const [copied, setCopied] = useState(false);

  function notify() {
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }

  return (
    <div className="care-circle">
      <p className="eyebrow">Support contact</p>
      <div className="care-circle-row">
        <div>
          <strong>{contact.name}</strong>
          {contact.relationship && <span className="care-circle-rel"> · {contact.relationship}</span>}
          {contact.phone && <div className="care-circle-phone">{contact.phone}</div>}
        </div>
        <button className="care-circle-notify" type="button" onClick={notify}>
          {copied ? 'Copied!' : 'Copy summary'}
        </button>
      </div>
    </div>
  );
}

function BarrierForm({ resources }) {
  const [open, setOpen] = useState(false);
  const [facilityName, setFacilityName] = useState('');
  const [barrierType, setBarrierType] = useState('wheelchair');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function submit(e) {
    e.preventDefault();
    await fetch(`${BASE}/barriers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facility_name: facilityName, barrier_type: barrierType, notes }),
    });
    setSubmitted(true);
  }

  if (!open) {
    return (
      <button className="barrier-toggle" type="button" onClick={() => setOpen(true)}>
        Report access barrier ↗
      </button>
    );
  }

  if (submitted) {
    return <div className="barrier-form"><p className="barrier-thanks">Barrier reported — thank you.</p></div>;
  }

  const facilityOptions = (resources || [])
    .map((r) => (typeof r === 'string' ? r : r.name))
    .filter(Boolean);

  return (
    <form className="barrier-form" onSubmit={submit}>
      <p className="eyebrow">Report access barrier</p>
      <div className="barrier-form-row">
        {facilityOptions.length > 0 ? (
          <select value={facilityName} onChange={(e) => setFacilityName(e.target.value)}>
            <option value="">Select facility…</option>
            {facilityOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        ) : (
          <input placeholder="Facility name" value={facilityName} onChange={(e) => setFacilityName(e.target.value)} />
        )}
        <select value={barrierType} onChange={(e) => setBarrierType(e.target.value)}>
          {BARRIER_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="barrier-form-actions">
        <button className="barrier-submit" type="submit">Submit</button>
        <button type="button" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}

const urgencyClass = {
  CRITICAL: 'badge badge-critical',
  HIGH: 'badge badge-high',
  MEDIUM: 'badge badge-medium',
  LOW: 'badge badge-low',
};

const modeLabels = {
  clinic: 'Clinic',
  shelter: 'Shelter',
  food_aid: 'Food Aid',
  support_services: 'Access & Support',
};

function humanize(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderValue(value) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value || 'Not collected';
}

export default function IntakeCard({ card, compact = false, onStatusChange }) {
  const urgency = card.urgency || {};
  const patient = card.patient || {};
  const visit = card.visit || {};
  const structuredFields = card.structured_fields || {};
  const resources = card.resource_matches || card.resources || [];
  const level = (urgency.level || card.urgency || 'LOW').toUpperCase();
  const accessNeeds = Array.isArray(card.accessibility_needs)
    ? card.accessibility_needs
    : card.accessibility && card.accessibility !== 'None noted' && card.accessibility !== 'Not collected'
      ? [card.accessibility]
      : [];
  const supportContact = card.support_contact?.name
    ? card.support_contact
    : structuredFields.support_contact_name
      ? { name: structuredFields.support_contact_name, relationship: structuredFields.support_contact_relationship, phone: structuredFields.support_contact_phone }
      : null;
  const summaryForContact = `VoiceBridge intake summary for ${patient.name || structuredFields.full_name || 'patient'}:\n${card.english_summary || ''}\nNext step: ${card.recommended_next_step || ''}\nUrgency: ${level}`;
  const terminalStatus = ['reviewed', 'referred', 'resolved'].includes(card.status);
  const patientName = patient.name || structuredFields.full_name || structuredFields.best_contact_method || 'Unknown';

  if (compact) {
    return (
      <article className="intake-card-list" aria-label={`Intake card for ${patientName}`}>
        <div className="badge-row">
          <span className="mode-badge">{modeLabels[card.mode] || 'Clinic'}</span>
          <span className={urgencyClass[level] || urgencyClass.LOW}>{level}</span>
        </div>
        <div>
          <div className="list-name">{patientName}</div>
          <div className="list-summary">{card.english_summary || card.transcript_summary || 'No summary yet'}</div>
        </div>
        <div className="status-pill">{card.status || 'new'}</div>
        <div className="list-actions">
          {['reviewed', 'referred', 'resolved'].map((s) => (
            <button
              className="list-action-btn"
              disabled={card.status === s || terminalStatus}
              key={s}
              type="button"
              aria-label={`Mark intake for ${patientName} as ${humanize(s)}`}
              onClick={() => onStatusChange(card.id, s)}
            >
              {humanize(s)}
            </button>
          ))}
        </div>
      </article>
    );
  }

  return (
    <article className="intake-card" aria-label={`Intake card for ${patientName}`}>
      <div className="card-topline">
        <div className="badge-row">
          <span className="mode-badge">{modeLabels[card.mode] || 'Clinic'}</span>
          <span className={urgencyClass[level] || urgencyClass.LOW}>{level}</span>
        </div>
        <span className="timestamp">
          {card.timestamp ? new Date(card.timestamp).toLocaleString() : 'Just now'}
        </span>
      </div>

      <div className="patient-row">
        <div>
          <p className="eyebrow">Patient</p>
          <h3>{patientName}</h3>
        </div>
        <div className="status-pill">{card.status || 'new'}</div>
      </div>

      <dl className="intake-grid">
        <div>
          <dt>Language</dt>
          <dd>{patient.language || card.language || 'Unknown'}</dd>
        </div>
        <div>
          <dt>Next step</dt>
          <dd>{card.recommended_next_step || urgency.suggested_next_step || 'Staff review'}</dd>
        </div>
        <div>
          <dt>Primary need</dt>
          <dd>
            {visit.reason ||
              structuredFields.reason_for_visit ||
              structuredFields.bed_or_resource_need ||
              structuredFields.requested_supplies ||
              'Not provided'}
          </dd>
        </div>
        <div>
          <dt>Urgency basis</dt>
          <dd>{(card.red_flags || []).join(', ') || urgency.reasoning || 'No red flags listed'}</dd>
        </div>
      </dl>

      <div className="card-section">
        <p className="eyebrow">English summary</p>
        <p>{card.english_summary || visit.notes || card.notes || 'No summary yet.'}</p>
      </div>

      <div className="next-step">
        <p className="eyebrow">Suggested next step</p>
        <p>{urgency.suggested_next_step || card.recommended_next_step || 'Staff review'}</p>
        {urgency.reasoning && <small>{urgency.reasoning}</small>}
      </div>

      {Object.keys(structuredFields).length > 0 && (
        <div className="structured-fields">
          <p className="eyebrow">Structured fields</p>
          <dl>
            {Object.entries(structuredFields).map(([key, value]) => (
              <div key={key}>
                <dt>{humanize(key)}</dt>
                <dd>{renderValue(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {resources.length > 0 && (
        <div className="resource-list">
          <p className="eyebrow">Resource matches</p>
          {resources.map((resource, index) => (
            <span key={`${resource.name || resource}-${index}`}>
              {typeof resource === 'string' ? resource : `${resource.name} · ${resource.type}`}
            </span>
          ))}
        </div>
      )}

      {accessNeeds.length > 0 && (
        <div className="card-section">
          <p className="eyebrow">Can they actually get help?</p>
          <div className="access-checklist">
            {accessNeeds.map((need, i) => (
              <AccessBadge key={i} label={need} ok={true} />
            ))}
          </div>
        </div>
      )}

      {supportContact && (
        <CareCircle contact={supportContact} summary={summaryForContact} />
      )}

      <BarrierForm resources={resources} />

      <div className="card-meta">
        <span>Insurance: {card.insurance || 'Unknown'}</span>
        <span>Accessibility: {card.accessibility || 'None noted'}</span>
      </div>

      <div className="status-actions">
        {['reviewed', 'referred', 'resolved'].map((status) => (
          <button
            className="review-button"
            disabled={card.status === status}
            key={status}
            type="button"
            aria-label={`Mark intake for ${patientName} as ${humanize(status)}`}
            onClick={() => onStatusChange(card.id, status)}
          >
            {terminalStatus && card.status === status ? humanize(status) : humanize(status)}
          </button>
        ))}
      </div>
    </article>
  );
}
