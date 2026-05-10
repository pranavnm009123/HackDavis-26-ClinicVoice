import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AnalyticsView from './AnalyticsView.jsx';
import AppointmentsView from './AppointmentsView.jsx';
import PatientView from './PatientView.jsx';
import StaffView from './StaffView.jsx';

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
  --aggie-danger: #be2020;
  --aggie-warning: #b85412;
  color: var(--aggie-blue);
  background: var(--aggie-blue-soft);
  font-family: "Avenir Next", "Gill Sans", "Trebuchet MS", sans-serif;
  font-synthesis: none;
  text-rendering: geometricPrecision;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background:
    radial-gradient(circle at 12% 8%, rgba(13, 39, 78, 0.09), transparent 28rem),
    radial-gradient(circle at 88% 12%, rgba(245, 194, 66, 0.22), transparent 24rem),
    linear-gradient(135deg, #faf8f3 0%, var(--aggie-blue-soft) 48%, #f5efe4 100%);
}

button {
  border: 0;
  font: inherit;
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
}

.patient-shell {
  display: grid;
  place-items: start center;
}

.queue-panel {
  border: 1px solid var(--aggie-border);
  background: rgba(255, 253, 248, 0.92);
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

.patient-header .connection,
.staff-header .connection {
  flex-shrink: 0;
  margin-top: 2px;
}

.brand-lockup {
  flex: 1;
  min-width: 0;
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
  padding: 10px 14px;
  border-radius: 999px;
  background: var(--aggie-blue-soft);
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
  background: #e0edf7;
  color: var(--aggie-blue);
}

.connection.is-live span {
  background: var(--aggie-gold);
  box-shadow: 0 0 0 8px rgba(245, 194, 66, 0.28);
}

.language-strip {
  display: flex;
  justify-content: space-between;
  margin: 28px 0 22px;
  padding: 18px 22px;
  border-radius: 22px;
  background: var(--aggie-blue);
  color: #f5f8fc;
}

.language-strip span {
  color: rgba(255, 255, 255, 0.78);
}

.language-strip strong {
  font-size: 1.4rem;
  letter-spacing: 0.08em;
  color: var(--aggie-gold);
}

.mode-picker {
  display: grid;
  gap: 18px;
  margin-bottom: 22px;
  padding: clamp(22px, 3vw, 40px);
  border: 1px solid var(--aggie-border);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.65);
}


.mode-picker h2 {
  max-width: 860px;
  font-size: clamp(1.5rem, 4vw, 2.3rem);
  letter-spacing: -0.05em;
  line-height: 1.02;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.mode-option {
  min-height: 142px;
  padding: 16px;
  border: 1px solid var(--aggie-border);
  border-radius: 22px;
  background: var(--aggie-gold-soft);
  color: var(--aggie-blue);
  cursor: pointer;
  text-align: left;
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
  color: var(--aggie-muted);
  font-size: 0.9rem;
  line-height: 1.35;
}

.mode-option.is-selected {
  border-color: var(--aggie-blue);
  background: var(--aggie-blue-soft);
  box-shadow: inset 0 0 0 2px rgba(0, 40, 85, 0.2);
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
  background: var(--aggie-blue-soft);
  color: var(--aggie-blue);
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 900;
}

.mode-tab.is-selected {
  background: var(--aggie-blue);
  color: #ffffff;
}

.mode-tab:disabled {
  cursor: default;
  opacity: 0.78;
}

.new-intake-button {
  background: var(--aggie-gold);
  color: var(--aggie-blue);
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
  max-height: min(52vh, 420px);
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  padding: 20px;
  border-radius: 28px;
  background: linear-gradient(180deg, #fffefb, var(--aggie-blue-soft));
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

.badge-critical { background: #be2020; }
.badge-high { background: var(--aggie-warning); }
.badge-medium { background: #b38b08; color: var(--aggie-blue); }
.badge-low { background: var(--aggie-blue-mid); }

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
  background: var(--aggie-blue-soft);
  color: var(--aggie-blue);
  cursor: pointer;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 900;
  text-decoration: none;
  border: 0;
}

.staff-tab.active { background: var(--aggie-blue); color: #fff; }

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
  border: 2px solid transparent;
  cursor: pointer;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 900;
  background: var(--aggie-blue-soft);
  color: var(--aggie-blue);
  transition: background 0.15s, color 0.15s;
}

.cat-count {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 99px;
  font-size: 0.74rem;
  font-weight: 800;
  background: rgba(13, 39, 78, 0.1);
  color: inherit;
}

.category-tab.cat-clinic { border-color: rgba(13, 39, 78, 0.18); }
.category-tab.cat-shelter { border-color: rgba(245, 194, 66, 0.48); }
.category-tab.cat-food_aid { border-color: rgba(13, 39, 78, 0.18); }

.category-tab.cat-all.active,
.category-tab.cat-clinic.active,
.category-tab.cat-food_aid.active { background: var(--aggie-blue); color: #fff; }
.category-tab.cat-shelter.active { background: var(--aggie-gold); color: var(--aggie-blue); }
.category-tab.active .cat-count { background: rgba(255,255,255,0.22); }

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
  background: var(--aggie-blue-soft);
  color: var(--aggie-blue);
  cursor: pointer;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 900;
  border: 0;
}

.view-toggle button.is-active { background: var(--aggie-blue); color: #fff; }

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


/* ── Input mode buttons (speech / camera) ────────────────── */
.input-mode-btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.input-mode-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-height: 172px;
  padding: 28px 18px;
  border-radius: 24px;
  cursor: pointer;
  text-align: center;
  border: none;
  transition: transform 0.12s, box-shadow 0.12s, background 0.18s;
}

.input-mode-btn span {
  font-size: 1rem;
  font-weight: 900;
}

.input-mode-btn small {
  font-size: 0.78rem;
  opacity: 0.72;
  font-weight: 600;
}

.input-mode-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.input-mode-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.voice-mark {
  position: relative;
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  transition: width 0.18s, height 0.18s, background 0.18s, box-shadow 0.18s;
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

.input-mode-btn.is-speech {
  background: var(--aggie-blue);
  color: #ffffff;
  box-shadow: 0 8px 22px rgba(13, 39, 78, 0.24);
}

.input-mode-btn.is-speech:hover:not(:disabled) {
  background: var(--aggie-blue);
  box-shadow: 0 14px 32px rgba(13, 39, 78, 0.32);
}

.input-mode-btn.is-camera {
  background: var(--aggie-gold);
  color: var(--aggie-blue);
  box-shadow: 0 8px 22px rgba(245, 194, 66, 0.3);
}

.input-mode-btn.is-camera:hover:not(:disabled) {
  box-shadow: 0 14px 32px rgba(245, 194, 66, 0.4);
}

.setup-helper-text {
  margin: 0;
  color: var(--aggie-muted);
  font-size: clamp(1rem, 1.8vw, 1.28rem);
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

.analytics-summary-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 28px;
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
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .patient-header,
  .language-strip {
    grid-column: 1 / -1;
  }

  .patient-card.session-setup .mode-picker {
    grid-column: auto;
    margin-bottom: 0;
  }

  .patient-card.session-setup .conversation {
    display: none;
  }

  .patient-card.session-active .conversation,
  .patient-card.session-active .patient-controls,
  .patient-card.session-active .ai-indicator,
  .patient-card.session-active .inline-error {
    grid-column: 1 / -1;
  }

  .patient-card.session-active .conversation {
    min-height: 460px;
    max-height: 560px;
  }

  .patient-card.session-active .patient-controls {
    margin-top: 0;
  }

  .patient-card.session-active .session-side-controls {
    flex-direction: row;
    justify-content: center;
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

  .intake-grid,
  .cards-grid,
  .filter-bar,
  .mode-grid,
  .input-mode-btns,
  .analytics-summary-row,
  .chart-grid {
    grid-template-columns: 1fr;
  }

  .patient-header .brand-lockup h1 {
    font-size: 3.2rem;
    line-height: 0.86;
  }

  .brand-tagline {
    font-size: 0.9rem;
  }

  .language-strip {
    margin: 20px 0 16px;
    padding: 14px 16px;
  }

  .mode-picker {
    padding: 16px;
    border-radius: 22px;
  }

  .mode-picker h2 {
    font-size: 1.55rem;
    line-height: 1.08;
  }

  .mode-option {
    min-height: auto;
  }

  .input-mode-btn {
    padding: 18px 16px;
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

.appt-page-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.appt-page-tab {
  padding: 8px 18px; border-radius: 20px; cursor: pointer; font-size: 0.88rem;
  font-weight: 600; background: var(--aggie-blue-soft); color: var(--aggie-blue); border: none;
  display: flex; align-items: center; gap: 6px;
}
.appt-page-tab.active { background: var(--aggie-blue); color: #fff; }
.appt-count { background: rgba(255,255,255,0.25); border-radius: 99px; padding: 1px 7px; font-size: 0.75rem; }
.appt-page-tab:not(.active) .appt-count { background: rgba(13, 39, 78, 0.12); }

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
}
.care-circle-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 6px;
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
}
.barrier-form-row {
  display: flex; gap: 8px; margin: 8px 0;
}
.barrier-form select, .barrier-form input {
  flex: 1; padding: 7px 10px; border: 1px solid rgba(216,109,31,0.25);
  border-radius: 8px; font: inherit; font-size: 0.85rem; background: #fff;
}
.barrier-form-actions { display: flex; gap: 8px; margin-top: 10px; }
.barrier-submit {
  background: #d86d1f; color: #fff; padding: 6px 16px;
  border-radius: 20px; font-size: 0.82rem; font-weight: 600; cursor: pointer;
}
.barrier-submit:hover { background: #b85a10; }
.barrier-thanks { color: #3a7d5a; font-weight: 600; font-size: 0.85rem; }
`;

function App() {
  return (
    <>
      <style>{styles}</style>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Routes>
        <Route element={<PatientView />} path="/patient" />
        <Route element={<StaffView />} path="/staff" />
        <Route element={<AppointmentsView />} path="/staff/appointments" />
        <Route element={<AnalyticsView />} path="/staff/analytics" />
        <Route element={<Navigate replace to="/patient" />} path="*" />
      </Routes>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

export default App;
