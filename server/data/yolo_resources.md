# CowmunityCare Resource Intelligence Base — Yolo County / Davis (demo)

_This file is ingested by Backboard RAG to ground **resource matching** for CowmunityCare. CowmunityCare is a multilingual **voice-to-casework** system: patients and clients speak naturally; staff receive structured records (transcript, English summary, urgency, red flags, accessibility, next steps, and **matched local resources**). It is **not** a diagnostic tool — it connects people to services and supports staff triage._

_Organizations should replace demo entries with verified contacts, hours, and eligibility rules._

---

## How to use this guide when matching intakes

- **Match on**: stated language, location/zip/county, primary need (medical, housing, food, safety, benefits, disability accommodation), urgency, insurance/cost barriers, transportation limits, household size, interpreter needs, and any **red flags** (chest pain, stroke-like symptoms, suicidal ideation, immediate danger — see Crisis section).
- **Prefer**: services in **Yolo County** and **Davis** when location is unknown; name the geographic fit in `why`.
- **Never**: diagnose, prescribe, or tell callers to delay emergency care when symptoms suggest emergency — **escalate** with `911`, **988**, or crisis resources as appropriate.
- **CowmunityCare modes** map to intake types below: **clinic** (free clinic demo), **shelter**, **food_aid** — use the sections that fit; many clients need **cross-referrals** (e.g. clinic + interpreter + Medi-Cal help).

---

## CowmunityCare: what staff cards should reflect

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
| **911** | Life-threatening emergency, suspected heart attack/stroke, severe bleeding, inability to breathe, immediate danger of harm | Tell caller: if emergency, **call 911** or go to nearest ER. CowmunityCare documents; staff follow up. |
| **988 Suicide and Crisis Lifeline** | Suicidal thoughts, emotional crisis, substance crisis | **988** (call/text/chat 24/7). |
| **Empower Yolo** | Domestic violence, sexual assault, stalking, safety planning, advocacy (Yolo County) | **(530) 661-6333** — crisis/advocacy; verify current hours and shelter bed availability on referral. |
| **County behavioral health / mobile crisis** | Mental health crisis without immediate medical emergency | Direct to **county crisis line** or **988**; org should insert verified local numbers. |

**Chest pain + arm pain + shortness of breath**: treat as **possible emergency** — recommend **911 or ER** in escalation note; still list **low-cost clinic** for follow-up if appropriate.

---

## Emergency vs. Non-Emergency: Insurance Triage Guide

This section helps CowmunityCare classify whether a patient's situation is a true medical emergency or a non-emergency **before** giving insurance guidance, since the options differ significantly.

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
| **Russell Park (UC Davis)** | `housing` | UC Davis students or student families seeking campus-adjacent apartments | **(530) 752-2033** / housing.ucdavis.edu/apartments/russell-park/ | UC Davis-managed apartment option; apply/check eligibility through UC Davis Housing. |
| **Orchard Park (UC Davis)** | `housing` | Graduate students, students with families, and campus housing seekers | **(530) 752-2033** / housing.ucdavis.edu/apartments/orchard-park/ | UC Davis apartment community; useful for student family housing and longer-term planning. |
| **Solano Park (UC Davis)** | `housing` | Students and student families looking for UC Davis apartment housing | **(530) 752-2033** / housing.ucdavis.edu/apartments/solano-park/ | Campus apartment resource; apply/check eligibility through UC Davis Housing. |
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

## Davis apartments — specific complexes (on-campus and off-campus)

Use this section when a patient asks about specific apartment names, wants to know where to live near UC Davis, or asks about pricing and distances. Distances are from **UC Davis Memorial Union**.

### On-campus apartments (UC Davis managed or partnered)

| Name | Price range / month | Distance from MU | Website | Notes |
|------|---------------------|------------------|---------|-------|
| **Primero Grove** | $1,359 (studio) – $3,232 (4BR) | On campus | [housing.ucdavis.edu/apartments/primero-grove](https://housing.ucdavis.edu/apartments/primero-grove/) | Graduate & family housing; utilities included; private patios/balconies |
| **Orchid Park (Orchard Park)** | $1,173 – $2,727 (2–4 BR) | On campus, northwest corner | [orchardpark.ucdavis.edu](https://orchardpark.ucdavis.edu/) | Newer complex; furnished/unfurnished; 11.5-month leases; grad students & families |
| **Atriums at La Rue Park** | $1,383+ (studio – 2 BR) | On campus | [atriums.tandemproperties.com](https://atriums.tandemproperties.com/) | Tandem Properties managed; graduate-focused; 24-hour study lounge |
| **Russell Park** | $1,241 – $2,050+ | On campus, Russell Blvd | [russellpark.tandemproperties.com](https://russellpark.tandemproperties.com/) | Tandem Properties managed; family-oriented; playground and childcare center on-site |
| **Colleges at La Rue** | $1,377+ (1–4 BR) | On campus (near ARC) | [colleges.tandemproperties.com](https://colleges.tandemproperties.com/) | UC Davis students only; Tandem managed; 164 Orchard Park Dr |

### Off-campus apartments

| Name | Price range / month | Distance from MU | Website | Address | Notes |
|------|---------------------|------------------|---------|---------|-------|
| **University Commons** | $2,100+ (2 BR/1 BA) | ~1.3 miles / ~4 min by bus | [universitycommonsdavis.com](https://universitycommonsdavis.com/) | 707 Sycamore Ln, Davis | Near University Mall and Trader Joe's; short bike ride to campus |
| **8th and Wake** | $742 – $859/bedroom (4 BR suites) | ~1.7 miles / ~5 min | [yolopropertymanagement.com/8th-and-wake](https://www.yolopropertymanagement.com/8th-and-wake) | 1440 Wake Forest Dr, Davis | One block from campus; fully furnished option; suite-style |
| **Axis at Davis** | $820 – $1,619 (2–3 BR) | ~3.5 miles / ~7 min | [axisdavis.com](https://www.axisdavis.com/) | 2555 Research Park Dr, Davis | Newer (2025); resort-style amenities; pet-friendly |
| **Identity Davis** | $521+/person (3–5 BR units) | ~1.5 miles / ~8 min walk | [identitydavis.com](https://www.identitydavis.com/) | 525 Oxford Cir, Davis | Built 2021; downtown; pool and fitness center |
| **The Spoke** | $665 – $1,270 (1–2 BR) | ~1.5 miles / ~25 min walk or 5 min drive | [livethespoke.com](https://www.livethespoke.com/) | 801 J St, Davis | Downtown; three pools; Unitrans E and L lines |
| **Sol at West Village** | $1,099+ (1–4 BR) | ~1.5 miles / ~4 min | [solatwestvillage.com](https://solatwestvillage.com/) | 1580 Jade St, Davis | Zero net energy; furnished available; UC Davis / Los Rios students only |
| **Adobe at Evergreen** | $668+/person (1–4 BR) | ~3.1 miles / ~7 min | [adobe.tandemproperties.com](https://adobe.tandemproperties.com/) | 1500 Shasta Dr, Davis | UC Davis Housing Partner; Tandem managed |
| **Piñon Apartments** | $1,399+ (1–3 BR) | ~1.7 miles / ~6 min | [tccproperties.net/property/pinon-apartments](https://www.tccproperties.net/property/pinon-apartments) | 555 Guava Ln, Davis | Across from UC Davis; near Trader Joe's; Unitrans B/C lines |
| **Parkside Apartments** | $1,681+ (studio – 4 BR) | ~1.5 miles / ~8 min | [parkside-apartments.com](https://www.parkside-apartments.com/) | 1420 F St, Davis | 12 acres of park grounds; central Davis; Commuter 42A bus stop |
| **University Court** | $1,700+ (1–2 BR, utilities incl.) | ~1.2 miles / ~4 min | [universitycourt.net](https://www.universitycourt.net/) | 515 Sycamore Ln, Davis | All utilities included; fully furnished; 50-week leases (Sept–Aug) |

**Matching guidance for housing asks:**
- **On-campus / affordable for families**: Primero Grove or Russell Park — utilities included, family-friendly.
- **Graduate students wanting newer/modern**: Orchid Park, Atriums, Colleges at La Rue.
- **Budget-conscious student, close to campus**: 8th and Wake (per-bedroom pricing), Identity Davis (multi-BR shared units).
- **Downtown Davis vibe**: The Spoke, Identity Davis — walkable to restaurants and shops.
- **Utilities-included convenience**: University Court.
- **Zero net energy / sustainable**: Sol at West Village.
- All distances are approximate; suggest patients verify via Google Maps for their specific address.

---

## Emergency shelter (mode: `shelter` — urgent/crisis cases)

| Name | Type | Who it fits | Phone | Area | Notes |
|------|------|-------------|-------|------|-------|
| **Fourth and Hope** | `shelter` | Emergency shelter, meals, housing navigation | **(530) 661-1218** | **1901 E Beamer St, Woodland** | **Daily intake often by phone** — emphasize calling first. Serves individuals and families in crisis. |
| **Empower Yolo** | `shelter` / `crisis` | DV shelter, safety planning, legal advocacy | **(530) 661-6333** | Woodland / Yolo | Match when **safety risk**, DV, or need confidential housing. 24/7 crisis line. |
| **Davis Community Meals and Housing** | `shelter` / `food_bank` | Meals, some housing support services | **(530) 756-4008** | **1111 H St, Davis** | Good for **Davis** unsheltered or food + housing instability. |

**CowmunityCare captures for housing intakes**: housing need type (emergency/general/student), housing status, timeline urgency, family size, **pets**, mobility, budget, city/zip — use these in `why` when matching.

**Key distinction**: Use emergency shelter resources (above) for CRITICAL/HIGH urgency only. For MEDIUM/LOW housing needs, use the General Housing and Student Housing section above.

---

## Food banks and mutual aid (mode: `food_aid`)

| Name | Type | Who it fits | Phone | Area | Notes |
|------|------|-------------|-------|------|-------|
| **Yolo Food Bank** | `food_bank` | Pantry, distributions, large household need | **(530) 668-0690** | **233 Harter Ave, Woodland** | Note **distribution schedule** varies — next step: **check calendar / call**. |
| **Davis Community Meals and Housing** | `food_bank` | Meals, food programs | **(530) 756-4008** | Davis | Match **Davis** zip + meal programs. |

**Food aid fields**: household size, **dietary restrictions** (diabetes, halal, kosher, allergies), **transportation** (cannot carry boxes, delivery or ride programs), **zip code**, urgency.

---

## Grocery stores and retail food (mode: `food_aid` — buying food nearby)

Use these when a patient asks **where to buy** food, groceries, or household supplies — not for free food assistance. Match on city/zip and mention hours.

### Davis, CA grocery stores

| Name | Type | Who it fits | Phone | Address | Hours |
|------|------|-------------|-------|---------|-------|
| **Trader Joe's** | `grocery_store` | Popular chain; good prices, variety | **(530) 757-2693** | 885 Russell Blvd, Davis, CA | Daily 8 AM–9 PM |
| **Nugget Markets (Covell)** | `grocery_store` | Full-service, upscale; near north Davis | **(530) 750-3800** | 1414 E Covell Blvd, Davis, CA | Daily 6 AM–11 PM |
| **Nugget Markets (Mace)** | `grocery_store` | Full-service; east Davis / Mace area | **(530) 753-6690** | 409 Mace Blvd, Davis, CA | Daily 6 AM–10 PM |
| **Safeway (Covell)** | `grocery_store` | Large chain; late-night hours | **(530) 757-4540** | 1451 W Covell Blvd, Davis, CA | Daily 5 AM–2 AM |
| **Safeway (Cowell)** | `grocery_store` | Large chain; east Davis | **(530) 792-8500** | 2121 Cowell Blvd, Davis, CA | Daily 5 AM–2 AM |
| **Save Mart** | `grocery_store` | Mid-range grocery, Anderson Rd area | **(530) 758-0580** | 1900 Anderson Rd, Davis, CA | Daily 6 AM–11 PM |
| **Grocery Outlet** | `grocery_store` | Discount bargain grocery; budget option | **(530) 757-4430** | 1800 E 8th St, Davis, CA | Daily 8 AM–9 PM |
| **Target (grocery section)** | `grocery_store` | Grocery + general merchandise | **(530) 761-0126** | 4601 2nd St, Davis, CA | Daily 8 AM–10 PM |
| **Davis Food Co-op** | `grocery_store` | Locally owned co-op; organic, bulk foods | **(530) 758-2667** | 620 G St, Davis, CA | Daily 7 AM–10 PM |

**Key distinction from food banks**: these are retail stores where patients **pay** for food. For **free** food assistance, use the Food banks and mutual aid section above. When a patient asks "where can I buy X?" or "nearest store?" → match grocery_store. When a patient says "I have no food" or "I can't afford food" → match food or food_bank.

---

## Language, literacy and immigrant access

- **Phone and video interpretation** is standard at many clinics — next step: *Ask scheduler for interpreter in [language].*
- **Literacy barriers**: prefer **phone-first** referrals, **accompaniment** options, and organizations known for **patient navigation**.
- **Immigrant concerns** (fear of status disclosure): highlight **safety-net clinics** and **non-reporting community orgs** where applicable; staff should use **trauma-informed** handoffs.
- **Undocumented patients**: As of Jan 2024, California expanded full-scope Medi-Cal to all income-eligible adults regardless of immigration status. This is important to mention — many patients don't know they qualify.

---

## Disability support and accommodation

CowmunityCare supports users who **cannot easily use forms** (visual, motor, cognitive, language, literacy).

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

| Level | Examples | Typical next step in CowmunityCare |
|-------|----------|----------------------------------|
| **CRITICAL** | Chest pain, stroke signs, severe bleeding, imminent harm | **911 / ER** + document; EMTALA protects uninsured — they must be treated; follow-up with charity care application |
| **HIGH** | Severe untreated infection, DV in danger, child safety concern | Crisis line + **same-day** clinical or shelter intake; apply for emergency Medi-Cal retroactively |
| **MEDIUM** | Worsening chronic illness, stable but uninsured | Free/sliding-scale clinic within days + Medi-Cal enrollment |
| **LOW** | Routine question, stable symptoms | Routine appointment + Covered California or Medi-Cal enrollment |

---

## Demo disclaimer

All phone numbers and addresses are **for hackathon / demo grounding** unless your organization has verified them. Replace with **live** schedules, eligibility, and languages served before production.
