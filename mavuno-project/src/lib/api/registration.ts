import { supabase } from "@/lib/supabase"
import { friendlyError } from "@/lib/errors"
import { normalizePhone } from "@/lib/phone"

export type Gender = "male" | "female"
export type Relationship = "Parent" | "Legal Guardian" | "Sibling" | "Relative" | "Other"

/* One camper inside a registration, in the exact shape the database function expects */
export interface PersonInput {
  first_name: string
  last_name: string
  age: number
  gender: Gender
  phone?: string | null
  email?: string | null
  wants_baptism: boolean
  from_mavuno?: boolean | null
  campus_id?: string | null
  church_name?: string | null
  has_medical_condition: boolean
  medical_details?: string | null
  has_special_needs: boolean
  special_needs_details?: string | null
}

/* Everything the registration form collects, sent in one call */
export interface RegistrationInput {
  participant_type: "camper" | "facilitator"
  camp_id: string
  contact_first_name: string
  contact_last_name: string
  contact_phone: string
  relationship: Relationship
  mpesa_receipt?: string
  waiver_requested?: boolean
  campers: PersonInput[]
}

function clean(value?: string | null): string | null {
  const t = (value ?? "").trim()
  return t === "" ? null : t
}

/* Tidies one person so the database receives exactly what it expects */
function tidyPerson(p: PersonInput): PersonInput {
  const fromMavuno = p.from_mavuno ?? null
  return {
    ...p,
    first_name: p.first_name.trim(),
    last_name: p.last_name.trim(),
    phone: clean(p.phone) ? normalizePhone(p.phone as string) : null,
    email: clean(p.email)?.toLowerCase() ?? null,
    from_mavuno: fromMavuno,
    campus_id: fromMavuno === false ? null : clean(p.campus_id),
    church_name: fromMavuno === true ? null : clean(p.church_name),
    medical_details: p.has_medical_condition ? clean(p.medical_details) : null,
    special_needs_details: p.has_special_needs ? clean(p.special_needs_details) : null,
  }
}

/*
  Sends a registration to the database and returns the batch id.
  The server works out the real amount, so any amount shown on screen is for display only.
  If a staff member is signed in, the server treats this as a walk in.
*/
export async function submitRegistration(input: RegistrationInput): Promise<string> {
  const payload = {
    participant_type: input.participant_type,
    camp_id: input.camp_id,
    contact_first_name: input.contact_first_name.trim(),
    contact_last_name: input.contact_last_name.trim(),
    contact_phone: normalizePhone(input.contact_phone),
    relationship: input.relationship,
    mpesa_receipt: (input.mpesa_receipt ?? "").trim().toUpperCase(),
    waiver_requested: input.waiver_requested ?? false,
    campers: input.campers.map(tidyPerson),
  }

  const { data, error } = await supabase.rpc("submit_registration", { p: payload })
  if (error) throw new Error(friendlyError(error))
  return data as string
}

/* The total shown on the payment card */
export function amountDue(feePerPerson: number, people: number): number {
  return feePerPerson * people
}