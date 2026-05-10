import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth.jsx';

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'];
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'zh', label: 'Chinese (Mandarin)' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'tl', label: 'Tagalog' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ru', label: 'Russian' },
  { value: 'fa', label: 'Farsi / Persian' },
  { value: 'hmn', label: 'Hmong' },
  { value: 'other', label: 'Other' },
];

function Section({ title, children, danger }) {
  return (
    <div className={`settings-section${danger ? ' settings-danger' : ''}`}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function useSection(initial) {
  const [fields, setFields] = useState(initial);
  const [status, setStatus] = useState(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  return { fields, setFields, status, setStatus, err, setErr, saving, setSaving };
}

export default function SettingsPage() {
  const { user, isLoggedIn, updateProfile, changePassword, changeEmail, logout } = useAuth();
  const navigate = useNavigate();
  const p = user?.profile ?? {};

  const personal = useSection({
    name: p.name || '',
    phone: p.phone || '',
    dateOfBirth: p.dateOfBirth || '',
    bloodGroup: p.bloodGroup || '',
    preferredLanguage: p.preferredLanguage || 'en',
    address: p.address || '',
  });

  const insurance = useSection({
    provider: p.insurance?.provider || '',
    plan: p.insurance?.plan || '',
    memberId: p.insurance?.memberId || '',
  });

  const health = useSection({
    mobilityNeeds: p.mobilityNeeds || '',
    usesWheelchair: p.usesWheelchair ?? false,
    mobilityLevel: p.mobilityLevel || '',
    walkingLimitMeters: p.walkingLimitMeters || '',
    allergies: p.allergies || '',
  });

  const emergency = useSection({
    name: p.emergencyContact?.name || '',
    phone: p.emergencyContact?.phone || '',
    relationship: p.emergencyContact?.relationship || '',
  });

  const pwForm = useSection({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const emailForm = useSection({ newEmail: user?.email || '', password: '' });

  if (!isLoggedIn) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Settings</h1>
          <p className="auth-subtitle">You need to be logged in to view settings.</p>
          <Link to="/login"><button className="auth-submit" type="button">Log in</button></Link>
        </div>
      </div>
    );
  }

  async function saveSection(s, payload) {
    s.setErr('');
    s.setStatus(null);
    s.setSaving(true);
    try {
      await updateProfile(payload);
      s.setStatus('Saved!');
    } catch (e) {
      s.setErr(e.message);
    } finally {
      s.setSaving(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    pwForm.setErr('');
    pwForm.setStatus(null);
    if (pwForm.fields.newPassword !== pwForm.fields.confirmPassword) {
      pwForm.setErr('New passwords do not match');
      return;
    }
    pwForm.setSaving(true);
    try {
      await changePassword(pwForm.fields.currentPassword, pwForm.fields.newPassword);
      pwForm.setStatus('Password updated!');
      pwForm.setFields({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      pwForm.setErr(e.message);
    } finally {
      pwForm.setSaving(false);
    }
  }

  async function saveEmail(e) {
    e.preventDefault();
    emailForm.setErr('');
    emailForm.setStatus(null);
    emailForm.setSaving(true);
    try {
      await changeEmail(emailForm.fields.newEmail, emailForm.fields.password);
      emailForm.setStatus('Email updated!');
      emailForm.setFields((f) => ({ ...f, password: '' }));
    } catch (err) {
      emailForm.setErr(err.message);
    } finally {
      emailForm.setSaving(false);
    }
  }

  return (
    <div className="settings-shell">
      <div className="settings-inner">
        <div className="settings-header">
          <Link className="settings-back" to="/patient">← Back</Link>
          <h1>Account settings</h1>
        </div>

        <Section title="Personal information">
          <div className="settings-grid">
            <div className="settings-field">
              <label>Full name</label>
              <input value={personal.fields.name} onChange={(e) => personal.setFields((f) => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" />
            </div>
            <div className="settings-field">
              <label>Phone number</label>
              <input value={personal.fields.phone} onChange={(e) => personal.setFields((f) => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="settings-field">
              <label>Date of birth</label>
              <input type="date" value={personal.fields.dateOfBirth} onChange={(e) => personal.setFields((f) => ({ ...f, dateOfBirth: e.target.value }))} />
            </div>
            <div className="settings-field">
              <label>Blood group</label>
              <select value={personal.fields.bloodGroup} onChange={(e) => personal.setFields((f) => ({ ...f, bloodGroup: e.target.value }))}>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g || 'Select…'}</option>)}
              </select>
            </div>
            <div className="settings-field">
              <label>Preferred language</label>
              <select value={personal.fields.preferredLanguage} onChange={(e) => personal.setFields((f) => ({ ...f, preferredLanguage: e.target.value }))}>
                {LANGUAGES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="settings-field">
              <label>Address</label>
              <input value={personal.fields.address} onChange={(e) => personal.setFields((f) => ({ ...f, address: e.target.value }))} placeholder="123 Main St, Davis, CA" />
            </div>
          </div>
          <button className="settings-save" disabled={personal.saving} onClick={() => saveSection(personal, personal.fields)}>
            {personal.saving ? 'Saving…' : 'Save personal info'}
          </button>
          {personal.status && <p className="settings-success">{personal.status}</p>}
          {personal.err && <p className="settings-error">{personal.err}</p>}
        </Section>

        <Section title="Insurance">
          <div className="settings-grid">
            <div className="settings-field">
              <label>Insurance provider</label>
              <input value={insurance.fields.provider} onChange={(e) => insurance.setFields((f) => ({ ...f, provider: e.target.value }))} placeholder="Medi-Cal, Kaiser, etc." />
            </div>
            <div className="settings-field">
              <label>Plan name</label>
              <input value={insurance.fields.plan} onChange={(e) => insurance.setFields((f) => ({ ...f, plan: e.target.value }))} placeholder="Silver, HMO…" />
            </div>
            <div className="settings-field">
              <label>Member ID</label>
              <input value={insurance.fields.memberId} onChange={(e) => insurance.setFields((f) => ({ ...f, memberId: e.target.value }))} placeholder="ID number" />
            </div>
          </div>
          <button className="settings-save" disabled={insurance.saving} onClick={() => saveSection(insurance, { insurance: insurance.fields })}>
            {insurance.saving ? 'Saving…' : 'Save insurance'}
          </button>
          {insurance.status && <p className="settings-success">{insurance.status}</p>}
          {insurance.err && <p className="settings-error">{insurance.err}</p>}
        </Section>

        <Section title="Health details">
          <div className="settings-grid full">
            <div className="settings-field">
              <label>Mobility needs</label>
              <input value={health.fields.mobilityNeeds} onChange={(e) => health.setFields((f) => ({ ...f, mobilityNeeds: e.target.value }))} placeholder="Wheelchair, walker, none…" />
            </div>
            <div className="settings-field">
              <label>
                <input type="checkbox" checked={!!health.fields.usesWheelchair} onChange={(e) => health.setFields((f) => ({ ...f, usesWheelchair: e.target.checked }))} style={{ marginRight: 8 }} />
                I use a wheelchair or mobility scooter
              </label>
            </div>
            <div className="settings-field">
              <label>Mobility level</label>
              <select value={health.fields.mobilityLevel} onChange={(e) => health.setFields((f) => ({ ...f, mobilityLevel: e.target.value }))}>
                <option value="">Prefer not to say</option>
                <option value="none">No issues</option>
                <option value="limited">Limited</option>
                <option value="wheelchair">Wheelchair</option>
              </select>
            </div>
            <div className="settings-field">
              <label>Comfortable walking limit (meters)</label>
              <input type="number" min="0" step="50" value={health.fields.walkingLimitMeters} onChange={(e) => health.setFields((f) => ({ ...f, walkingLimitMeters: e.target.value }))} placeholder="e.g. 500" />
            </div>
            <div className="settings-field">
              <label>Allergies</label>
              <input value={health.fields.allergies} onChange={(e) => health.setFields((f) => ({ ...f, allergies: e.target.value }))} placeholder="Penicillin, nuts, none…" />
            </div>
          </div>
          <button className="settings-save" disabled={health.saving} onClick={() => saveSection(health, { ...health.fields, walkingLimitMeters: health.fields.walkingLimitMeters === '' ? null : Number(health.fields.walkingLimitMeters) })}>
            {health.saving ? 'Saving…' : 'Save health details'}
          </button>
          {health.status && <p className="settings-success">{health.status}</p>}
          {health.err && <p className="settings-error">{health.err}</p>}
        </Section>

        <Section title="Emergency contact">
          <div className="settings-grid">
            <div className="settings-field">
              <label>Contact name</label>
              <input value={emergency.fields.name} onChange={(e) => emergency.setFields((f) => ({ ...f, name: e.target.value }))} placeholder="Maria Smith" />
            </div>
            <div className="settings-field">
              <label>Contact phone</label>
              <input value={emergency.fields.phone} onChange={(e) => emergency.setFields((f) => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="settings-field">
              <label>Relationship</label>
              <input value={emergency.fields.relationship} onChange={(e) => emergency.setFields((f) => ({ ...f, relationship: e.target.value }))} placeholder="Mother, spouse, friend…" />
            </div>
          </div>
          <button className="settings-save" disabled={emergency.saving} onClick={() => saveSection(emergency, { emergencyContact: emergency.fields })}>
            {emergency.saving ? 'Saving…' : 'Save emergency contact'}
          </button>
          {emergency.status && <p className="settings-success">{emergency.status}</p>}
          {emergency.err && <p className="settings-error">{emergency.err}</p>}
        </Section>

        <Section title="Change email" danger>
          <form onSubmit={saveEmail}>
            <div className="settings-grid full">
              <div className="settings-field">
                <label>New email address</label>
                <input type="email" value={emailForm.fields.newEmail} onChange={(e) => emailForm.setFields((f) => ({ ...f, newEmail: e.target.value }))} required />
              </div>
              <div className="settings-field">
                <label>Current password (to confirm)</label>
                <input type="password" value={emailForm.fields.password} onChange={(e) => emailForm.setFields((f) => ({ ...f, password: e.target.value }))} required placeholder="••••••••" />
              </div>
            </div>
            <button className="settings-save" type="submit" disabled={emailForm.saving}>
              {emailForm.saving ? 'Saving…' : 'Update email'}
            </button>
            {emailForm.status && <p className="settings-success">{emailForm.status}</p>}
            {emailForm.err && <p className="settings-error">{emailForm.err}</p>}
          </form>
        </Section>

        <Section title="Change password" danger>
          <form onSubmit={savePassword}>
            <div className="settings-grid full">
              <div className="settings-field">
                <label>Current password</label>
                <input type="password" value={pwForm.fields.currentPassword} onChange={(e) => pwForm.setFields((f) => ({ ...f, currentPassword: e.target.value }))} required placeholder="••••••••" />
              </div>
              <div className="settings-field">
                <label>New password</label>
                <input type="password" value={pwForm.fields.newPassword} onChange={(e) => pwForm.setFields((f) => ({ ...f, newPassword: e.target.value }))} required placeholder="••••••••" />
              </div>
              <div className="settings-field">
                <label>Confirm new password</label>
                <input type="password" value={pwForm.fields.confirmPassword} onChange={(e) => pwForm.setFields((f) => ({ ...f, confirmPassword: e.target.value }))} required placeholder="••••••••" />
              </div>
            </div>
            <button className="settings-save" type="submit" disabled={pwForm.saving}>
              {pwForm.saving ? 'Saving…' : 'Update password'}
            </button>
            {pwForm.status && <p className="settings-success">{pwForm.status}</p>}
            {pwForm.err && <p className="settings-error">{pwForm.err}</p>}
          </form>
        </Section>

        <Section title="Account">
          <p style={{ color: 'var(--aggie-muted)', fontSize: '0.88rem', marginBottom: '14px' }}>
            Signed in as <strong>{user?.email}</strong>
          </p>
          <button
            className="settings-save"
            style={{ background: 'var(--aggie-danger)' }}
            type="button"
            onClick={() => { logout(); navigate('/'); }}
          >
            Log out
          </button>
        </Section>
      </div>
    </div>
  );
}
