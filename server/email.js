import nodemailer from 'nodemailer';

const MODE_LABELS = { clinic: 'Free Clinic', shelter: 'Housing & Shelter', food_aid: 'Food Aid' };
const URGENCY_COLORS = { CRITICAL: '#d32f2f', HIGH: '#e65100', MEDIUM: '#f57f17', LOW: '#2e7d32' };

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    console.log('[Email] Using Gmail SMTP');
  } else if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    console.log('[Email] Using custom SMTP');
  } else {
    const test = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: test.user, pass: test.pass },
    });
    console.log('[Email] No SMTP configured — using Ethereal test account:', test.user);
  }

  return transporter;
}

export async function sendIntakeConfirmation({ to, name, card, mode, structuredFields = {} }) {
  const t = await getTransporter();
  const modeLabel = MODE_LABELS[mode] || mode;
  const urgency = card?.urgency?.level || card?.urgency || 'LOW';
  const urgencyColor = URGENCY_COLORS[urgency] || '#2e7d32';
  const summary = card?.english_summary || 'Your intake has been recorded.';
  const nextStep = card?.recommended_next_step || '';
  const resources = Array.isArray(card?.resource_matches) ? card.resource_matches : [];

  const resourcesHtml = resources.length > 0
    ? `<h3 style="color:#143329;margin-top:24px;font-size:1rem">Resources for You</h3>
       <ul style="padding-left:20px;margin:8px 0">
         ${resources.map((r) => {
           const n = typeof r === 'string' ? r : (r.name || '');
           const phone = r.phone ? ` &middot; ${r.phone}` : '';
           const url = r.url ? ` &middot; <a href="https://${r.url}" style="color:#1d8f59">${r.url}</a>` : '';
           return `<li style="margin-bottom:8px">${n}${phone}${url}</li>`;
         }).join('')}
       </ul>`
    : '';

  const info = await t.sendMail({
    from: '"VoiceBridge" <noreply@voicebridge.care>',
    to,
    subject: `Your ${modeLabel} Intake — VoiceBridge Confirmation`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#143329">
        <div style="background:#143329;padding:20px 24px;border-radius:12px 12px 0 0">
          <h1 style="color:#ffffff;margin:0;font-size:1.4rem">VoiceBridge</h1>
          <p style="color:#a8c5b0;margin:4px 0 0;font-size:0.9rem">${modeLabel} Intake Confirmation</p>
        </div>
        <div style="background:#f8faf8;padding:24px;border-radius:0 0 12px 12px">
          <p>Hi ${name || 'there'},</p>
          <p>Your intake has been submitted. Here's a copy of your summary:</p>
          <div style="background:#fff;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid ${urgencyColor}">
            <p style="margin:0 0 6px;font-size:0.8rem;color:#6b7a74;text-transform:uppercase;font-weight:600">Summary</p>
            <p style="margin:0">${summary}</p>
          </div>
          ${nextStep ? `<div style="background:#e8f5e9;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0 0 4px;font-size:0.8rem;color:#2e7d32;font-weight:600">Recommended Next Step</p>
            <p style="margin:0">${nextStep}</p>
          </div>` : ''}
          ${resourcesHtml}
          <p style="margin-top:24px;color:#4a6b5a">A staff member will follow up with you soon. If your situation becomes urgent, call 911 or go to the nearest emergency room.</p>
          <p style="color:#6b7a74;font-size:0.82rem;margin-top:24px;border-top:1px solid #e0e0e0;padding-top:16px">
            VoiceBridge &middot; Free Clinic Intake System<br>
            This email was sent to ${to} because you provided this address during intake.
          </p>
        </div>
      </div>
    `,
  });
  console.log('[Email] Intake confirmation sent to', to, nodemailer.getTestMessageUrl(info) || '');
}

export async function sendResourceEmail({ to, subject, bodyText }) {
  const t = await getTransporter();
  const html = bodyText
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#1d8f59">$1</a>')
    .replace(/\n/g, '<br>');
  const info = await t.sendMail({
    from: '"VoiceBridge" <noreply@voicebridge.care>',
    to,
    subject,
    text: bodyText,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#143329">
        <div style="background:#143329;padding:16px 24px;border-radius:12px 12px 0 0">
          <h2 style="color:#fff;margin:0;font-size:1.2rem">VoiceBridge</h2>
        </div>
        <div style="background:#f8faf8;padding:24px;border-radius:0 0 12px 12px;line-height:1.7">
          ${html}
          <p style="color:#6b7a74;font-size:0.82rem;margin-top:32px;border-top:1px solid #e0e0e0;padding-top:16px">
            VoiceBridge &middot; Sent on request during your intake session
          </p>
        </div>
      </div>
    `,
  });
  console.log('[Email] Resource email sent to', to, nodemailer.getTestMessageUrl(info) || '');
}

export async function sendWelcomeEmail({ to, userId, name }) {
  const t = await getTransporter();
  const info = await t.sendMail({
    from: '"VoiceBridge" <noreply@voicebridge.care>',
    to,
    subject: 'Welcome to VoiceBridge — Your Patient ID',
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto;color:#143329">
        <h2 style="color:#143329">Welcome to VoiceBridge</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Your VoiceBridge patient account has been created. Use your ID for all future visits:</p>
        <div style="background:#e3f0e7;border-radius:12px;padding:20px;text-align:center;margin:24px 0">
          <span style="font-size:2rem;font-weight:700;letter-spacing:0.1em;color:#143329">${userId}</span>
          <p style="margin:8px 0 0;color:#4a6b5a;font-size:0.9rem">Your VoiceBridge ID</p>
        </div>
        <p>Keep this ID handy — it lets returning patients skip re-registration.</p>
        <p style="color:#6b7a74;font-size:0.85rem">VoiceBridge · Free Clinic Intake System</p>
      </div>
    `,
  });
  console.log('[Email] Welcome sent to', to, nodemailer.getTestMessageUrl(info) || '');
}

export async function sendAppointmentConfirmation({ to, userId, name, appointment }) {
  const TYPE_LABELS = {
    nurse_triage: 'Nurse Triage',
    clinic_review: 'Clinic Review',
    interpreter: 'Interpreter Session',
    social_worker: 'Social Worker Meeting',
    emergency_escalation: 'Emergency Escalation',
  };
  const t = await getTransporter();
  const info = await t.sendMail({
    from: '"VoiceBridge" <noreply@voicebridge.care>',
    to,
    subject: `Appointment Scheduled — ${TYPE_LABELS[appointment.appointment_type] || appointment.appointment_type}`,
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto;color:#143329">
        <h2 style="color:#143329">Appointment Confirmation</h2>
        <p>Hi ${name || 'there'} (ID: <strong>${userId}</strong>),</p>
        <p>A follow-up appointment has been arranged based on your intake.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr><td style="padding:8px 0;color:#4a6b5a;font-weight:600;width:140px">Type</td><td>${TYPE_LABELS[appointment.appointment_type] || appointment.appointment_type}</td></tr>
          <tr><td style="padding:8px 0;color:#4a6b5a;font-weight:600">When</td><td>${appointment.suggested_time}</td></tr>
          <tr><td style="padding:8px 0;color:#4a6b5a;font-weight:600">Reason</td><td>${appointment.reason}</td></tr>
          <tr><td style="padding:8px 0;color:#4a6b5a;font-weight:600">Urgency</td><td>${appointment.urgency}</td></tr>
          ${appointment.notes ? `<tr><td style="padding:8px 0;color:#4a6b5a;font-weight:600">Notes</td><td>${appointment.notes}</td></tr>` : ''}
        </table>
        <p>Please arrive at your scheduled time. Bring your VoiceBridge ID.</p>
        <p style="color:#6b7a74;font-size:0.85rem">VoiceBridge · Free Clinic Intake System</p>
      </div>
    `,
  });
  console.log('[Email] Appointment confirmation sent to', to, nodemailer.getTestMessageUrl(info) || '');
}
