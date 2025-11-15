import { MedicalIntake, Medication, Allergy } from '@/types';

export interface BackendMedicalIntake {
  patient_info?: {
    name?: string;
    date_of_birth?: string;
    phone?: string;
    email?: string;
  } | null;
  present_illness?: {
    chief_complaints?: Array<{
      complaint?: string;
      duration?: string;
      severity?: string;
      onset?: string;
      location?: string;
    }>;
    symptoms?: string[];
    timeline?: string;
  } | null;
  medications?: Array<Partial<Medication> & { adherence?: string }>;
  allergies?: Array<Partial<Allergy>>;
  past_medical_history?: {
    conditions?: string[];
    surgeries?: Array<Record<string, string>>;
    hospitalizations?: Array<Record<string, string>>;
  } | null;
  family_history?: {
    conditions?: Array<Record<string, string> | string>;
    relatives?: string[];
  } | null;
  social_history?: {
    smoking?: string;
    alcohol?: string;
    drugs?: string;
    occupation?: string;
    exercise?: string;
  } | null;
  red_flags?: string[];
}

const defaultIntake: MedicalIntake = {
  chief_complaint: '',
  current_medications: [],
  allergies: [],
  red_flags: [],
};

const isFrontendShape = (payload: any): payload is MedicalIntake => {
  return typeof payload?.chief_complaint === 'string' && Array.isArray(payload?.current_medications);
};

const normalizeMedication = (med: Partial<Medication> & { adherence?: string }): Medication => ({
  name: med.name ?? 'Unknown medication',
  dose: med.dose,
  frequency: med.frequency,
  route: med.route,
  indication: med.indication,
  effectiveness: med.effectiveness ?? med.adherence,
});

const normalizeAllergy = (allergy: Partial<Allergy>): Allergy => ({
  allergen: allergy.allergen ?? 'Unknown allergen',
  reaction: Array.isArray(allergy.reaction)
    ? allergy.reaction
    : allergy.reaction
    ? [allergy.reaction]
    : [],
  severity: (allergy.severity as Allergy['severity']) ?? 'moderate',
  requires_emergency_treatment: allergy.requires_emergency_treatment ?? false,
});

export function normalizeMedicalIntake(
  payload: BackendMedicalIntake | MedicalIntake | null | undefined
): MedicalIntake {
  if (!payload) {
    return { ...defaultIntake };
  }

  if (isFrontendShape(payload)) {
    return {
      ...defaultIntake,
      ...payload,
      current_medications: payload.current_medications ?? [],
      allergies: payload.allergies ?? [],
      red_flags: payload.red_flags ?? [],
    };
  }

  const chiefComplaint =
    payload.present_illness?.chief_complaints?.[0]?.complaint ??
    payload.present_illness?.symptoms?.[0] ??
    'Unspecified concern';

  const duration =
    payload.present_illness?.chief_complaints?.[0]?.duration ?? payload.present_illness?.timeline;

  const severity = payload.present_illness?.chief_complaints?.[0]?.severity;
  const location = payload.present_illness?.chief_complaints?.[0]?.location;

  const medications = (payload.medications ?? [])
    .filter((med) => !!med && !!med.name)
    .map((med) => normalizeMedication(med));

  const allergies = (payload.allergies ?? [])
    .filter(Boolean)
    .map((allergy) => normalizeAllergy(allergy));

  const pastHistory = payload.past_medical_history
    ? {
        conditions: payload.past_medical_history.conditions ?? [],
        surgeries: (payload.past_medical_history.surgeries ?? []).map((entry) =>
          entry?.name ?? entry?.procedure ?? entry?.title ?? 'Surgery'
        ),
        hospitalizations: (payload.past_medical_history.hospitalizations ?? []).map((entry) =>
          entry?.reason ?? entry?.diagnosis ?? 'Hospitalization'
        ),
      }
    : undefined;

  const familyHistory = payload.family_history
    ? {
        conditions: (payload.family_history.conditions ?? []).map((item) =>
          typeof item === 'string' ? item : Object.values(item).join(': ')
        ),
        relatives: payload.family_history.relatives ?? [],
      }
    : undefined;

  const socialHistory = payload.social_history
    ? {
        smoking: payload.social_history.smoking,
        alcohol: payload.social_history.alcohol,
        occupation: payload.social_history.occupation ?? payload.social_history.drugs,
      }
    : undefined;

  return {
    chief_complaint: chiefComplaint,
    duration,
    location,
    severity,
    timing: payload.present_illness?.timeline,
    current_medications: medications,
    allergies,
    past_medical_history: pastHistory,
    family_history: familyHistory,
    social_history: socialHistory,
    red_flags: payload.red_flags ?? [],
  };
}
