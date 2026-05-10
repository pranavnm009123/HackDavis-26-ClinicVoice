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
| Urgency | LOW / MEDIUM / HIGH / CRITICAL (or org's scale) |
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

## Emergency vs. Non-Emergency: Insurance Triage Guide

This section helps VoiceBridge classify whether a patient's situation is a true medical emergency or a non-emergency **before** giving insurance guidance, since the options differ significantly.

### What counts as an emergency?
Emergency symptoms that require ER care **regardless of insurance**:
- Chest pain, pressure, tightness, or pain radiating to arm/jaw
- Difficulty breathing or shortness of breath at rest
- Signs of stroke: sudden face drooping, arm weakness, slurred speech, sudden severe headache
- Severe bleeding that won't stop
- Loss of consciousness, seizure, or unresponsive
- Severe allergic reaction (throat swelling, hives + breathing difficulty)
- High fever (above 103°F) with stiff neck, severe headache, or confusion
- Severe abdominal pain
- Signs of overdose or poisoning
- Major injuries from accident or fall

### What is non-emergency (routine/urgent care)?
- Cough, cold, minor sore throat lasting days
- Minor cuts, sprains, or mild pain
- Urinary tract infection without fever
- Skin rashes without breathing issues
- Medication refills or chronic disease management
- Routine checkups, preventive care, vaccinations
- Mental health counseling (non-crisis)

### KEY LAW: EMTALA — Emergency Care Without Insurance

**Federal law (EMTALA) requires all hospital ERs that accept Medicare (virtually all US hospitals) to evaluate and stabilize any patient regardless of insurance status or ability to pay.**

This means:
- No ER can turn you away for a medical emergency because you lack insurance.
- They must provide a medical screening exam and stabilize you.
- Billing happens AFTER treatment — you will get a bill, but you have options (see charity care below).
- **Sutter Davis Hospital**, **Woodland Memorial Hospital**, and **UC Davis Medical Center** all participate in Medicare and are covered by EMTALA.

### Insurance guidance by urgency level

| Situation | Insurance guidance |
|-----------|-------------------|
| **CRITICAL emergency** (chest pain, stroke, severe bleeding, trouble breathing) | Go to ER immediately. EMTALA protects you — they MUST treat you. Insurance does NOT matter right now. Address bills afterward using charity care (below). |
| **HIGH urgency** (severe pain, worsening infection, DV, child safety) | ER or same-day clinic. Uninsured patients can be seen; discuss payment options after care. Apply for emergency Medi-Cal to retroactively cover the visit. |
| **MEDIUM/routine** (chronic illness, minor illness, follow-up) | Free/sliding-scale clinic first. Apply for Medi-Cal or Covered California before the appointment if possible. |
| **LOW/preventive** (checkup, vaccination, medication management) | Free clinic or Medi-Cal enrollment. Covered California open enrollment or Special Enrollment Period. |

---

## Insurance Assistance — Detailed Programs

### Medi-Cal (California's Medicaid)
- **Who qualifies**: Low-income individuals and families in California. As of 2024, most adults under 65 with household income up to 138% of federal poverty level qualify. Undocumented adults 26–49 qualify under expanded Medi-Cal (full-scope as of Jan 2024).
- **Cost**: Free or very low cost (some copays for working adults).
- **Coverage**: Doctor visits, hospital, ER, mental health, dental, vision, prescriptions.
- **How to apply**: Online at **coveredca.com**, by phone **(800) 300-1506**, or in person at Yolo County HHS.
- **Processing time**: Typically 45 days; emergency Medi-Cal can be approved faster for acute needs.
- **Retroactive coverage**: Medi-Cal can retroactively cover bills from the 3 months BEFORE you applied if you were eligible during that time. This is critical for patients who just had an ER visit.

| Resource | Phone | Address | Hours |
|----------|-------|---------|-------|
| **Yolo County HHS — Medi-Cal enrollment** | **(530) 661-2750** | 137 N Cottonwood St, Woodland, CA | Mon–Fri 8 AM–5 PM |
| **Covered California** | **1-800-300-1506** | Online or via enrollment assisters | Mon–Fri 8 AM–6 PM |
| **CommuniCare — Certified Enrollment Assister** | **(530) 668-2600** | 215 W Beamer St, Woodland, CA | Mon–Fri 8 AM–6 PM |

### Covered California (ACA Marketplace)
- **Who qualifies**: Californians who don't qualify for Medi-Cal but need affordable insurance. Income 139%–400% FPL.
- **Subsidies**: Most people qualify for financial help (premium tax credits) that lower monthly costs.
- **Open enrollment**: November 1 – January 31 each year.
- **Special Enrollment**: If you had a qualifying life event (lost coverage, moved, had a baby), you can enroll any time within 60 days.

### Hospital Financial Assistance / Charity Care
Most hospitals have programs for uninsured or underinsured patients:
- **Sutter Davis Hospital**: Charity care and financial assistance available. Ask the billing department or social worker. Income-based discounts up to 100% for qualifying patients.
- **UC Davis Medical Center**: Comprehensive financial counseling, charity care, payment plans. Call **(916) 734-2011** or ask the patient advocate.
- **Woodland Memorial Hospital**: Financial assistance program; ask at admissions or billing.
- **How to apply**: After your visit, ask the hospital for a "financial assistance application" or "charity care application." You typically have 240 days after the first bill to apply.
- **Medical debt**: If already billed, a hospital financial counselor or nonprofit credit counselor can negotiate. AB 1095 in California limits medical debt collection practices.

### Prescription Cost Help (uninsured)
- **GoodRx**: Free discount card/app that reduces medication costs by 40–80% at most pharmacies. No insurance needed. Visit goodrx.com or show the app at the pharmacy.
- **340B program**: FQHCs (like CommuniCare) dispense medications at significantly reduced prices for qualifying patients.
- **Manufacturer patient assistance programs**: Many brand-name drug makers offer free or discounted medication for uninsured low-income patients. Ask the prescribing doctor or look up the drug company directly.
- **NeedyMeds.org**: Database of patient assistance programs and drug discount coupons.

---

## Free clinic and primary care (mode: `clinic`)

| Name | Type | Who it fits | Phone | Address / area | Notes |
|------|------|-------------|-------|----------------|-------|
| **CommuniCare Health Centers** | `free_clinic` / sliding scale | Uninsured, underinsured, family practice, Spanish-speaking populations common | **(530) 668-2600** | **215 W Beamer St, Woodland, CA** | Primary care; good default for "no insurance + need doctor". Certified enrollment assisters for Medi-Cal on site. |
| **Davis Community Clinic** | `free_clinic` | Same-day or short wait primary care, Davis area | **(530) 758-2060** | **2051 John Jones Rd, Davis, CA** | Sliding scale fees; serves uninsured patients. Mon–Fri 8 AM–5 PM. |
| **UC Davis Student Health** | `free_clinic` | UC Davis students only | **(530) 752-2300** | UC Davis campus | Students only — mention if patient is a student. |

**Interpreter support at visits**: Note **request interpreter at scheduling — language: [X]** in next step. Many FQHCs and county clinics offer **phone/video interpretation**.

**Insurance help paired with clinic**: Uninsured callers often need **Medi-Cal / Covered California** — match **benefits navigation** alongside clinic.

---

## General housing and student housing (mode: `shelter` — non-emergency)

This section covers housing needs that are NOT emergencies: students looking for off-campus housing, general affordable housing searches, eviction prevention, and housing navigation.

| Name | Type | Who it fits | Phone / URL | Notes |
|------|------|-------------|-------------|-------|
| **UC Davis Student Housing** | `housing` | UC Davis students needing on-campus housing | **(530) 752-2033** / housing.ucdavis.edu | On-campus apartments, residence halls, family student housing (Solano Park, Orchard Park). Apply through MyHousing portal. |
| **UC Davis Off-Campus Housing Portal** | `housing` | UC Davis students/staff seeking off-campus rentals | housing.ucdavis.edu/off-campus | Free listing board; search by price, distance, roommates. Also lists sublets, temporary housing. |
| **UC Davis Dean of Students — Basic Needs** | `housing` | Students facing housing instability or crisis | **(530) 752-4633** / basicneeds.ucdavis.edu | Emergency housing support, Aggie House (student housing resource center), and housing crisis navigation. First stop for any student housing emergency. |
| **Yolo County Housing Authority (YCHA)** | `housing` | Low-income residents needing subsidized housing | **(530) 662-5428** | Administers Section 8 / Housing Choice Voucher program. Waitlist may be open periodically — check yolohousing.org. |
| **City of Davis — Affordable Housing** | `housing` | Davis residents seeking affordable rentals | cityofdavis.org/housing | Maintains list of income-restricted apartments in Davis. Includes Below Market Rate (BMR) units. |
| **Yolo County Rental Assistance** | `housing` | Renters facing eviction or inability to pay rent | Yolo County HHS: **(530) 661-2750** | Emergency rental and utility assistance programs; eligibility varies. |
| **Legal Services of Northern California** | `housing` | Eviction defense, tenant rights, housing legal help | **(530) 662-1065** | Free legal aid for low-income residents; can help with eviction notices, unlawful detainer responses. |
| **Davis Solidarity Housing** | `housing` | Davis area residents needing low-cost housing options | Community resource — check local listings | Community-driven housing support and information sharing. |

**For UC Davis students specifically:**
- If just arrived in Davis and need short-term housing: contact the **International House Davis** (ihousdavis.org) or look at **UC Davis Aggie Housing Fair** listings.
- Graduate/family housing: Solano Park and West Village (UC Davis-managed) — apply through Housing portal.
- Roommate matching: UC Davis Off-Campus Housing portal has a roommate finder tool.
- Temporary/emergency: UC Davis Dean of Students Basic Needs office can arrange emergency housing vouchers.

**For general housing navigation (non-students):**
- Yolo County 211 for housing referrals
- Check HUD-approved housing counselors for free advice on renting, buying, or avoiding eviction

---

## Emergency shelter (mode: `shelter` — urgent/crisis cases)

| Name | Type | Who it fits | Phone | Area | Notes |
|------|------|-------------|-------|------|-------|
| **Fourth and Hope** | `shelter` | Emergency shelter, meals, housing navigation | **(530) 661-1218** | **1901 E Beamer St, Woodland** | **Daily intake often by phone** — emphasize calling first. Serves individuals and families in crisis. |
| **Empower Yolo** | `shelter` / `crisis` | DV shelter, safety planning, legal advocacy | **(530) 661-6333** | Woodland / Yolo | Match when **safety risk**, DV, or need confidential housing. 24/7 crisis line. |
| **Davis Community Meals and Housing** | `shelter` / `food_bank` | Meals, some housing support services | **(530) 756-4008** | **1111 H St, Davis** | Good for **Davis** unsheltered or food + housing instability. |

**VoiceBridge captures for housing intakes**: housing need type (emergency/general/student), housing status, timeline urgency, family size, **pets**, mobility, budget, city/zip — use these in `why` when matching.

**Key distinction**: Use emergency shelter resources (above) for CRITICAL/HIGH urgency only. For MEDIUM/LOW housing needs, use the General Housing and Student Housing section above.

---

## Food banks and mutual aid (mode: `food_aid`)

| Name | Type | Who it fits | Phone | Area | Notes |
|------|------|-------------|-------|------|-------|
| **Yolo Food Bank** | `food_bank` | Pantry, distributions, large household need | **(530) 668-0690** | **233 Harter Ave, Woodland** | Note **distribution schedule** varies — next step: **check calendar / call**. |
| **Davis Community Meals and Housing** | `food_bank` | Meals, food programs | **(530) 756-4008** | Davis | Match **Davis** zip + meal programs. |

**Food aid fields**: household size, **dietary restrictions** (diabetes, halal, kosher, allergies), **transportation** (cannot carry boxes, delivery or ride programs), **zip code**, urgency.

---

## Language, literacy and immigrant access

- **Phone and video interpretation** is standard at many clinics — next step: *Ask scheduler for interpreter in [language].*
- **Literacy barriers**: prefer **phone-first** referrals, **accompaniment** options, and organizations known for **patient navigation**.
- **Immigrant concerns** (fear of status disclosure): highlight **safety-net clinics** and **non-reporting community orgs** where applicable; staff should use **trauma-informed** handoffs.
- **Undocumented patients**: As of Jan 2024, California expanded full-scope Medi-Cal to all income-eligible adults regardless of immigration status. This is important to mention — many patients don't know they qualify.

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
| **CRITICAL** | Chest pain, stroke signs, severe bleeding, imminent harm | **911 / ER** + document; EMTALA protects uninsured — they must be treated; follow-up with charity care application |
| **HIGH** | Severe untreated infection, DV in danger, child safety concern | Crisis line + **same-day** clinical or shelter intake; apply for emergency Medi-Cal retroactively |
| **MEDIUM** | Worsening chronic illness, stable but uninsured | Free/sliding-scale clinic within days + Medi-Cal enrollment |
| **LOW** | Routine question, stable symptoms | Routine appointment + Covered California or Medi-Cal enrollment |

---

## Demo disclaimer

All phone numbers and addresses are **for hackathon / demo grounding** unless your organization has verified them. Replace with **live** schedules, eligibility, and languages served before production.
