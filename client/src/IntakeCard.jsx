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
  const terminalStatus = ['reviewed', 'referred', 'resolved'].includes(card.status);
  const patientName = patient.name || structuredFields.full_name || structuredFields.best_contact_method || 'Unknown';

  if (compact) {
    return (
      <article className="intake-card-list">
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
    <article className="intake-card">
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
            onClick={() => onStatusChange(card.id, status)}
          >
            {terminalStatus && card.status === status ? humanize(status) : humanize(status)}
          </button>
        ))}
      </div>
    </article>
  );
}
