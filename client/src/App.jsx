import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AnalyticsView from './AnalyticsView.jsx';
import AppointmentsView from './AppointmentsView.jsx';
import PatientView from './PatientView.jsx';
import StaffView from './StaffView.jsx';
import LandingPage from './LandingPage.jsx';
import AuthPage from './AuthPage.jsx';
import SettingsPage from './SettingsPage.jsx';
import NavigateView from './NavigateView.jsx';
import { AuthProvider } from './useAuth.jsx';

const styles = `
:root {
  /* Sampled from provided UC Davis logo / site PNGs (gold median #f5c242, navy median #0d274e) */
  --aggie-blue: #0d274e;
  --aggie-gold: #f5c242;
  --aggie-blue-mid: #154872;
  --aggie-blue-soft: #e8eef5;
  --aggie-gold-soft: #fcf6e0;
  --aggie-border: rgba(13, 39, 78, 0.14);
  --aggie-shadow: rgba(13, 39, 78, 0.14);
  --aggie-muted: #4d6b82;
  --urgency-critical: #9f1d20;
  --urgency-high: #b84f0a;
  --urgency-medium: #f5c242;
  --urgency-low: #1f6b3a;
  --aggie-danger: var(--urgency-critical);
  --aggie-warning: var(--urgency-high);
  --background: #ffffff;
  --foreground: #0f172a;
  --card: #ffffff;
  --card-foreground: #0f172a;
  --primary: #0f172a;
  --primary-foreground: #ffffff;
  --secondary: #f1f5f9;
  --secondary-foreground: #0f172a;
  --muted: #f8fafc;
  --muted-foreground: #64748b;
  --accent: #f1f5f9;
  --accent-foreground: #0f172a;
  --destructive: #9f1d20;
  --destructive-foreground: #ffffff;
  --border: #e2e8f0;
  --input: #e2e8f0;
  --ring: #94a3b8;
  --radius: 0.625rem;
  --shadow-sm: 0 1px 2px rgba(13, 39, 78, 0.06);
  --shadow-md: 0 8px 22px rgba(13, 39, 78, 0.08);
  --app-font: "Avenir Next", "Gill Sans", "Trebuchet MS", sans-serif;
  color: var(--aggie-blue);
  background: #ffffff;
  font-family: var(--app-font);
  font-synthesis: none;
  text-rendering: geometricPrecision;
}

* {
  box-sizing: border-box;
  font-family: inherit;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: #ffffff;
}

#root {
  min-height: 100vh;
  background: #ffffff;
}

button,
input,
select,
textarea {
  border: 0;
  font: inherit;
}

body,
table,
svg text,
.recharts-wrapper,
.recharts-wrapper * {
  font-family: var(--app-font);
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 3px solid var(--aggie-gold);
  outline-offset: 3px;
}

.skip-link {
  position: absolute;
  left: 16px;
  top: 12px;
  z-index: 1000;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--aggie-blue);
  color: #ffffff;
  font-weight: 900;
  transform: translateY(-160%);
}

.skip-link:focus {
  transform: translateY(0);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.patient-shell,
.staff-shell {
  min-height: 100vh;
  padding: 32px;
  background: #ffffff;
}

.patient-shell {
  display: grid;
  place-items: start center;
}

.queue-panel {
  border: 1px solid var(--aggie-border);
  background: #ffffff;
  box-shadow: 0 24px 80px var(--aggie-shadow);
  backdrop-filter: blur(18px);
}

.patient-card {
  position: relative;
  width: min(100%, 1440px);
  min-height: auto;
  padding: 0;
}

.card-topline,
.patient-row,
.queue-header,
.patient-controls,
.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.patient-header,
.staff-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.patient-header {
  position: relative;
}

.patient-header .connection,
.staff-header .connection {
  flex-shrink: 0;
  margin-top: 2px;
}

.patient-header .connection {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 20;
}

.brand-lockup {
  flex: 1;
  min-width: 0;
}

.patient-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 6px;
  padding-right: 128px;
}

.patient-heading-row .eyebrow {
  margin: 0;
}

.brand-lockup h1 {
  color: var(--aggie-blue);
}

.brand-lockup h1::after {
  content: '';
  display: block;
  width: 3.25rem;
  height: 4px;
  margin-top: clamp(10px, 2vw, 14px);
  border-radius: 2px;
  background: var(--aggie-gold);
}

.brand-tagline {
  margin: clamp(12px, 2vw, 16px) 0 0;
  max-width: 38rem;
  color: var(--aggie-muted);
  font-size: clamp(0.92rem, 2.2vw, 1.05rem);
  line-height: 1.45;
  font-weight: 600;
}

.patient-card.session-setup .patient-header {
  margin-bottom: 28px;
}

.staff-header .brand-lockup h1 {
  font-size: clamp(1.65rem, 4vw, 2.35rem);
  letter-spacing: -0.05em;
  line-height: 1.08;
}

.patient-header .brand-lockup h1 {
  font-size: clamp(2.4rem, 7vw, 5.6rem);
  letter-spacing: -0.08em;
  line-height: 0.9;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--aggie-muted);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0;
  font-size: clamp(1.65rem, 4vw, 2.35rem);
  letter-spacing: -0.05em;
  line-height: 1.08;
  color: var(--aggie-blue);
}

h2 {
  margin-bottom: 0;
}

.connection {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  border-radius: 999px;
  background: transparent;
  color: var(--aggie-muted);
  font-size: 0.9rem;
  font-weight: 800;
}

.connection span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #8fa4b8;
}

.connection.is-live {
  background: transparent;
  color: var(--aggie-blue);
}

.connection.is-live span {
  background: var(--aggie-gold);
  box-shadow: 0 0 0 8px rgba(245, 194, 66, 0.28);
}

.mode-picker {
  display: grid;
  gap: 14px;
  margin-bottom: 16px;
  padding: clamp(18px, 2.4vw, 30px);
  border: 1px solid var(--aggie-border);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.65);
}


.mode-picker h2 {
  max-width: 860px;
  font-size: clamp(1.35rem, 3.2vw, 2rem);
  letter-spacing: -0.05em;
  line-height: 1.02;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.mode-option {
  min-height: 116px;
  padding: 14px;
  border: 1px solid var(--aggie-blue);
  border-radius: 22px;
  background: var(--aggie-blue);
  color: #fff;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
}

.mode-option strong,
.mode-option span {
  display: block;
}

.mode-option strong {
  margin-bottom: 10px;
  font-size: 1.05rem;
}

.mode-option span {
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.9rem;
  line-height: 1.35;
}

.mode-option:hover,
.mode-option:focus-visible {
  border-color: var(--aggie-blue);
  background: var(--secondary);
  color: var(--aggie-blue);
  box-shadow: inset 0 0 0 1px var(--aggie-blue);
}

.mode-option:hover span,
.mode-option:focus-visible span {
  color: var(--aggie-muted);
}

.mode-option.is-selected {
  border-color: var(--aggie-gold);
  background: var(--aggie-gold);
  color: var(--aggie-blue);
  box-shadow: inset 0 0 0 1px rgba(13, 39, 78, 0.1);
}

.mode-option.is-selected span {
  color: var(--aggie-blue);
}

.user-id-section {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--aggie-border);
  border-radius: 18px;
  background: rgba(232, 238, 245, 0.65);
}

.returning-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--aggie-blue);
  font-size: 0.9rem;
  font-weight: 800;
}

.user-id-input {
  width: 100%;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid var(--aggie-border);
  border-radius: 12px;
  background: #fffefb;
  color: var(--aggie-blue);
  font: inherit;
}

.contact-note,
.user-error {
  margin: 0;
  color: var(--aggie-muted);
  font-size: 0.9rem;
  font-weight: 700;
}

.user-error {
  color: #be2020;
}

.language-select {
  display: grid;
  gap: 8px;
  color: var(--aggie-muted);
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.language-select select,
.filter-bar select,
.filter-bar input {
  width: 100%;
  border: 1px solid var(--aggie-border);
  border-radius: 14px;
  background: #fffefb;
  color: var(--aggie-blue);
  font: inherit;
  padding: 12px 14px;
}

.start-session-button {
  padding: 16px 20px;
  border-radius: 18px;
  background: var(--aggie-blue);
  color: #ffffff;
  cursor: pointer;
  font-weight: 900;
}

.start-session-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.session-status {
  margin-bottom: 0;
  color: var(--aggie-muted);
  font-size: 0.95rem;
}

.mode-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
  padding: 14px;
  border: 1px solid var(--aggie-border);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.78);
}

.mode-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mode-tab,
.new-intake-button {
  padding: 10px 12px;
  border-radius: 999px;
  background: var(--aggie-blue);
  color: #fff;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 900;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.mode-tab:hover,
.mode-tab:focus-visible,
.new-intake-button:hover,
.new-intake-button:focus-visible {
  background: var(--aggie-gold-soft);
  color: var(--aggie-blue);
}

.mode-tab.is-selected {
  background: var(--aggie-gold);
  color: var(--aggie-blue);
}

.mode-tab:disabled {
  cursor: default;
  opacity: 0.78;
}

.new-intake-button {
  background: var(--aggie-gold);
  color: var(--aggie-blue);
}

.map-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #e8f0fe;
  border: 1px solid #93b4f7;
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 10px;
  font-size: 0.88rem;
  color: #1a2440;
}
.map-banner span { flex: 1; }
.map-banner-btn {
  background: var(--aggie-gold, #ffcc00);
  color: #1a2440;
  border: none;
  border-radius: 7px;
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
}
.map-banner-btn:hover { background: #f0b800; }
.map-banner-close {
  background: none;
  border: none;
  color: #888;
  font-size: 1rem;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
}

.transcript-toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 0 2px 6px;
}

.translate-toggle {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 20px;
  border: 1.5px solid var(--aggie-border);
  background: transparent;
  color: var(--aggie-blue-mid);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.translate-toggle.is-active {
  background: var(--aggie-blue);
  color: #fff;
  border-color: var(--aggie-blue);
}

.translating-indicator {
  display: block;
  font-size: 0.7rem;
  opacity: 0.5;
  margin-top: 4px;
  font-style: italic;
}


.conversation {
  display: flex;
  min-height: 300px;
  max-height: min(48vh, 420px);
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  padding: 20px 20px 34px;
  border-radius: 28px;
  background: linear-gradient(180deg, #fffefb, var(--aggie-blue-soft));
  overscroll-behavior: contain;
  scroll-behavior: smooth;
}

.conversation-end {
  flex: 0 0 1px;
}

.patient-card.session-setup .conversation {
  display: none;
}

.welcome-bubble,
.bubble {
  max-width: 78%;
  border-radius: 24px;
  padding: 16px 18px;
  line-height: 1.45;
}

.welcome-bubble {
  max-width: 100%;
  margin: auto;
  color: #4d6b82;
  text-align: center;
}

.ai-bubble {
  align-self: flex-start;
  background: #ffffff;
  color: var(--aggie-blue);
}

.patient-bubble {
  align-self: flex-end;
  background: var(--aggie-blue-mid);
  color: #ffffff;
}

.patient-controls {
  justify-content: center;
  margin-top: 28px;
}

.camera-button,
.review-button,
.alert-banner button {
  padding: 14px 18px;
  border-radius: 16px;
  background: var(--aggie-blue);
  color: #ffffff;
  cursor: pointer;
  font-weight: 800;
}

.camera-preview {
  display: none;
  width: 180px;
  margin: 18px auto 0;
  border-radius: 20px;
}

.camera-preview.is-visible {
  display: block;
}

.staff-shell {
  max-width: 1240px;
  margin: 0 auto;
}

.staff-header {
  margin-bottom: 24px;
}

.alert-banner {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
  padding: 24px;
  border-radius: 28px;
  background: #a92323;
  color: #fff8f0;
  box-shadow: 0 18px 42px rgba(169, 35, 35, 0.28);
}

.queue-panel {
  padding: 26px;
  border-radius: 34px;
}

.queue-header {
  margin-bottom: 18px;
}

.filter-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.queue-header span,
.status-pill {
  border-radius: 999px;
  padding: 8px 12px;
  background: var(--aggie-blue-soft);
  color: #4d6b82;
  font-weight: 800;
}

.queue-controls .status-pill {
  background: var(--aggie-blue);
  color: #ffffff;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 18px;
}

.intake-card {
  border: 1px solid var(--aggie-border);
  border-radius: 28px;
  padding: 22px;
  background: #fffefb;
  min-width: 0;
  overflow: hidden;
}

.badge {
  border-radius: 999px;
  padding: 8px 12px;
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 900;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mode-badge {
  border-radius: 999px;
  padding: 8px 12px;
  background: var(--aggie-blue-soft);
  color: var(--aggie-blue);
  font-size: 0.78rem;
  font-weight: 900;
}

.badge-critical { background: var(--urgency-critical); }
.badge-high { background: var(--urgency-high); }
.badge-medium { background: var(--urgency-medium); color: var(--aggie-blue); }
.badge-low { background: var(--urgency-low); }

.timestamp {
  color: #5c7389;
  font-size: 0.86rem;
}

.patient-row {
  margin: 18px 0;
}

.patient-row h3 {
  margin: 0;
  font-size: 1.55rem;
}

.intake-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 0 0 18px;
}

.intake-grid div,
.next-step {
  border-radius: 18px;
  padding: 14px;
  background: var(--aggie-blue-soft);
}

dt {
  color: #4d6b82;
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

dd {
  margin: 4px 0 0;
}

.card-section p:last-child,
.next-step p:last-child {
  margin-bottom: 0;
}

.next-step small {
  display: block;
  margin-top: 8px;
  color: #5c7389;
}

.structured-fields,
.resource-list {
  margin-top: 16px;
  border-radius: 18px;
  padding: 14px;
  background: var(--aggie-gold-soft);
}

.structured-fields dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

.resource-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.resource-list .eyebrow {
  flex-basis: 100%;
}

.resource-list span {
  border-radius: 999px;
  padding: 8px 10px;
  background: var(--aggie-blue-soft);
  color: var(--aggie-blue-mid);
  font-size: 0.84rem;
  font-weight: 800;
}

.card-meta {
  align-items: flex-start;
  margin: 16px 0;
  color: #5c7389;
  font-size: 0.9rem;
}

.review-button {
  width: 100%;
}

.status-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.status-actions .review-button {
  min-width: 0;
  padding: 12px 10px;
  border-radius: 16px;
  font-size: clamp(0.74rem, 1.7vw, 0.9rem);
  line-height: 1.1;
  white-space: normal;
  overflow-wrap: anywhere;
}

.review-button:disabled {
  background: #a8b8c8;
  cursor: default;
}

.empty-state {
  display: grid;
  min-height: 280px;
  place-items: center;
  border-radius: 24px;
  background: var(--aggie-gold-soft);
  color: #4d6b82;
  text-align: center;
}

.inline-error {
  margin: 16px 0 0;
  color: #a92323;
  font-weight: 800;
}

.text-input-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.text-input-bar input {
  width: 100%;
}

.text-input-bar button {
  min-height: 40px;
  padding: 0 18px;
  border-radius: var(--radius);
  background: var(--aggie-blue);
  color: #ffffff;
  cursor: pointer;
  font-weight: 800;
}

/* ── Session split screen ─────────────────────────────────── */
.session-split-body {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 4px;
}

.session-left {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.session-left .conversation {
  flex: 1;
  min-height: 360px;
  max-height: clamp(380px, 58vh, 640px);
}

.session-right {
  flex: 0 0 300px;
  width: 300px;
}

.draft-panel {
  background: #fff;
  border: 1px solid var(--aggie-border);
  border-radius: 22px;
  overflow: hidden;
  position: sticky;
  top: 12px;
}

.draft-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: var(--aggie-blue);
  color: #fff;
  font-weight: 800;
  font-size: 0.76rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.draft-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--aggie-gold);
  box-shadow: 0 0 0 4px rgba(245, 194, 66, 0.3);
  animation: dot-bounce 1.5s ease-in-out infinite;
}

.draft-fields {
  padding: 8px 18px 4px;
}

.draft-field {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--aggie-border);
}

.draft-field:last-child { border-bottom: none; }

.draft-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--aggie-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  flex-shrink: 0;
}

.draft-value {
  font-size: 0.85rem;
  color: #c5d0dc;
  text-align: right;
  font-style: italic;
  max-width: 160px;
  word-break: break-word;
}

.draft-value.is-filled {
  color: var(--aggie-blue);
  font-style: normal;
  font-weight: 600;
  animation: draft-pop 0.35s ease-out;
}

@keyframes draft-pop {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.draft-suggestions {
  padding: 12px 18px 16px;
  background: var(--aggie-gold-soft);
  border-top: 1px solid rgba(245, 194, 66, 0.35);
}

.draft-suggestions-title {
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--aggie-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 9px;
}

.draft-suggestion {
  padding: 5px 0;
  font-size: 0.8rem;
  color: var(--aggie-blue);
  line-height: 1.38;
  border-bottom: 1px solid rgba(245, 194, 66, 0.25);
}

.draft-suggestion:last-child { border-bottom: none; }

@media (max-width: 860px) {
  .session-split-body { flex-direction: column; }
  .session-right { flex: none; width: 100%; }
  .draft-panel { position: static; }
  .session-left .conversation { min-height: 260px; max-height: 42vh; }
}

/* ── AI speaking indicator ───────────────────────────────── */
.ai-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
  min-height: 28px;
  color: var(--aggie-blue);
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.speaking-dots { display: flex; gap: 5px; }

.speaking-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--aggie-gold);
  animation: dot-bounce 1.2s ease-in-out infinite;
}

.speaking-dot:nth-child(2) { animation-delay: 0.15s; }
.speaking-dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes dot-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
  40% { transform: translateY(-7px); opacity: 1; }
}

/* ── Session loading spinner ─────────────────────────────── */
.session-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #4d6b82;
  font-weight: 800;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(0, 40, 85, 0.18);
  border-top-color: var(--aggie-blue);
  border-radius: 50%;
  flex-shrink: 0;
  animation: spin 0.75s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Transcript bubble slide-in ──────────────────────────── */
@keyframes bubble-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.bubble { animation: bubble-in 0.22s ease; }

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}

/* ── Staff nav tabs ──────────────────────────────────────── */
.staff-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 22px;
}

.staff-tab {
  padding: 9px 18px;
  border-radius: 999px;
  background: var(--aggie-blue);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 900;
  text-decoration: none;
  border: 0;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.staff-tab:hover,
.staff-tab:focus-visible {
  background: var(--aggie-gold-soft);
  color: var(--aggie-blue);
}

.staff-tab.active {
  background: var(--aggie-gold);
  color: var(--aggie-blue);
  box-shadow: inset 0 0 0 1px rgba(13, 39, 78, 0.1);
}

/* ── Category tabs (clinic / shelter / food) ─────────────── */
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 999px;
  border: 2px solid var(--aggie-blue);
  cursor: pointer;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 900;
  background: var(--aggie-blue);
  color: #fff;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.cat-count {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 99px;
  font-size: 0.74rem;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.2);
  color: inherit;
}

.category-tab:hover,
.category-tab:focus-visible {
  background: var(--aggie-gold-soft);
  border-color: var(--aggie-gold);
  color: var(--aggie-blue);
}

.category-tab:hover .cat-count,
.category-tab:focus-visible .cat-count {
  background: rgba(13, 39, 78, 0.1);
}

.category-tab.active {
  background: var(--aggie-gold);
  border-color: var(--aggie-gold);
  color: var(--aggie-blue);
}

.category-tab.active .cat-count { background: rgba(13, 39, 78, 0.1); }

/* ── 3-col filter bar (no mode dropdown) ─────────────────── */
.filter-bar-3col {
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
}

/* ── Queue controls (sort + view toggle) ─────────────────── */
.queue-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.queue-controls select {
  border: 1px solid var(--aggie-border);
  border-radius: 14px;
  background: #fffefb;
  color: var(--aggie-blue);
  font: inherit;
  font-size: 0.88rem;
  padding: 8px 12px;
}

.view-toggle { display: flex; gap: 4px; }

.view-toggle button {
  padding: 8px 14px;
  border-radius: 12px;
  background: var(--aggie-blue);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 900;
  border: 0;
  transition: background 0.15s, color 0.15s;
}

.view-toggle button:hover,
.view-toggle button:focus-visible {
  background: var(--aggie-gold-soft);
  color: var(--aggie-blue);
}

.view-toggle button.is-active { background: var(--aggie-gold); color: var(--aggie-blue); }

/* ── List view ───────────────────────────────────────────── */
.cards-list { display: flex; flex-direction: column; gap: 8px; }

.intake-card-list {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 16px;
  border: 1px solid var(--aggie-border);
  border-radius: 18px;
  padding: 14px 18px;
  background: #fffefb;
}

.list-name { font-weight: 800; color: var(--aggie-blue); font-size: 1rem; }

.list-summary {
  color: #4d6b82;
  font-size: 0.84rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 420px;
}

.list-actions { display: flex; gap: 6px; flex-shrink: 0; }

.list-action-btn {
  padding: 8px 12px;
  border-radius: 12px;
  background: var(--aggie-blue);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 900;
  border: 0;
}

.list-action-btn:disabled { background: #a8b8c8; cursor: default; }

.patient-topnav {
  width: min(100%, 1440px); display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0 14px; margin-bottom: 0;
}
.patient-topnav-brand { font-weight: 800; font-size: 1rem; color: var(--aggie-blue); text-decoration: none; letter-spacing: -0.3px; }
.patient-topnav-actions { display: flex; align-items: center; gap: 10px; }
.patient-topnav-user { font-size: 0.82rem; color: var(--aggie-muted); font-weight: 600; }
.patient-topnav-link { font-size: 0.82rem; font-weight: 700; color: var(--aggie-blue); text-decoration: none; padding: 5px 12px; border-radius: 16px; border: 1px solid var(--aggie-border); transition: background 0.15s; }
.patient-topnav-link:hover { background: var(--aggie-blue-soft); }
.patient-topnav-link.is-primary { background: var(--aggie-blue); color: #fff; border-color: transparent; }
.patient-topnav-link.is-primary:hover { opacity: 0.85; }
.patient-topnav-link.is-danger { background: var(--aggie-danger); color: #fff; border-color: transparent; }
.patient-topnav-link.is-danger:hover { opacity: 0.85; }

/* ── Input mode buttons (speech / camera / text) ─────────── */
.input-mode-btns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 14px;
}
.input-mode-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 64px;
  padding: 12px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  text-align: left;
  box-shadow: none;
  transition: transform 0.12s, box-shadow 0.12s, background 0.18s, color 0.18s;
}

.input-mode-btn span {
  font-size: 0.98rem;
  font-weight: 900;
}

.input-mode-btn small {
  font-size: 0.78rem;
  opacity: 0.72;
  font-weight: 600;
  display: block;
  margin-top: 3px;
}

.input-mode-btn:hover:not(:disabled) {
  transform: none;
  background: var(--aggie-gold-soft);
  color: var(--aggie-blue);
  box-shadow: none;
}

.input-mode-btn.is-selected,
.input-mode-btn:active:not(:disabled) {
  background: var(--aggie-gold);
  color: var(--aggie-blue);
  box-shadow: none;
}

.input-mode-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.voice-mark {
  position: relative;
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: transparent;
  color: var(--aggie-blue);
  transition: width 0.18s, height 0.18s, background 0.18s, box-shadow 0.18s;
}

.input-mode-btn:hover:not(:disabled) .voice-mark,
.input-mode-btn.is-selected .voice-mark,
.input-mode-btn:active:not(:disabled) .voice-mark {
  background: transparent;
  color: var(--aggie-blue);
}

.voice-wave {
  display: flex;
  align-items: center;
  gap: 4px;
  transition: opacity 0.14s, transform 0.14s;
}

.voice-wave span {
  width: 5px;
  border-radius: 999px;
  background: currentColor;
}

.voice-wave span:nth-child(1) { height: 16px; opacity: 0.7; }
.voice-wave span:nth-child(2) { height: 26px; }
.voice-wave span:nth-child(3) { height: 20px; opacity: 0.82; }

.input-mode-btn svg {
  flex: 0 0 auto;
  width: 42px;
  height: 34px;
}

.input-mode-btn > span:not(.voice-mark) {
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.input-mode-btn.is-speech {
  background: var(--aggie-blue);
  color: #ffffff;
  box-shadow: none;
}

.input-mode-btn.is-camera,
.input-mode-btn.is-text {
  background: var(--aggie-blue);
  color: #ffffff;
  box-shadow: none;
}

.input-mode-btn.is-speech:hover:not(:disabled),
.input-mode-btn.is-camera:hover:not(:disabled),
.input-mode-btn.is-text:hover:not(:disabled) {
  background: var(--aggie-gold-soft);
  color: var(--aggie-blue);
}

.input-mode-btn.is-speech.is-selected,
.input-mode-btn.is-camera.is-selected,
.input-mode-btn.is-text.is-selected,
.input-mode-btn.is-speech:active:not(:disabled),
.input-mode-btn.is-camera:active:not(:disabled),
.input-mode-btn.is-text:active:not(:disabled) {
  background: var(--aggie-gold);
  color: var(--aggie-blue);
}

.setup-helper-text {
  margin: 8px 0 0;
  color: var(--aggie-muted);
  font-size: clamp(0.94rem, 1.5vw, 1.08rem);
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
}

/* ── Session side controls (camera + hang up) ────────────── */
.session-side-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-self: center;
}

.hangup-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 16px;
  background: #be2020;
  color: #ffffff;
  cursor: pointer;
  font-weight: 800;
  border: none;
  transition: background 0.12s;
}

.hangup-button:hover { background: #a01818; }

/* ── Session ended screen ────────────────────────────────── */
.session-ended-card {
  display: grid;
  place-items: center;
  text-align: center;
  min-height: 420px;
}

.session-ended-card h2 {
  font-size: clamp(2rem, 6vw, 4rem);
  letter-spacing: -0.06em;
  margin-bottom: 12px;
}

.session-ended-sub {
  color: var(--aggie-muted);
  font-size: 0.92rem;
  margin-top: 8px;
}

/* ── Clickable links inside chat bubbles ─────────────────── */
.chat-link {
  color: inherit;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
  word-break: break-all;
}

.ai-bubble .chat-link { color: #0d5e99; }
.patient-bubble .chat-link { color: #d4f0ff; }

/* ── Analytics page ──────────────────────────────────────── */
.analytics-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px;
}

.analytics-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.analytics-controls .category-tabs { margin-bottom: 0; }

.date-range-tabs {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.date-tab {
  padding: 8px 16px;
  border-radius: 999px;
  border: 1.5px solid var(--aggie-blue);
  background: var(--aggie-blue);
  color: #fff;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 900;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.date-tab:hover,
.date-tab:focus-visible {
  background: var(--aggie-gold-soft);
  border-color: var(--aggie-gold);
  color: var(--aggie-blue);
}

.date-tab.active {
  background: var(--aggie-gold);
  color: var(--aggie-blue);
  border-color: var(--aggie-gold);
}

.analytics-summary-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 28px;
  margin-top: 20px;
}

.summary-stat {
  border: 1px solid var(--aggie-border);
  border-radius: 22px;
  padding: 20px 22px;
  background: rgba(255, 253, 248, 0.92);
  backdrop-filter: blur(12px);
}

.summary-stat .eyebrow { margin-bottom: 8px; }

.summary-stat strong {
  display: block;
  font-size: 2.6rem;
  letter-spacing: -0.05em;
  color: var(--aggie-blue);
  line-height: 1;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.chart-card {
  border: 1px solid var(--aggie-border);
  border-radius: 28px;
  padding: 24px;
  background: rgba(255, 253, 248, 0.92);
  backdrop-filter: blur(12px);
}

.chart-card h3 {
  margin: 0 0 18px;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #4d6b82;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 210px;
  color: #8fa4b8;
  font-size: 0.9rem;
}

.analytics-error {
  padding: 24px 28px;
  border-radius: 22px;
  background: #fff0f0;
  color: #a92323;
  font-weight: 800;
  margin-bottom: 24px;
}

@media (min-width: 980px) {
  .patient-shell {
    padding: 40px 56px;
  }

  .patient-card {
    width: min(100%, 1440px);
  }

  .patient-card.session-active {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .patient-card.session-setup .conversation {
    display: none;
  }

  .patient-card.session-active .patient-controls {
    margin-top: 0;
  }

  .patient-card.session-active .session-side-controls {
    flex-direction: row;
    justify-content: center;
  }

  .session-right {
    flex: 0 0 320px;
    width: 320px;
  }

  .mode-picker h2 {
    max-width: 860px;
  }
}

@media (min-width: 721px) and (max-width: 979px) {
  .patient-card {
    width: min(820px, 100%);
  }

  .input-mode-btns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .patient-shell,
  .staff-shell {
    padding: 0;
  }

  .patient-card,
  .queue-panel {
    min-height: 100vh;
    padding: 20px;
    border-radius: 0;
  }

  .patient-header,
  .staff-header,
  .alert-banner {
    align-items: flex-start;
    flex-direction: column;
  }

  .patient-heading-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    padding-right: 0;
  }

  .patient-heading-row .patient-topnav-actions {
    width: 100%;
  }

  .intake-grid,
  .cards-grid,
  .filter-bar,
  .mode-grid,
  .input-mode-btns,
  .analytics-summary-row,
  .chart-grid {
    grid-template-columns: 1fr;
  }

  .analytics-controls { flex-direction: column; }
  .date-range-tabs { width: 100%; }
  .date-tab { flex: 1; text-align: center; }

  .patient-header .brand-lockup h1 {
    font-size: 2.55rem;
    line-height: 0.92;
  }

  .brand-tagline {
    font-size: 0.9rem;
  }

  .mode-picker {
    padding: 14px;
    border-radius: 22px;
  }

  .mode-picker h2 {
    font-size: 1.36rem;
    line-height: 1.08;
  }

  .mode-option {
    min-height: auto;
    padding: 12px;
  }

  .mode-option strong {
    font-size: 0.95rem;
  }

  .mode-option span {
    font-size: 0.8rem;
  }

  .input-mode-btn {
    min-height: 56px;
    padding: 10px 12px;
  }

  .mode-grid,
  .mode-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .input-mode-btns {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .input-mode-btn {
    flex-direction: column;
    gap: 6px;
    text-align: center;
  }

  .input-mode-btn small {
    display: none;
  }

  .text-input-bar {
    grid-template-columns: 1fr;
  }

  .conversation {
    min-height: 260px;
    max-height: 46vh;
    border-radius: 22px;
  }

  .session-side-controls {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .intake-card-list {
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
  }

  .analytics-shell { padding: 16px; }
  .list-summary { max-width: 200px; }
  .appt-table-wrap { overflow-x: auto; }
  .appt-form-grid { grid-template-columns: 1fr; }
}

.appt-page-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.appt-page-tab {
  min-height: 44px;
  padding: 10px 18px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 900;
  background: var(--aggie-blue);
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}
.appt-page-tab:hover,
.appt-page-tab:focus-visible {
  background: var(--aggie-gold-soft);
  color: var(--aggie-blue);
}
.appt-page-tab.active {
  background: var(--aggie-gold);
  color: var(--aggie-blue);
  box-shadow: inset 0 0 0 1px rgba(13, 39, 78, 0.1);
}
.appt-count { background: rgba(255,255,255,0.25); border-radius: 99px; padding: 1px 7px; font-size: 0.75rem; }
.appt-page-tab:not(.active) .appt-count { background: rgba(255,255,255,0.2); }
.appt-page-tab:hover .appt-count,
.appt-page-tab:focus-visible .appt-count,
.appt-page-tab.active .appt-count { background: rgba(13, 39, 78, 0.1); }

.doctor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-top: 16px; }
.doctor-card { background: rgba(13, 39, 78, 0.04); border: 1px solid var(--aggie-border); border-radius: 14px; padding: 16px; }
.doctor-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.doctor-name { font-weight: 700; font-size: 1rem; margin: 0 0 2px; }
.doctor-spec { font-size: 0.82rem; color: var(--aggie-blue-mid); font-weight: 600; margin: 0 0 2px; }
.doctor-meta { font-size: 0.78rem; color: var(--aggie-muted); margin: 0; }
.slot-counts { display: flex; flex-direction: column; gap: 4px; text-align: right; }
.slot-available { font-size: 0.78rem; color: var(--aggie-blue-mid); font-weight: 700; }
.slot-booked { font-size: 0.78rem; color: #b38b08; }
.slot-list { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.slot-chip { font-size: 0.75rem; padding: 3px 8px; border-radius: 8px; }
.slot-chip.available { background: var(--aggie-blue-soft); color: var(--aggie-blue); }
.slot-chip.more, .slot-chip.none { background: var(--aggie-gold-soft); color: var(--aggie-muted); }
.add-slot-btn { font-size: 0.8rem; padding: 5px 12px; border-radius: 8px; cursor: pointer; background: var(--aggie-gold); color: var(--aggie-blue); font-weight: 600; border: none; }

.slot-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
.slot-row input { padding: 8px 10px; border: 1px solid var(--aggie-border); border-radius: 8px; font: inherit; font-size: 0.88rem; }
.add-slot-inline { font-size: 0.82rem; color: var(--aggie-blue-mid); font-weight: 600; background: none; border: none; cursor: pointer; padding: 4px 0; }
.doctor-form-actions {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 18px;
  flex-wrap: wrap;
}
.doctor-save-button {
  min-width: 190px;
  white-space: nowrap;
}

.appt-table-wrap { overflow-x: auto; margin-top: 16px; }
.appt-table {
  width: 100%; border-collapse: collapse; font-size: 0.88rem;
}
.appt-table th {
  text-align: left; padding: 8px 12px; background: var(--aggie-blue-soft);
  font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--aggie-blue);
  border-bottom: 1px solid var(--aggie-border);
}
.appt-table td { padding: 10px 12px; border-bottom: 1px solid rgba(13, 39, 78, 0.08); vertical-align: top; }
.appt-row:hover td { background: rgba(13, 39, 78, 0.03); }
.bot-row td:first-child { border-left: 3px solid var(--aggie-gold); }
.appt-name { font-weight: 600; white-space: nowrap; }
.appt-reason { max-width: 260px; }
.appt-notes { color: var(--aggie-muted); font-size: 0.82rem; }
.appt-time { white-space: nowrap; font-weight: 600; color: var(--aggie-blue); }
.urgency-chip {
  display: inline-block; padding: 2px 8px; border-radius: 99px;
  color: var(--aggie-blue); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em;
}
.source-chip {
  display: inline-block; padding: 2px 8px; border-radius: 99px;
  font-size: 0.72rem; font-weight: 600;
}
.source-chip.bot { background: var(--aggie-gold-soft); color: var(--aggie-blue); }
.source-chip.staff { background: var(--aggie-blue-soft); color: var(--aggie-blue-mid); }
.facility-cell { display: flex; flex-direction: column; gap: 2px; }
.facility-city { font-size: 0.75rem; color: var(--aggie-muted); }
.appt-status { font-size: 0.82rem; color: var(--aggie-blue-mid); text-transform: capitalize; }
.appt-status.pending { color: #b38b08; }
.appt-status.confirmed { color: var(--aggie-blue-mid); }
.appt-status.completed { color: var(--aggie-muted); }
.appt-status.cancelled { color: #be2020; text-decoration: line-through; }
.appt-actions { display: flex; gap: 6px; white-space: nowrap; }
.appt-actions button {
  padding: 4px 10px; border-radius: 8px; cursor: pointer; font-size: 0.8rem;
  background: var(--aggie-blue-soft); color: var(--aggie-blue); font-weight: 600;
}
.appt-actions .cancel-btn { background: #fde8e8; color: #be2020; }
.add-appt-btn {
  padding: 8px 18px; border-radius: 12px; cursor: pointer;
  background: var(--aggie-blue); color: #fff; font-weight: 600; font-size: 0.9rem;
}
.appt-form {
  background: rgba(13, 39, 78, 0.04); border: 1px solid var(--aggie-border);
  border-radius: 16px; padding: 20px; margin: 16px 0;
}
.appt-form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;
}
.appt-form-wide { grid-column: 1 / -1; }
.appt-form label { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; font-weight: 600; color: var(--aggie-blue); }
.appt-form input, .appt-form select {
  padding: 8px 12px; border: 1px solid var(--aggie-border); border-radius: 8px;
  font: inherit; font-size: 0.9rem; background: #fff;
}

/* ── Support Services ── */
.access-checklist {
  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;
}
.access-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 600;
}
.access-badge.ok { background: #d6f0e4; color: #1a5c38; }
.access-badge.warn { background: #fde8d0; color: #8a3a00; }

.care-circle {
  background: linear-gradient(135deg, #f0f7ff, #e8f4fd);
  border: 1px solid rgba(13,39,78,0.14); border-radius: 12px;
  padding: 14px 16px; margin: 12px 0;
  min-width: 0;
}
.care-circle-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
}
.care-circle-rel { color: #6b7a74; font-size: 0.85rem; }
.care-circle-phone { font-size: 0.82rem; color: #3a6080; margin-top: 2px; }
.care-circle-notify {
  background: #0d274e; color: #fff; padding: 6px 14px;
  border-radius: 20px; font-size: 0.8rem; font-weight: 600;
  cursor: pointer; white-space: nowrap; flex-shrink: 0;
}
.care-circle-notify:hover { background: #154872; }

.barrier-toggle {
  background: none; color: #8a3a00; font-size: 0.78rem; font-weight: 600;
  cursor: pointer; padding: 0; text-decoration: underline;
  margin-top: 8px; display: inline-block;
}
.barrier-form {
  background: #fdf6ed; border: 1px solid rgba(216,109,31,0.2);
  border-radius: 12px; padding: 14px 16px; margin: 10px 0;
  min-width: 0;
}
.barrier-form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 8px 0;
}
.barrier-form select, .barrier-form input {
  width: 100%;
  min-width: 0;
  padding: 7px 10px; border: 1px solid rgba(216,109,31,0.25);
  border-radius: 8px; font: inherit; font-size: 0.85rem; background: #fff;
}
.barrier-form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.barrier-submit {
  background: #d86d1f; color: #fff; padding: 6px 16px;
  border-radius: 20px; font-size: 0.82rem; font-weight: 600; cursor: pointer;
}
.barrier-form-actions button:not(.barrier-submit) {
  background: var(--aggie-blue-soft);
  color: var(--aggie-blue);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}
.barrier-submit:hover { background: #b85a10; }
.barrier-thanks { color: #3a7d5a; font-weight: 600; font-size: 0.85rem; }

/* ── Landing Page ── */
.landing-shell {
  min-height: 100vh; display: flex; flex-direction: column; color: #fff;
  background: url('/landing-bg.png') center center / 130% no-repeat fixed;
  position: relative;
}
.landing-shell::before {
  content: ''; position: fixed; inset: 0;
  background: linear-gradient(160deg, rgba(8,24,50,0.72) 0%, rgba(13,39,78,0.60) 50%, rgba(5,18,38,0.75) 100%);
  z-index: 0; pointer-events: none;
}
.landing-shell > * { position: relative; z-index: 1; }
.landing-nav { display: flex; align-items: center; justify-content: space-between; padding: 18px 40px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.landing-nav-brand { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.5px; color: var(--aggie-gold); }
.landing-nav-actions { display: flex; gap: 10px; }
.landing-nav-actions a { color: #fff; font-size: 0.9rem; font-weight: 600; text-decoration: none; padding: 7px 18px; border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; transition: background 0.15s; }
.landing-nav-actions a:hover { background: rgba(255,255,255,0.1); }
.landing-hero { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 28px 24px 60px; gap: 24px; transform: translateY(-24px); }
.landing-eyebrow { font-size: 0.8rem; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--aggie-gold); }
.landing-hero h1 { font-size: clamp(2.4rem, 6vw, 4rem); font-weight: 900; letter-spacing: -1px; line-height: 1.1; margin: 0; color: var(--aggie-gold); }
.landing-hero p { font-size: 1.15rem; color: rgba(255,255,255,0.75); max-width: 520px; line-height: 1.6; margin: 0; }
.landing-ctas { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
.landing-ctas .btn-primary { background: transparent; color: #fff; font-weight: 700; font-size: 1rem; padding: 14px 32px; border-radius: 30px; border: 2px solid #fff; cursor: pointer; transition: background 0.2s, color 0.2s, border-color 0.2s; }
.landing-ctas .btn-primary:hover { background: var(--aggie-gold); color: var(--aggie-blue); border-color: var(--aggie-gold); }
.landing-ctas .btn-ghost { background: transparent; color: #fff; font-weight: 700; font-size: 1rem; padding: 14px 32px; border-radius: 30px; border: 2px solid #fff; cursor: pointer; transition: background 0.2s, color 0.2s, border-color 0.2s; }
.landing-ctas .btn-ghost:hover { background: var(--aggie-gold); color: var(--aggie-blue); border-color: var(--aggie-gold); }
.landing-languages { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 8px 24px 36px; }
.landing-languages-label { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.45); margin: 0; }
.landing-languages-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; max-width: 760px; }
.lang-chip { display: inline-flex; align-items: center; gap: 6px; border-radius: 30px; padding: 9px 22px; font-size: 1rem; font-weight: 600; white-space: nowrap; cursor: default; }
.lang-chip-primary { background: rgba(255,255,255,0.12); border: 2px solid rgba(255,255,255,0.3); color: #fff; letter-spacing: 0.01em; }
.lang-chip-more { background: var(--aggie-gold); border: 2px solid var(--aggie-gold); color: var(--aggie-blue); font-weight: 700; }
.landing-features { display: grid; grid-template-columns: repeat(4, minmax(0, 220px)); justify-content: center; gap: 20px; padding: 16px 40px 60px; max-width: 1100px; margin: -18px auto 0; width: 100%; }
.landing-feature { display: flex; flex-direction: column; justify-content: flex-start; min-height: 220px; background: rgba(255,255,255,0.07); border-radius: 14px; padding: 24px; text-align: center; }
.landing-feature h3 { display: flex; align-items: flex-start; justify-content: center; min-height: 52px; font-size: 1rem; font-weight: 700; margin: 0 0 10px; color: var(--aggie-gold); line-height: 1.3; text-wrap: balance; }
.landing-feature p { font-size: 0.88rem; color: rgba(255,255,255,0.65); line-height: 1.5; margin: 0; }

/* ── Auth Page ── */
.auth-shell { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--aggie-blue-soft); padding: 24px; }
.auth-card { background: #fff; border-radius: 18px; box-shadow: 0 8px 40px rgba(13,39,78,0.12); padding: 40px 36px; width: 100%; max-width: 420px; }
.auth-card h1 { font-size: 1.6rem; font-weight: 800; color: var(--aggie-blue); margin: 0 0 4px; }
.auth-card .auth-subtitle { color: var(--aggie-muted); font-size: 0.9rem; margin: 0 0 28px; }
.auth-tabs { display: flex; gap: 0; border: 1px solid var(--aggie-blue-soft); border-radius: 10px; overflow: hidden; margin-bottom: 24px; }
.auth-tab { flex: 1; padding: 10px; font-size: 0.9rem; font-weight: 600; border: none; background: transparent; cursor: pointer; color: var(--aggie-muted); transition: background 0.15s; }
.auth-tab.active { background: var(--aggie-blue); color: #fff; }
.auth-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.auth-field label { font-size: 0.8rem; font-weight: 600; color: var(--aggie-blue); }
.auth-field input { border: 1px solid #d0dbe8; border-radius: 8px; padding: 10px 12px; font: inherit; font-size: 0.95rem; transition: border-color 0.15s; }
.auth-field input:focus { outline: none; border-color: var(--aggie-blue); }
.auth-error { background: #fef2f2; color: var(--aggie-danger); font-size: 0.85rem; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; }
.auth-submit { width: 100%; padding: 12px; background: var(--aggie-blue); color: #fff; font-weight: 700; font-size: 1rem; border: none; border-radius: 10px; cursor: pointer; margin-top: 4px; transition: opacity 0.15s; }
.auth-submit:hover { opacity: 0.88; }
.auth-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.auth-back { text-align: center; margin-top: 20px; font-size: 0.85rem; color: var(--aggie-muted); }
.auth-back a { color: var(--aggie-blue); font-weight: 600; text-decoration: none; }
.auth-back a:hover { text-decoration: underline; }
.pw-strength { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }
.pw-strength-bar { display: flex; align-items: center; gap: 4px; }
.pw-strength-seg { flex: 1; height: 4px; border-radius: 2px; transition: background 0.2s; }
.pw-checklist { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 3px; }
.pw-checklist li { font-size: 0.78rem; display: flex; gap: 5px; align-items: center; transition: color 0.2s; }
.pw-match { font-size: 0.78rem; font-weight: 700; margin-top: 4px; }
.pw-match.ok { color: #2e7d52; }
.pw-match.no { color: #be2020; }

/* ── Settings Page ── */
.settings-shell { min-height: 100vh; background: var(--aggie-blue-soft); padding: 32px 24px; }
.settings-inner { max-width: 680px; margin: 0 auto; }
.settings-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
.settings-header h1 { font-size: 1.7rem; font-weight: 800; color: var(--aggie-blue); margin: 0; }
.settings-back { color: var(--aggie-muted); text-decoration: none; font-size: 0.88rem; font-weight: 600; display: flex; align-items: center; gap: 4px; }
.settings-back:hover { color: var(--aggie-blue); }
.settings-section { background: #fff; border-radius: 16px; padding: 24px 28px; margin-bottom: 20px; box-shadow: 0 2px 12px rgba(13,39,78,0.06); }
.settings-section h2 { font-size: 1rem; font-weight: 700; color: var(--aggie-blue); margin: 0 0 18px; padding-bottom: 12px; border-bottom: 1px solid var(--aggie-blue-soft); }
.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.settings-grid.full { grid-template-columns: 1fr; }
.settings-field { display: flex; flex-direction: column; gap: 5px; }
.settings-field label { font-size: 0.78rem; font-weight: 700; color: var(--aggie-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.settings-field input, .settings-field select { border: 1px solid #d0dbe8; border-radius: 8px; padding: 9px 12px; font: inherit; font-size: 0.92rem; background: #fff; transition: border-color 0.15s; }
.settings-field input:focus, .settings-field select:focus { outline: none; border-color: var(--aggie-blue); }
.settings-save { margin-top: 18px; background: var(--aggie-blue); color: #fff; font-weight: 700; font-size: 0.9rem; padding: 10px 24px; border: none; border-radius: 10px; cursor: pointer; transition: opacity 0.15s; }
.settings-save:hover { opacity: 0.85; }
.settings-save:disabled { opacity: 0.5; cursor: not-allowed; }
.settings-success { color: #2e7d52; font-size: 0.85rem; font-weight: 600; margin-top: 10px; }
.settings-error { color: var(--aggie-danger); font-size: 0.85rem; font-weight: 600; margin-top: 10px; }
.settings-danger h2 { color: var(--aggie-danger); border-bottom-color: #fde8e8; }
@media (max-width: 560px) {
  .settings-grid { grid-template-columns: 1fr; }
  .auth-card { padding: 28px 20px; }
  .landing-nav { padding: 16px 20px; }
  .landing-features { padding: 24px 20px 40px; }
}

@media (max-width: 980px) {
  .landing-features { grid-template-columns: repeat(2, minmax(0, 240px)); }
}

@media (max-width: 560px) {
  .landing-features { grid-template-columns: minmax(0, 1fr); }
}

/* ===== /navigate page ===== */
.nav-shell { min-height: 100vh; background: #f4f6fb; display: flex; flex-direction: column; }
.nav-topbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 28px; background: var(--aggie-blue); color: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.nav-brand { color: var(--aggie-gold); font-weight: 800; font-size: 1.1rem; text-decoration: none; letter-spacing: -0.3px; }
.nav-topnav { display: flex; gap: 18px; align-items: center; }
.nav-topnav a { color: #fff; text-decoration: none; font-weight: 600; font-size: 0.9rem; opacity: 0.85; }
.nav-topnav a:hover { opacity: 1; }
.nav-user { font-size: 0.8rem; opacity: 0.6; }
.nav-main { flex: 1; display: grid; grid-template-columns: minmax(380px, 460px) 1fr; gap: 0; min-height: 0; }
.nav-panel { padding: 28px 32px; overflow-y: auto; background: #fff; border-right: 1px solid #e6e9ef; max-height: calc(100vh - 56px); }
.nav-title { font-size: 1.6rem; font-weight: 800; color: var(--aggie-blue); margin: 0 0 8px; letter-spacing: -0.5px; }
.nav-sub { font-size: 0.92rem; color: #5a6378; line-height: 1.5; margin: 0 0 22px; }
.nav-search { position: relative; margin-bottom: 18px; }
.nav-input { width: 100%; padding: 14px 16px; border: 2px solid #e0e4ec; border-radius: 12px; font-size: 1rem; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
.nav-input:focus { border-color: var(--aggie-blue); }
.nav-suggestions { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1px solid #e0e4ec; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); list-style: none; padding: 6px 0; margin: 0; z-index: 10; max-height: 280px; overflow-y: auto; }
.nav-suggestions li button { width: 100%; text-align: left; background: none; border: none; padding: 10px 16px; cursor: pointer; font-size: 0.92rem; color: #2a3142; }
.nav-suggestions li button:hover { background: #f4f6fb; }
.nav-question { background: linear-gradient(135deg, #fff8e1, #fff3cd); border: 1px solid #ffe39a; border-radius: 14px; padding: 18px 20px; margin-bottom: 18px; }
.nav-question-label { font-weight: 700; color: #5a4500; margin-bottom: 12px; font-size: 0.98rem; }
.nav-question-row { display: flex; gap: 10px; }
.nav-question-grid { display: grid; gap: 8px; }
.nav-question-hint { margin-top: 10px; font-size: 0.78rem; color: #8a7400; }
.nav-chip { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 18px; border: 1.5px solid #d8dde7; background: #fff; font-size: 0.85rem; font-weight: 600; color: #2a3142; cursor: pointer; transition: all 0.15s; text-decoration: none; }
.nav-chip:hover { border-color: var(--aggie-blue); color: var(--aggie-blue); }
.nav-chip-on { background: #e7efff; border-color: var(--aggie-blue); color: var(--aggie-blue); cursor: default; }
.nav-chip-link { background: transparent; border-style: dashed; }
.nav-chips-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.nav-dest { background: #f9fbff; border: 1px solid #dfe5ef; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; }
.nav-dest-name { font-weight: 700; color: #1a2440; font-size: 1rem; }
.nav-dest-addr { font-size: 0.85rem; color: #5a6378; margin-top: 2px; }
.nav-warning { margin-top: 10px; padding: 10px 12px; background: #fdecea; border-left: 3px solid var(--aggie-danger); border-radius: 6px; font-size: 0.85rem; color: #7a1d1d; }
.nav-ok { margin-top: 10px; padding: 8px 12px; background: #e8f5ec; border-left: 3px solid #2e7d52; border-radius: 6px; font-size: 0.85rem; color: #1f5836; }
.nav-link-btn { display: inline-block; margin-top: 6px; background: none; border: none; color: var(--aggie-blue); font-weight: 700; cursor: pointer; padding: 0; text-decoration: underline; font-size: 0.85rem; }
.nav-mode-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: #f0f3f9; padding: 5px; border-radius: 12px; margin-bottom: 12px; }
.nav-tab { position: relative; padding: 10px 8px; background: transparent; border: none; border-radius: 8px; font-weight: 700; font-size: 0.85rem; color: #5a6378; cursor: pointer; transition: all 0.15s; }
.nav-tab:hover { color: var(--aggie-blue); }
.nav-tab-active { background: #fff; color: var(--aggie-blue); box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.nav-tab-badge { display: block; font-size: 0.62rem; font-weight: 700; color: var(--aggie-gold); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
.nav-reason { font-size: 0.85rem; color: #5a6378; padding: 8px 4px 16px; line-height: 1.45; }
.nav-route { background: #f9fbff; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; border: 1px solid #dfe5ef; }
.nav-route-summary { display: flex; gap: 14px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #e6ebf3; }
.nav-route-time { font-size: 1.4rem; font-weight: 800; color: var(--aggie-blue); }
.nav-route-dist { font-size: 0.95rem; color: #5a6378; align-self: flex-end; padding-bottom: 4px; }
.nav-steps { padding: 0 0 0 18px; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.nav-step { font-size: 0.88rem; color: #2a3142; line-height: 1.45; }
.nav-step-meta { display: block; font-size: 0.75rem; color: #8a93a6; margin-top: 2px; }
.nav-step-transit { margin-top: 4px; padding: 6px 10px; background: #fff; border-radius: 6px; font-size: 0.8rem; color: #1a2440; }
.nav-uber-btn { display: block; text-align: center; padding: 14px 18px; background: #000; color: #fff; border-radius: 12px; font-weight: 700; text-decoration: none; margin-bottom: 16px; transition: opacity 0.15s; }
.nav-uber-btn:hover { opacity: 0.85; }
.nav-error { padding: 10px 14px; background: #fdecea; color: #7a1d1d; border-radius: 8px; font-size: 0.85rem; margin-bottom: 12px; }
.nav-busy { font-size: 0.85rem; color: #5a6378; padding: 8px 0; }
.nav-map-wrap { position: relative; min-height: 0; }
.nav-map { width: 100%; height: 100%; min-height: 400px; }
.nav-map-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; color: #8a93a6; font-size: 0.9rem; padding: 32px; text-align: center; }
.nav-geo-hint { position: absolute; top: 14px; right: 14px; background: #fff; padding: 6px 12px; border-radius: 18px; font-size: 0.78rem; color: #5a6378; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
@media (max-width: 880px) {
  .nav-main { grid-template-columns: 1fr; }
  .nav-panel { max-height: none; border-right: none; border-bottom: 1px solid #e6e9ef; }
  .nav-map { height: 360px; }
}

/* ── shadcn/ui reconstruction layer ──────────────────────── */
.cc-card,
.queue-panel,
.mode-picker,
.intake-card,
.intake-card-list,
.auth-card,
.settings-section,
.doctor-card,
.summary-stat,
.chart-card,
.draft-panel,
.care-circle,
.nav-dest,
.nav-route,
.nav-question,
.resource-list {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--card-foreground);
  box-shadow: var(--shadow-sm);
}

.queue-panel,
.mode-picker,
.auth-card,
.settings-section,
.chart-card {
  box-shadow: var(--shadow-md);
}

.cc-card-header {
  display: grid;
  gap: 6px;
  padding: 24px 24px 0;
}

.cc-card-title {
  margin: 0;
  color: var(--foreground);
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.cc-card-description {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 0.92rem;
  line-height: 1.5;
}

.cc-card-content {
  padding: 24px;
}

.cc-button,
.staff-tab,
.category-tab,
.appt-page-tab,
.date-tab,
.mode-tab,
.new-intake-button,
.view-toggle button,
.start-session-button,
.auth-submit,
.settings-save,
.review-button,
.list-action-btn,
.camera-button,
.care-circle-notify,
.add-slot-btn,
.barrier-submit,
.patient-topnav-link,
.landing-ctas .btn-primary,
.landing-ctas .btn-ghost,
.nav-chip,
.nav-tab,
.nav-uber-btn,
.map-banner-btn {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: var(--radius);
  background: var(--primary);
  color: var(--primary-foreground);
  box-shadow: var(--shadow-sm);
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}

.cc-button:hover:not(:disabled),
.staff-tab:hover,
.category-tab:hover,
.appt-page-tab:hover,
.date-tab:hover,
.mode-tab:hover,
.new-intake-button:hover,
.view-toggle button:hover,
.start-session-button:hover:not(:disabled),
.auth-submit:hover:not(:disabled),
.settings-save:hover:not(:disabled),
.review-button:hover:not(:disabled),
.list-action-btn:hover:not(:disabled),
.camera-button:hover,
.care-circle-notify:hover,
.add-slot-btn:hover,
.barrier-submit:hover,
.patient-topnav-link:hover,
.landing-ctas .btn-primary:hover,
.landing-ctas .btn-ghost:hover,
.nav-chip:hover,
.nav-tab:hover,
.nav-uber-btn:hover,
.map-banner-btn:hover {
  background: var(--accent);
  color: var(--accent-foreground);
  border-color: var(--border);
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.16);
}

.staff-tab.active,
.category-tab.active,
.appt-page-tab.active,
.date-tab.is-selected,
.mode-tab.is-selected,
.view-toggle button.is-active,
.auth-tab.active,
.nav-tab-active,
.nav-chip-on,
.cc-button-secondary {
  background: var(--secondary);
  color: var(--secondary-foreground);
  border-color: var(--border);
}

.cc-button-ghost,
.auth-tab,
.patient-topnav-link,
.settings-back,
.nav-chip,
.nav-tab {
  background: var(--background);
  color: var(--foreground);
  border-color: var(--border);
}

.cc-button-destructive,
.patient-topnav-link.is-danger,
.cancel-btn,
.alert-banner button {
  background: var(--destructive);
  color: var(--destructive-foreground);
}

.cc-button:disabled,
.start-session-button:disabled,
.auth-submit:disabled,
.settings-save:disabled,
.review-button:disabled,
.list-action-btn:disabled,
.input-mode-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.cc-input,
input:not([type="checkbox"]):not([type="radio"]),
select,
textarea,
.nav-input,
.filter-bar select,
.filter-bar input,
.settings-field input,
.settings-field select,
.auth-field input,
.appt-form input,
.appt-form select,
.barrier-form input,
.barrier-form select {
  min-height: 40px;
  border: 1px solid var(--input);
  border-radius: var(--radius);
  background: var(--background);
  color: var(--foreground);
  box-shadow: var(--shadow-sm);
  font-size: 0.95rem;
}

.cc-input:focus,
input:not([type="checkbox"]):not([type="radio"]):focus,
select:focus,
textarea:focus,
.nav-input:focus,
.filter-bar select:focus,
.filter-bar input:focus,
.settings-field input:focus,
.settings-field select:focus,
.auth-field input:focus,
.appt-form input:focus,
.appt-form select:focus,
.barrier-form input:focus,
.barrier-form select:focus {
  border-color: var(--ring);
  outline: 3px solid rgba(148, 163, 184, 0.22);
  outline-offset: 2px;
}

.cc-badge,
.badge,
.mode-badge,
.status-pill,
.cat-count,
.appt-count,
.slot-chip,
.source-chip,
.access-badge,
.lang-chip {
  display: inline-flex;
  min-height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid transparent;
  font-weight: 700;
  line-height: 1;
}

.mode-badge,
.status-pill,
.cc-badge-secondary {
  background: var(--secondary);
  color: var(--secondary-foreground);
  border-color: var(--border);
}

.queue-controls .status-pill {
  background: var(--secondary);
  color: var(--secondary-foreground);
  border-color: var(--border);
}

.brand-lockup h1,
.staff-header .brand-lockup h1,
.patient-header .brand-lockup h1,
.queue-header h2,
.auth-card h1,
.cc-card-title {
  color: var(--foreground);
}

.brand-lockup h1::after {
  background: var(--aggie-gold);
}

.start-session-button,
.auth-submit,
.settings-save,
.landing-ctas .btn-primary,
.map-banner-btn,
.text-input-bar button {
  background: var(--aggie-blue);
  color: #ffffff;
  border-color: var(--aggie-blue);
}

.start-session-button:hover:not(:disabled),
.auth-submit:hover:not(:disabled),
.settings-save:hover:not(:disabled),
.landing-ctas .btn-primary:hover,
.map-banner-btn:hover,
.text-input-bar button:hover {
  background: var(--aggie-blue);
  color: #ffffff;
  border-color: var(--aggie-blue);
  box-shadow: 0 0 0 3px rgba(13, 39, 78, 0.16);
}

.staff-tab.active,
.category-tab.active,
.appt-page-tab.active,
.date-tab.is-selected,
.mode-tab.is-selected,
.view-toggle button.is-active,
.auth-tab.active,
.nav-tab-active,
.nav-chip-on,
.mode-option.is-selected,
.input-mode-btn.is-speech.is-selected,
.input-mode-btn.is-camera.is-selected,
.input-mode-btn.is-text.is-selected,
.input-mode-btn.is-speech:active:not(:disabled),
.input-mode-btn.is-camera:active:not(:disabled),
.input-mode-btn.is-text:active:not(:disabled) {
  background: var(--aggie-gold);
  color: var(--foreground);
  border-color: var(--aggie-gold);
}

.input-mode-btn.is-speech:hover:not(:disabled),
.input-mode-btn.is-camera:hover:not(:disabled),
.input-mode-btn.is-text:hover:not(:disabled),
.mode-option:hover,
.mode-option:focus-visible {
  background: var(--accent);
  color: var(--foreground);
  border-color: var(--aggie-blue);
  box-shadow: inset 0 0 0 1px var(--aggie-blue);
}

.mode-option:hover span,
.mode-option:focus-visible span,
.input-mode-btn:hover small {
  color: var(--muted-foreground);
}

.input-mode-btn.is-speech,
.input-mode-btn.is-camera,
.input-mode-btn.is-text,
.mode-option,
.staff-tab,
.category-tab,
.appt-page-tab,
.date-tab,
.mode-tab,
.view-toggle button,
.new-intake-button,
.review-button,
.list-action-btn,
.camera-button,
.care-circle-notify,
.add-slot-btn,
.barrier-submit,
.landing-ctas .btn-ghost,
.nav-uber-btn {
  background: var(--secondary);
  color: var(--secondary-foreground);
  border-color: var(--border);
  box-shadow: none;
}

.mode-option.is-selected,
.input-mode-btn.is-speech.is-selected,
.input-mode-btn.is-camera.is-selected,
.input-mode-btn.is-text.is-selected {
  background: var(--aggie-gold);
  color: var(--foreground);
  border-color: var(--aggie-gold);
}

.mode-option.is-selected span {
  color: var(--foreground);
}

.mode-option span,
.input-mode-btn small {
  color: var(--muted-foreground);
  opacity: 1;
}

.auth-shell,
.settings-shell,
.analytics-shell,
.staff-shell,
.patient-shell,
.nav-shell {
  background: var(--background);
}

.appt-table {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.appt-table th {
  background: var(--muted);
}

.staff-shell .staff-tab,
.staff-shell .appt-page-tab,
.staff-shell .view-toggle button,
.staff-shell .add-slot-btn,
.staff-shell .add-slot-inline,
.staff-shell .appt-actions button {
  background: var(--aggie-blue);
  color: #ffffff;
  border-color: var(--aggie-blue);
}

.staff-shell .staff-tab:hover,
.staff-shell .staff-tab:focus-visible,
.staff-shell .appt-page-tab:hover,
.staff-shell .appt-page-tab:focus-visible,
.staff-shell .view-toggle button:hover,
.staff-shell .view-toggle button:focus-visible,
.staff-shell .add-slot-btn:hover,
.staff-shell .add-slot-btn:focus-visible,
.staff-shell .appt-actions button:hover,
.staff-shell .appt-actions button:focus-visible {
  background: var(--aggie-gold-soft);
  color: var(--aggie-blue);
  border-color: var(--aggie-gold);
  box-shadow: 0 0 0 3px rgba(245, 194, 66, 0.18);
}

.staff-shell .staff-tab.active,
.staff-shell .category-tab.active,
.staff-shell .appt-page-tab.active,
.staff-shell .view-toggle button.is-active {
  background: var(--aggie-gold);
  color: var(--aggie-blue);
  border-color: var(--aggie-gold);
}

.staff-shell .category-tab,
.staff-shell .queue-controls .status-pill,
.staff-shell .appt-count,
.staff-shell .slot-available,
.staff-shell .slot-chip.available {
  background: var(--aggie-blue);
  color: #ffffff;
  border-color: var(--aggie-blue);
}

.staff-shell .category-tab:hover,
.staff-shell .category-tab:focus-visible {
  background: var(--aggie-gold-soft);
  color: var(--aggie-blue);
  border-color: var(--aggie-gold);
}

.staff-shell .category-tab.active .cat-count,
.staff-shell .appt-page-tab.active .appt-count,
.staff-shell .category-tab:hover .cat-count,
.staff-shell .appt-page-tab:hover .appt-count {
  background: rgba(13, 39, 78, 0.14);
  color: var(--aggie-blue);
}

.staff-shell .doctor-card {
  border-color: rgba(13, 39, 78, 0.14);
  box-shadow: none;
}

.staff-shell .doctor-card:hover {
  border-color: var(--aggie-blue);
}

.staff-shell .slot-chip.more,
.staff-shell .slot-chip.none {
  background: var(--aggie-gold-soft);
  color: var(--aggie-blue);
}

.staff-shell .staff-tabs .staff-tab:not(.active),
.staff-shell .appt-page-tabs .appt-page-tab:not(.active),
.staff-shell .view-toggle button:not(.is-active) {
  background: var(--aggie-blue) !important;
  color: #ffffff !important;
  border-color: var(--aggie-blue) !important;
}

.staff-shell .staff-tabs .staff-tab:not(.active):hover,
.staff-shell .staff-tabs .staff-tab:not(.active):focus-visible,
.staff-shell .appt-page-tabs .appt-page-tab:not(.active):hover,
.staff-shell .appt-page-tabs .appt-page-tab:not(.active):focus-visible,
.staff-shell .view-toggle button:not(.is-active):hover,
.staff-shell .view-toggle button:not(.is-active):focus-visible {
  background: var(--aggie-gold-soft) !important;
  color: var(--aggie-blue) !important;
  border-color: var(--aggie-gold) !important;
}

.staff-shell .staff-tabs .staff-tab.active,
.staff-shell .appt-page-tabs .appt-page-tab.active,
.staff-shell .view-toggle button.is-active {
  background: var(--aggie-gold) !important;
  color: var(--aggie-blue) !important;
  border-color: var(--aggie-gold) !important;
}

.staff-shell .appt-page-tab:not(.active) .appt-count {
  background: var(--aggie-gold-soft) !important;
  color: var(--aggie-blue) !important;
}

.staff-shell .appt-page-tab.active .appt-count,
.staff-shell .appt-page-tab:hover .appt-count {
  background: rgba(13, 39, 78, 0.14) !important;
  color: var(--aggie-blue) !important;
}

.patient-card.session-active .session-split-body {
  justify-content: center;
}

.patient-card.session-active .session-left {
  flex: 0 1 980px;
  max-width: 980px;
}

.patient-card.session-active .session-left .conversation {
  min-height: 260px;
  max-height: clamp(300px, 42vh, 460px);
}

.patient-card.session-active .text-input-bar,
.patient-card.session-active .patient-controls {
  max-width: 980px;
}

.patient-card.session-active .camera-preview.is-visible {
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 35;
  display: block;
  width: clamp(220px, 18vw, 320px);
  max-height: 28vh;
  margin: 0;
  border: 3px solid #ffffff;
  border-radius: 20px;
  background: var(--aggie-blue);
  box-shadow: 0 18px 46px rgba(13, 39, 78, 0.24);
  object-fit: cover;
}

.input-mode-btn,
.mode-option {
  border-radius: calc(var(--radius) + 4px);
}

.input-mode-btn:hover:not(:disabled),
.input-mode-btn.is-selected,
.input-mode-btn:active:not(:disabled) {
  box-shadow: none;
}

@media (max-width: 520px) {
  .patient-card.session-active .camera-preview.is-visible {
    position: static;
    width: 100%;
    max-height: none;
    margin: 12px auto 0;
    box-shadow: none;
  }

  .barrier-form-row,
  .status-actions,
  .care-circle-row {
    grid-template-columns: 1fr;
  }

  .care-circle-notify {
    width: 100%;
  }

  .doctor-form-actions {
    align-items: stretch;
    gap: 12px;
  }

  .doctor-save-button {
    width: 100%;
    min-width: 0;
  }
}
`;

function App() {
  return (
    <>
      <style>{styles}</style>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Routes>
        <Route element={<LandingPage />} path="/" />
        <Route element={<AuthPage />} path="/login" />
        <Route element={<AuthPage />} path="/signup" />
        <Route element={<SettingsPage />} path="/settings" />
        <Route element={<PatientView />} path="/user" />
        <Route element={<Navigate replace to="/user" />} path="/patient" />
        <Route element={<StaffView />} path="/staff" />
        <Route element={<AppointmentsView />} path="/staff/appointments" />
        <Route element={<AnalyticsView />} path="/staff/analytics" />
        <Route element={<NavigateView />} path="/navigate" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

export default App;
