import type { CamperFieldErrors } from "@/components/registration/CamperDetailsFrame"
import type { CamperFormState } from "@/components/registration/CamperDetailsFrame"
import { FIELD_ERROR_MESSAGE } from "@/components/registration/FieldError"
import {
  countWords,
  isValidKenyaPhone,
  MEDICAL_MAX_WORDS,
} from "@/lib/registrationFormat"
import {
  createEmptyEmergencyContact,
  hasCamperErrors,
  hasEmergencyErrors,
  type EmergencyContactState,
  type EmergencyFieldErrors,
  validateEmergency,
} from "@/lib/myfRegisterValidation"

export {
  createEmptyEmergencyContact,
  type EmergencyContactState,
  type EmergencyFieldErrors,
}

const MYA_MIN_AGE = 18
const MYA_MAX_AGE = 50

function isBlank(value: string) {
  return value.trim().length === 0
}

export type MyaAgeIssue =
  | "empty"
  | "invalid_format"
  | "under_18"
  | "over_max"

/** Why MYA age failed validation; `null` when age is acceptable. */
export function getMyaAgeIssue(value: string): MyaAgeIssue | null {
  const trimmed = value.trim()
  if (isBlank(trimmed)) return "empty"
  if (!/^\d+$/.test(trimmed)) return "invalid_format"
  const age = Number.parseInt(trimmed, 10)
  if (age < MYA_MIN_AGE) return "under_18"
  if (age > MYA_MAX_AGE) return "over_max"
  return null
}

export function isValidMyaAge(value: string): boolean {
  return getMyaAgeIssue(value) === null
}

export const MYA_AGE_INLINE_MESSAGES: Record<MyaAgeIssue, string> = {
  empty: FIELD_ERROR_MESSAGE,
  invalid_format: "Enter a valid age using numbers only (e.g. 24).",
  under_18: "MYA registration is for ages 18 and over.",
  over_max: `Please enter an age between ${MYA_MIN_AGE} and ${MYA_MAX_AGE}.`,
}

export function myaAgeFieldMessage(value: string): string {
  const issue = getMyaAgeIssue(value)
  if (issue === null) return FIELD_ERROR_MESSAGE
  return MYA_AGE_INLINE_MESSAGES[issue]
}

export function validateMyaCamper(camper: CamperFormState): CamperFieldErrors {
  const errors: CamperFieldErrors = {}

  if (isBlank(camper.firstName)) errors.firstName = true
  if (isBlank(camper.lastName)) errors.lastName = true
  if (getMyaAgeIssue(camper.age) !== null) errors.age = true
  if (camper.gender === null) errors.gender = true
  if (isBlank(camper.phone) || !isValidKenyaPhone(camper.phone)) {
    errors.phone = true
  }
  if (camper.wantsBaptism === null) errors.wantsBaptism = true

  if (camper.fromMavuno) {
    if (isBlank(camper.campus)) errors.campusOrChurch = true
  } else if (isBlank(camper.otherChurch)) {
    errors.campusOrChurch = true
  }

  if (camper.hasMedicalCondition) {
    if (
      isBlank(camper.medicalConditionDetails) ||
      countWords(camper.medicalConditionDetails) > MEDICAL_MAX_WORDS
    ) {
      errors.medicalConditionDetails = true
    }
  }

  if (camper.hasSpecialNeeds) {
    if (
      isBlank(camper.specialNeedsDetails) ||
      countWords(camper.specialNeedsDetails) > MEDICAL_MAX_WORDS
    ) {
      errors.specialNeedsDetails = true
    }
  }

  return errors
}

const CAMPER_FIELD_ORDER = [
  "firstName",
  "lastName",
  "age",
  "gender",
  "phone",
  "wantsBaptism",
  "campusOrChurch",
  "medicalConditionDetails",
  "specialNeedsDetails",
] as const satisfies readonly (keyof CamperFieldErrors)[]

const EMERGENCY_FIELD_ORDER = [
  "guardianFirstName",
  "guardianLastName",
  "guardianPhone",
  "relationship",
  "mpesaCode",
] as const satisfies readonly (keyof EmergencyFieldErrors)[]

export function myaRegistrationFieldId(
  camperId: string,
  field: keyof CamperFieldErrors
) {
  return `mya-field-${camperId}-${field}`
}

export function myaEmergencyFieldId(field: keyof EmergencyFieldErrors) {
  return `mya-field-emergency-${field}`
}

function findFirstInvalidFieldId(
  campers: CamperFormState[],
  emergency: EmergencyContactState,
  mpesaCode: string
): string | null {
  for (const camper of campers) {
    const errors = validateMyaCamper(camper)
    for (const field of CAMPER_FIELD_ORDER) {
      if (errors[field]) {
        return myaRegistrationFieldId(camper.id, field)
      }
    }
  }

  const emergencyErrors = validateEmergency(emergency, mpesaCode)
  for (const field of EMERGENCY_FIELD_ORDER) {
    if (emergencyErrors[field]) {
      return myaEmergencyFieldId(field)
    }
  }

  return null
}

export function validateMyaRegistration(
  campers: CamperFormState[],
  emergency: EmergencyContactState,
  mpesaCode: string
) {
  const camperErrorsById: Record<string, CamperFieldErrors> = {}
  for (const camper of campers) {
    const errors = validateMyaCamper(camper)
    if (hasCamperErrors(errors)) {
      camperErrorsById[camper.id] = errors
    }
  }

  const emergencyErrors = validateEmergency(emergency, mpesaCode)

  const isValid =
    Object.keys(camperErrorsById).length === 0 &&
    !hasEmergencyErrors(emergencyErrors)

  const firstInvalidFieldId = isValid
    ? null
    : findFirstInvalidFieldId(campers, emergency, mpesaCode)

  const hasUnder18Age = campers.some(
    (camper) => getMyaAgeIssue(camper.age) === "under_18"
  )

  return {
    camperErrorsById,
    emergencyErrors,
    isValid,
    firstInvalidFieldId,
    hasUnder18Age,
  }
}
