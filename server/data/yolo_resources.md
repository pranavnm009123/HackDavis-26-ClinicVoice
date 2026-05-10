# VoiceBridge Resource Intelligence Base — Yolo County / Davis (demo)

_This file is ingested by Backboard RAG to ground **resource matching** for VoiceBridge. VoiceBridge is a multilingual **voice-to-casework** system: patients and clients speak naturally; staff receive structured records (transcript, English summary, urgency, red flags, accessibility, next steps, and **matched local resources**). It is **not** a diagnostic tool — it connects people to services and supports staff triage._

_Organizations should replace demo entries with verified contacts, hours, and eligibility rules._

---

## How to use this guide when matching intakes

- **Match on**: stated language, location/zip/county, primary need (medical, housing, food, safety, benefits, disability accommodation), urgency, insurance/cost barriers, transportation limits, household size, interpreter needs, and any **red flags** (chest pain, stroke-like symptoms, suicidal ideation, immediate danger — see Crisis section).
- **Prefer**: services in **Yolo County** and **Davis** when location is unknown; name the geographic fit in `why`.
- **Never**: diagnose, prescribe, or tell callers to delay emergency care when symptoms suggest emergency — **escalate** with `911`, **988**, or crisis resources as appropriate.
- **VoiceBridge modes** map to intake types below: **clinic** (free clinic demo), **shelter**, **food_aid** — use the sections that fit; many clients need **cross-referrals** (e.g. clinic + interpreter + Medi-Cal help).

---

## VoiceBridge: what staff cards should reflect

For each intake, matching should support fields staff expect:

| Area | Examples |
|------|----------|
| Language | Spanish, Mandarin, Arabic, Hindi, etc.; interpreter needed yes/no |
| Visit / request | Symptoms, reason for visit, duration, severity, housing status, food need |
| Barriers | Uninsured, cost concern, literacy, disability, no transport |
| Urgency | LOW / MEDIUM / HIGH / CRITICAL (or org’s scale) |
| Red flags | Keywords staff must see (chest pain, DV, self-harm, etc.) |
| Accessibility | Visual, motor, cognitive, language — affects **how** to refer (phone vs walk-in, accompaniment) |
| Next step | Immediate staff review, call clinic, go to ER, outreach worker, etc. |
| Resources | Concrete local options with **name, type, why it fits, next step, phone, address** when known |

---

## Crisis and safety (always evaluate first)

| Resource | When to match | Contact / notes |
|----------|----------------|-----------------|
| **911** | Life-threatening emergency, suspected heart attack/stroke, severe bleeding, inability to breathe, immediate danger of harm | Tell caller: if emergency, **call 911** or go to nearest ER. VoiceBridge documents; staff follow up. |
| **988 Suicide and Crisis Lifeline** | Suicidal thoughts, emotional crisis, substance crisis | **988** (call/text/chat 24/7). |
| **Empower Yolo** | Domestic violence, sexual assault, stalking, safety planning, advocacy (Yolo County) | **(530) 661-6333** — crisis/advocacy; verify current hours and shelter bed availability on referral. |
| **County behavioral health / mobile crisis** | Mental health crisis without immediate medical emergency | Direct to **county crisis line** or **988**; org should insert verified local numbers. |

**Chest pain + arm pain + shortness of breath**: treat as **possible emergency** — recommend **911 or ER** in escalation note; still list **low-cost clinic** for follow-up if appropriate.

---

## Free clinic and primary care (mode: `clinic`)

| Name | Type | Who it fits | Phone | Address / area | Notes |
|------|------|-------------|-------|----------------|-------|
| **CommuniCare Health Centers** | `free_clinic` / sliding scale | Uninsured, underinsured, family practice, Spanish-speaking populations common | **(530) 668-2600** | **215 W Beamer St, Woodland, CA** | Primary care; good default for “no insurance + need doctor”. |
| **Davis Community Clinic (demo fictional)** | `free_clinic` | Same-day or short wait primary care (demo) | _(demo)_ | Davis area | Use as **demo placeholder** — replace with real Davis low-cost clinic. |
| **CommuniCare — multiple sites** | `free_clinic` | Patients who need care closer to Woodland/West Sacramento corridor | **(530) 668-2600** | Woodland + affiliates | Mention **transport** if caller lacks mobility. |

**Interpreter support at visits**: Note **request interpreter at scheduling — language: [X]** in next step. Many FQHCs and county clinics offer **phone/video interpretation**.

**Insurance help paired with clinic**: Uninsured callers often need **Medi-Cal / Covered California** — match **benefits navigation** (below) alongside clinic.

---

## Shelter and housing (mode: `shelter`)

| Name | Type | Who it fits | Phone | Area | Notes |
|------|------|-------------|-------|------|-------|
| **Fourth and Hope** | `shelter` | Emergency shelter, meals, housing navigation | **(530) 661-1218** | **1901 E Beamer St, Woodland** | **Daily intake often by phone** — emphasize calling first. |
| **Empower Yolo** | `shelter` / `crisis` | DV shelter, safety planning, legal advocacy | **(530) 661-6333** | Woodland / Yolo | Match when **safety risk**, DV, or need confidential housing. |
| **Davis Community Meals and Housing** | `shelter` / `food_bank` | Meals, some housing support services | **(530) 756-4008** | **1111 H St, Davis** | Good for **Davis** unsheltered or food + housing instability. |

**Shelter intake fields VoiceBridge captures**: housing status, safety, family size, **pets**, mobility, **urgent bed need**, city/zip — use these in `why` when matching.

---

## Food banks and mutual aid (mode: `food_aid`)

| Name | Type | Who it fits | Phone | Area | Notes |
|------|------|-------------|-------|------|-------|
| **Yolo Food Bank** | `food_bank` | Pantry, distributions, large household need | **(530) 668-0690** | **233 Harter Ave, Woodland** | Note **distribution schedule** varies — next step: **check calendar / call**. |
| **Davis Community Meals and Housing** | `food_bank` | Meals, food programs | **(530) 756-4008** | Davis | Match **Davis** zip + meal programs. |

**Food aid fields**: household size, **dietary restrictions** (diabetes, halal, kosher, allergies), **transportation** (cannot carry boxes, delivery or ride programs), **zip code**, urgency.

---

## Insurance, Medi-Cal and CalFresh (cross-mode)

| Name | Type | Who it fits | Notes |
|------|------|-------------|-------|
| **County benefits / social services** | `insurance_help` | Medi-Cal, CalWORKs, General Assistance | Insert **Yolo County Health and Human Services** main line and lobby hours (verify live). |
| **Covered California + clinic navigators** | `insurance_help` | Working poor, special enrollment | CommuniCare and similar often have **enrollment assisters** — pair with clinic match. |
| **Prescription cost programs** | `pharmacy` / `insurance_help` | Uninsured needing meds | **GoodRx**, **manufacturer programs**, **340B** at FQHC pharmacies — general guidance only; verify locally. |

---

## Pharmacy and basic meds (supporting)

| Name | Type | Notes |
|------|------|-------|
| **Retail pharmacies (Rite Aid, CVS, Walmart)** | `pharmacy` | Near Davis/Woodland — use for **location convenience**; mention **discount lists** for uninsured. |

---

## Language, literacy and immigrant access

- **Phone and video interpretation** is standard at many clinics — next step: *Ask scheduler for interpreter in [language].*
- **Literacy barriers**: prefer **phone-first** referrals, **accompaniment** options, and organizations known for **patient navigation**.
- **Immigrant concerns** (fear of status disclosure): highlight **safety-net clinics** and **non-reporting community orgs** where applicable; staff should use **trauma-informed** handoffs.

---

## Disability support and accommodation

VoiceBridge supports users who **cannot easily use forms** (visual, motor, cognitive, language, literacy).

| Need | Match types | Guidance |
|------|-------------|----------|
| Wheelchair / mobility | Clinic with accessible site, paratransit info | Mention **call ahead for parking/entrance** |
| Blind / low vision | Phone intake friendly orgs | Offer **reader services** / **ADRC** if county has one |
| Deaf / HoH | `interpreter` — **ASL** | Video relay or in-person ASL; **not** the same as Spanish interpreter |
| Cognitive / intellectual disability | Case management, regional center (CA) | **Generic**: county **IDD** or **developmental services** navigation — verify Yolo pathways |

Use **type** `other` or `insurance_help` / `free_clinic` with a clear `why` when no perfect row exists.

---

## Nonprofit casework and wraparound

For messy walk-in or phone stories, match **navigation**-style resources:

- **211 / social services helpline** (if available in region) — information and referral.
- **Empower Yolo** — beyond DV: broader advocacy in some cases.
- **Food bank + clinic + benefits** triple for many families in poverty.

---

## Urgency rubric (for consistent matching language)

| Level | Examples | Typical next step in VoiceBridge |
|-------|----------|----------------------------------|
| **CRITICAL** | Chest pain, stroke signs, severe bleeding, imminent harm | **911 / ER** + document; optional follow-up clinic after acute care |
| **HIGH** | Severe untreated infection, DV in danger, child safety concern | Crisis line + **same-day** clinical or shelter intake |
| **MEDIUM** | Worsening chronic illness, stable but uninsured | Clinic within days + benefits help |
| **LOW** | Routine question, stable symptoms | Routine appointment + resources |

---

## Demo disclaimer

All phone numbers and addresses are **for hackathon / demo grounding** unless your organization has verified them. Replace with **live** schedules, eligibility, and languages served before production.
