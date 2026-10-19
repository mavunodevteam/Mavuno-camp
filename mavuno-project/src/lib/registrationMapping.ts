import type { CamperFormState } from "@/components/registration/CamperDetailsFrame"
import type { PersonInput } from "@/lib/api/registration"

/* Turns what the camper form holds into what the database function expects */
export function toPersonInput(c: CamperFormState): PersonInput {
  if (c.gender === null) throw new Error("Please choose a gender for every camper.")

  return {
    first_name: c.firstName,
    last_name: c.lastName,
    age: Number(c.age),
    gender: c.gender,
    phone: c.phone,
    wants_baptism: c.wantsBaptism === true,
    from_mavuno: c.fromMavuno,
    campus_id: c.fromMavuno ? c.campus : null,
    church_name: c.fromMavuno ? null : c.otherChurch,
    has_medical_condition: c.hasMedicalCondition,
    medical_details: c.hasMedicalCondition ? c.medicalConditionDetails : null,
    has_special_needs: c.hasSpecialNeeds,
    special_needs_details: c.hasSpecialNeeds ? c.specialNeedsDetails : null,
  }
}

/* The ages offered in the dropdown, taken from the camp so the database and the form agree */
export function ageOptions(min: number, max: number | null): number[] {
  const top = max ?? min + 10 /* an open ended camp gets ten ages; MYA has its own form */
  return Array.from({ length: top - min + 1 }, (_, i) => min + i)
}