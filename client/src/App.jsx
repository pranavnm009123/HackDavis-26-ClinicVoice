import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AnalyticsView from './AnalyticsView.jsx';
import AppointmentsView from './AppointmentsView.jsx';
import PatientView from './PatientView.jsx';
import StaffView from './StaffView.jsx';

const styles = `
:root {
  color: #143329;
  background: #eef5ec;
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
    radial-gradient(circle at 12% 8%, rgba(111, 191, 147, 0.28), transparent 28rem),
    radial-gradient(circle at 88% 12%, rgba(250, 191, 120, 0.25), transparent 24rem),
    linear-gradient(135deg, #f7f2e8 0%, #e3f0e7 50%, #d9ebe2 100%);
}

button {
  border: 0;
  font: inherit;
}

.patient-shell,
.staff-shell {
  min-height: 100vh;
  padding: 32px;
}

.patient-shell {
  display: grid;
  place-items: center;
}

.patient-card,
.queue-panel {
  border: 1px solid rgba(36, 87, 69, 0.16);
  background: rgba(255, 252, 245, 0.86);
  box-shadow: 0 24px 80px rgba(29, 64, 50, 0.16);
  backdrop-filter: blur(18px);
}

.patient-card {
  position: relative;
  width: min(760px, 100%);
  min-height: 760px;
  padding: 34px;
  border-radius: 38px;
}

.patient-header,
.staff-header,
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

.eyebrow {
  margin: 0 0 6px;
  color: #5f776c;
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
  font-size: clamp(2.4rem, 7vw, 5.6rem);
  letter-spacing: -0.08em;
  line-height: 0.9;
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
  background: #eef0ea;
  color: #607469;
  font-size: 0.9rem;
  font-weight: 800;
}

.connection span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #9aa9a1;
}

.connection.is-live {
  background: #ddf6e7;
  color: #16613f;
}

.connection.is-live span {
  background: #20b36a;
  box-shadow: 0 0 0 8px rgba(32, 179, 106, 0.12);
}

.language-strip {
  display: flex;
  justify-content: space-between;
  margin: 28px 0 22px;
  padding: 18px 22px;
  border-radius: 22px;
  background: #15372c;
  color: #f9f5ea;
}

.language-strip span {
  color: #b9d3c5;
}

.language-strip strong {
  font-size: 1.4rem;
  letter-spacing: 0.08em;
}

.mode-picker {
  display: grid;
  gap: 18px;
  margin-bottom: 22px;
  padding: 20px;
  border: 1px solid rgba(36, 87, 69, 0.12);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.58);
}

.mode-picker h2 {
  max-width: 620px;
  font-size: clamp(1.5rem, 4vw, 2.3rem);
  letter-spacing: -0.05em;
  line-height: 1.02;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.mode-option {
  min-height: 142px;
  padding: 16px;
  border: 1px solid rgba(23, 56, 45, 0.12);
  border-radius: 22px;
  background: #fffaf0;
  color: #15372c;
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
  color: #5f776c;
  font-size: 0.9rem;
  line-height: 1.35;
}

.mode-option.is-selected {
  border-color: #1d8f59;
  background: #def4e6;
  box-shadow: inset 0 0 0 2px rgba(29, 143, 89, 0.22);
}

.language-select {
  display: grid;
  gap: 8px;
  color: #5f776c;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.language-select select,
.filter-bar select,
.filter-bar input {
  width: 100%;
  border: 1px solid rgba(23, 56, 45, 0.16);
  border-radius: 14px;
  background: #fffdf7;
  color: #15372c;
  font: inherit;
  padding: 12px 14px;
}

.start-session-button {
  padding: 16px 20px;
  border-radius: 18px;
  background: #17382d;
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
  color: #607469;
  font-size: 0.95rem;
}

.mode-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
  padding: 14px;
  border: 1px solid rgba(23, 56, 45, 0.12);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
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
  background: #edf3ee;
  color: #17382d;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 900;
}

.mode-tab.is-selected {
  background: #17382d;
  color: #ffffff;
}

.mode-tab:disabled {
  cursor: default;
  opacity: 0.78;
}

.new-intake-button {
  background: #f3d8b5;
  color: #6b3d10;
}

.conversation {
  display: flex;
  min-height: 360px;
  max-height: 360px;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  padding: 20px;
  border-radius: 28px;
  background: linear-gradient(180deg, #fffaf0, #eef7f0);
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
  color: #577166;
  text-align: center;
}

.ai-bubble {
  align-self: flex-start;
  background: #ffffff;
  color: #1f3f33;
}

.patient-bubble {
  align-self: flex-end;
  background: #20784f;
  color: #ffffff;
}

.patient-controls {
  justify-content: center;
  margin-top: 28px;
}

.mic-button {
  position: relative;
  display: grid;
  width: 136px;
  height: 136px;
  place-items: center;
  border-radius: 50%;
  background: #1d8f59;
  color: #ffffff;
  cursor: pointer;
  font-weight: 900;
  box-shadow: 0 18px 36px rgba(29, 143, 89, 0.28);
}

.mic-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.mic-core {
  position: absolute;
  inset: 18px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  transition: transform 120ms ease;
}

.mic-button.is-recording {
  animation: pulse 1.4s infinite;
}

.camera-button,
.review-button,
.alert-banner button {
  padding: 14px 18px;
  border-radius: 16px;
  background: #17382d;
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
  background: #edf3ee;
  color: #516a5d;
  font-weight: 800;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 18px;
}

.intake-card {
  border: 1px solid rgba(26, 72, 56, 0.12);
  border-radius: 28px;
  padding: 22px;
  background: #fffdf7;
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
  background: #e4efe7;
  color: #17382d;
  font-size: 0.78rem;
  font-weight: 900;
}

.badge-critical { background: #be2020; }
.badge-high { background: #d86d1f; }
.badge-medium { background: #b38b08; }
.badge-low { background: #6b7a74; }

.timestamp {
  color: #6d7b73;
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
  background: #f2f6f0;
}

dt {
  color: #6a7a72;
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
  color: #5c6f65;
}

.structured-fields,
.resource-list {
  margin-top: 16px;
  border-radius: 18px;
  padding: 14px;
  background: #f7f3ea;
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
  background: #e4efe7;
  color: #315448;
  font-size: 0.84rem;
  font-weight: 800;
}

.card-meta {
  align-items: flex-start;
  margin: 16px 0;
  color: #63756c;
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
  background: #b5c1ba;
  cursor: default;
}

.empty-state {
  display: grid;
  min-height: 280px;
  place-items: center;
  border-radius: 24px;
  background: #f6f3ea;
  color: #607469;
  text-align: center;
}

.inline-error {
  margin: 16px 0 0;
  color: #a92323;
  font-weight: 800;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(29, 143, 89, 0.4); }
  70% { box-shadow: 0 0 0 22px rgba(29, 143, 89, 0); }
  100% { box-shadow: 0 0 0 0 rgba(29, 143, 89, 0); }
}

/* ── Mic level rings ─────────────────────────────────────── */
.mic-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(29, 143, 89, 0.55);
  transition: inset 80ms linear, opacity 80ms linear;
  pointer-events: none;
}

/* ── AI speaking indicator ───────────────────────────────── */
.ai-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
  min-height: 28px;
  color: #16613f;
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.speaking-dots { display: flex; gap: 5px; }

.speaking-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #1d8f59;
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
  color: #5f776c;
  font-weight: 800;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(29, 143, 89, 0.2);
  border-top-color: #1d8f59;
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

/* ── Staff nav tabs ──────────────────────────────────────── */
.staff-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 22px;
}

.staff-tab {
  padding: 9px 18px;
  border-radius: 999px;
  background: #edf3ee;
  color: #17382d;
  cursor: pointer;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 900;
  text-decoration: none;
  border: 0;
}

.staff-tab.active { background: #17382d; color: #fff; }

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
  background: rgba(36, 87, 69, 0.07);
  color: #143329;
  transition: background 0.15s, color 0.15s;
}

.cat-count {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 99px;
  font-size: 0.74rem;
  font-weight: 800;
  background: rgba(36, 87, 69, 0.12);
  color: inherit;
}

.category-tab.cat-clinic { border-color: rgba(58, 125, 90, 0.25); }
.category-tab.cat-shelter { border-color: rgba(216, 109, 31, 0.25); }
.category-tab.cat-food_aid { border-color: rgba(179, 139, 8, 0.25); }

.category-tab.cat-all.active    { background: #17382d; color: #fff; }
.category-tab.cat-clinic.active { background: #3a7d5a; color: #fff; }
.category-tab.cat-shelter.active { background: #d86d1f; color: #fff; }
.category-tab.cat-food_aid.active { background: #b38b08; color: #fff; }
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
  border: 1px solid rgba(23, 56, 45, 0.16);
  border-radius: 14px;
  background: #fffdf7;
  color: #15372c;
  font: inherit;
  font-size: 0.88rem;
  padding: 8px 12px;
}

.view-toggle { display: flex; gap: 4px; }

.view-toggle button {
  padding: 8px 14px;
  border-radius: 12px;
  background: #edf3ee;
  color: #17382d;
  cursor: pointer;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 900;
  border: 0;
}

.view-toggle button.is-active { background: #17382d; color: #fff; }

/* ── List view ───────────────────────────────────────────── */
.cards-list { display: flex; flex-direction: column; gap: 8px; }

.intake-card-list {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 16px;
  border: 1px solid rgba(26, 72, 56, 0.1);
  border-radius: 18px;
  padding: 14px 18px;
  background: #fffdf7;
}

.list-name { font-weight: 800; color: #15372c; font-size: 1rem; }

.list-summary {
  color: #5f776c;
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
  background: #17382d;
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 900;
  border: 0;
}

.list-action-btn:disabled { background: #b5c1ba; cursor: default; }

.user-id-section {
  display: flex; flex-direction: column; gap: 8px;
  padding: 14px 16px; background: rgba(36,87,69,0.05); border-radius: 12px;
  border: 1px solid rgba(36,87,69,0.12);
}
.returning-toggle {
  display: flex; align-items: center; gap: 8px; font-size: 0.88rem;
  font-weight: 600; color: #143329; cursor: pointer;
}
.returning-toggle input { width: 16px; height: 16px; cursor: pointer; }
.user-id-input, .new-user-fields input {
  padding: 9px 12px; border: 1px solid rgba(36,87,69,0.2); border-radius: 10px;
  font: inherit; font-size: 0.9rem; background: #fff; width: 100%;
}
.new-user-fields { display: flex; flex-direction: column; gap: 6px; }
.user-error { color: #be2020; font-size: 0.82rem; margin: 0; }

/* ── Input mode buttons (mic / camera) ───────────────────── */
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
  padding: 24px 16px;
  border-radius: 24px;
  cursor: pointer;
  text-align: center;
  border: none;
  transition: transform 0.12s, box-shadow 0.12s;
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

.input-mode-btn.is-mic {
  background: #1d8f59;
  color: #ffffff;
  box-shadow: 0 8px 22px rgba(29, 143, 89, 0.28);
}

.input-mode-btn.is-mic:hover:not(:disabled) {
  box-shadow: 0 14px 32px rgba(29, 143, 89, 0.38);
}

.input-mode-btn.is-camera {
  background: #17382d;
  color: #ffffff;
  box-shadow: 0 8px 22px rgba(23, 56, 45, 0.22);
}

.input-mode-btn.is-camera:hover:not(:disabled) {
  box-shadow: 0 14px 32px rgba(23, 56, 45, 0.32);
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
  color: #607469;
  font-size: 0.92rem;
  margin-top: 8px;
}

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
  border: 1px solid rgba(36, 87, 69, 0.12);
  border-radius: 22px;
  padding: 20px 22px;
  background: rgba(255, 252, 245, 0.9);
  backdrop-filter: blur(12px);
}

.summary-stat .eyebrow { margin-bottom: 8px; }

.summary-stat strong {
  display: block;
  font-size: 2.6rem;
  letter-spacing: -0.05em;
  color: #143329;
  line-height: 1;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.chart-card {
  border: 1px solid rgba(36, 87, 69, 0.12);
  border-radius: 28px;
  padding: 24px;
  background: rgba(255, 252, 245, 0.9);
  backdrop-filter: blur(12px);
}

.chart-card h3 {
  margin: 0 0 18px;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #5f776c;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 210px;
  color: #8fa99f;
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

@media (max-width: 720px) {
  .patient-shell,
  .staff-shell {
    padding: 16px;
  }

  .patient-card,
  .queue-panel {
    padding: 22px;
    border-radius: 28px;
  }

  .patient-header,
  .mode-strip,
  .staff-header,
  .alert-banner {
    align-items: flex-start;
    flex-direction: column;
  }

  .intake-grid,
  .cards-grid,
  .filter-bar,
  .mode-grid,
  .analytics-summary-row,
  .chart-grid {
    grid-template-columns: 1fr;
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
  font-weight: 600; background: rgba(36,87,69,0.08); color: #143329; border: none;
  display: flex; align-items: center; gap: 6px;
}
.appt-page-tab.active { background: #143329; color: #fff; }
.appt-count { background: rgba(255,255,255,0.25); border-radius: 99px; padding: 1px 7px; font-size: 0.75rem; }
.appt-page-tab:not(.active) .appt-count { background: rgba(36,87,69,0.15); }

.doctor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-top: 16px; }
.doctor-card { background: rgba(36,87,69,0.04); border: 1px solid rgba(36,87,69,0.14); border-radius: 14px; padding: 16px; }
.doctor-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.doctor-name { font-weight: 700; font-size: 1rem; margin: 0 0 2px; }
.doctor-spec { font-size: 0.82rem; color: #3a7d5a; font-weight: 600; margin: 0 0 2px; }
.doctor-meta { font-size: 0.78rem; color: #6b7a74; margin: 0; }
.slot-counts { display: flex; flex-direction: column; gap: 4px; text-align: right; }
.slot-available { font-size: 0.78rem; color: #2a6b4a; font-weight: 700; }
.slot-booked { font-size: 0.78rem; color: #b38b08; }
.slot-list { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.slot-chip { font-size: 0.75rem; padding: 3px 8px; border-radius: 8px; }
.slot-chip.available { background: #e0f0e8; color: #143329; }
.slot-chip.more, .slot-chip.none { background: #eee; color: #6b7a74; }
.add-slot-btn { font-size: 0.8rem; padding: 5px 12px; border-radius: 8px; cursor: pointer; background: #e0f0e8; color: #143329; font-weight: 600; border: none; }

.slot-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
.slot-row input { padding: 8px 10px; border: 1px solid rgba(36,87,69,0.2); border-radius: 8px; font: inherit; font-size: 0.88rem; }
.add-slot-inline { font-size: 0.82rem; color: #3a7d5a; font-weight: 600; background: none; border: none; cursor: pointer; padding: 4px 0; }

.appt-table-wrap { overflow-x: auto; margin-top: 16px; }
.appt-table {
  width: 100%; border-collapse: collapse; font-size: 0.88rem;
}
.appt-table th {
  text-align: left; padding: 8px 12px; background: rgba(36,87,69,0.07);
  font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #4a6b5a;
  border-bottom: 1px solid rgba(36,87,69,0.14);
}
.appt-table td { padding: 10px 12px; border-bottom: 1px solid rgba(36,87,69,0.08); vertical-align: top; }
.appt-row:hover td { background: rgba(36,87,69,0.03); }
.bot-row td:first-child { border-left: 3px solid #3a7d5a; }
.appt-name { font-weight: 600; white-space: nowrap; }
.appt-reason { max-width: 260px; }
.appt-notes { color: #6b7a74; font-size: 0.82rem; }
.appt-time { white-space: nowrap; font-weight: 600; color: #143329; }
.urgency-chip {
  display: inline-block; padding: 2px 8px; border-radius: 99px;
  color: #fff; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em;
}
.source-chip {
  display: inline-block; padding: 2px 8px; border-radius: 99px;
  font-size: 0.72rem; font-weight: 600;
}
.source-chip.bot { background: #e0f0e8; color: #2a6b4a; }
.source-chip.staff { background: #e8edf0; color: #3a5060; }
.facility-cell { display: flex; flex-direction: column; gap: 2px; }
.facility-city { font-size: 0.75rem; color: #6b7a74; }
.appt-status { font-size: 0.82rem; color: #4a6b5a; text-transform: capitalize; }
.appt-status.pending { color: #b38b08; }
.appt-status.confirmed { color: #2a6b4a; }
.appt-status.completed { color: #6b7a74; }
.appt-status.cancelled { color: #be2020; text-decoration: line-through; }
.appt-actions { display: flex; gap: 6px; white-space: nowrap; }
.appt-actions button {
  padding: 4px 10px; border-radius: 8px; cursor: pointer; font-size: 0.8rem;
  background: #e0f0e8; color: #143329; font-weight: 600;
}
.appt-actions .cancel-btn { background: #fde8e8; color: #be2020; }
.add-appt-btn {
  padding: 8px 18px; border-radius: 12px; cursor: pointer;
  background: #143329; color: #fff; font-weight: 600; font-size: 0.9rem;
}
.appt-form {
  background: rgba(36,87,69,0.04); border: 1px solid rgba(36,87,69,0.14);
  border-radius: 16px; padding: 20px; margin: 16px 0;
}
.appt-form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;
}
.appt-form-wide { grid-column: 1 / -1; }
.appt-form label { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; font-weight: 600; color: #4a6b5a; }
.appt-form input, .appt-form select {
  padding: 8px 12px; border: 1px solid rgba(36,87,69,0.2); border-radius: 8px;
  font: inherit; font-size: 0.9rem; background: #fff;
}
`;

function App() {
  return (
    <>
      <style>{styles}</style>
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
