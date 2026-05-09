export const INTAKE_MODES = ['clinic', 'shelter', 'food_aid'];

export const intakeTemplates = {
  clinic: {
    mode: 'clinic',
    label: 'Free Clinic',
    requiredFields: [
      'full_name',
      'reason_for_visit',
      'symptom_duration',
      'severity_1_to_10',
      'urgent_warning_signs',
      'insurance_or_cost_concern',
      'accessibility_needs',
      'interpreter_needed',
    ],
    urgencyRules: [
      'Chest pain, trouble breathing, severe bleeding, stroke symptoms, or feeling unsafe at home should trigger HIGH or CRITICAL urgency.',
      'Do not diagnose, recommend medicine, or mention specific drugs.',
    ],
    resourceTypes: ['clinic', 'pharmacy', 'interpreter', 'emergency_line'],
    nextStepExamples: [
      'Nurse triage now',
      'Same-day clinic review',
      'Interpreter support',
      'Emergency escalation if critical red flags are present',
    ],
  },
  shelter: {
    mode: 'shelter',
    label: 'Shelter',
    requiredFields: [
      'current_housing_status',
      'current_location',
      'safety_risk',
      'family_size',
      'pets',
      'mobility_or_accessibility_needs',
      'bed_or_resource_need',
      'best_contact_method',
    ],
    urgencyRules: [
      'Immediate danger, domestic violence, exposure risk tonight, unsupervised minors, or being unable to safely return home should trigger HIGH or CRITICAL urgency.',
      'Do not promise bed availability; identify needs and route to staff.',
    ],
    resourceTypes: ['shelter', 'emergency_line', 'interpreter', 'food'],
    nextStepExamples: [
      'Safety planning',
      'Emergency shelter screening',
      'Family shelter referral',
      'Mobility-accessible bed review',
    ],
  },
  food_aid: {
    mode: 'food_aid',
    label: 'Food / Mutual Aid',
    requiredFields: [
      'household_size',
      'zip_code_or_location',
      'dietary_restrictions',
      'transportation_limitations',
      'requested_supplies',
      'food_urgency',
      'accessibility_needs',
      'best_contact_method',
    ],
    urgencyRules: [
      'No food today, infants or young children without food, medically fragile household members, or inability to travel should trigger HIGH urgency.',
      'Focus on resource handoff and practical constraints, not eligibility screening.',
    ],
    resourceTypes: ['food', 'interpreter', 'emergency_line'],
    nextStepExamples: [
      'Food pantry referral',
      'Delivery or pickup coordination',
      'Mutual aid supply request',
      'Emergency food box',
    ],
  },
};

export function isValidMode(mode) {
  return INTAKE_MODES.includes(mode);
}

export function getTemplate(mode) {
  return intakeTemplates[mode] || intakeTemplates.clinic;
}

export function buildSystemInstruction(mode, languagePreference = 'auto') {
  const template = getTemplate(mode);
  const preferredLanguage =
    languagePreference && languagePreference !== 'auto'
      ? `The patient selected this language preference: ${languagePreference}.`
      : 'Auto-detect the patient language and speak in that language.';

  return `You are VoiceBridge, a calm, professional multilingual voice intake assistant for frontline social-good organizations.
${preferredLanguage}
You are currently running ${template.label} mode.
Ask one question at a time. Use plain language. Be patient, accessible, and nonjudgmental.
Collect the required fields before calling finalize_intake:
${template.requiredFields.map((field) => `- ${field}`).join('\n')}

Urgency rules for this mode:
${template.urgencyRules.map((rule) => `- ${rule}`).join('\n')}

Relevant resource categories for this mode: ${template.resourceTypes.join(', ')}.
Helpful next-step examples: ${template.nextStepExamples.join('; ')}.

If a red flag appears, immediately call tag_urgency before continuing.
Use lookup_resources when local resources would help staff route the case.
When enough information is collected, call finalize_intake with:
- mode
- language
- transcript
- english_summary
- structured_fields as a valid JSON string keyed by the required field names
- urgency
- red_flags
- accessibility_needs
- recommended_next_step
- resource_matches as a valid JSON string array of resource objects or names.
Do not invent facts. If a field is unknown, write "Not collected".`;
}
