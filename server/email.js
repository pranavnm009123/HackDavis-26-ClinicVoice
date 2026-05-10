import nodemailer from 'nodemailer';

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
