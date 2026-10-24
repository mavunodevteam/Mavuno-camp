import { isValidPhone } from "@/lib/phone"

export type WalkInCamper = {
  id: string
  firstName: string
  lastName: string
  age: string
  gender: "male" | "female" | null
  phone: string
  baptised: boolean | null
  fromMavuno: boolean
  campusId: string
  churchName: string
  hasMedical: boolean
  medicalDetails: string
  hasSpecialNeeds: boolean
  specialNeedsDetails: string
}

export type WalkInContact = {
  firstName: string
  lastName: string
  phone: string
  relationship: string
}

export function emptyCamper(): WalkInCamper {
  return {
    id: crypto.randomUUID(),
    firstName: "",
    lastName: "",
    age: "",
    gender: null,
    phone: "",
    baptised: null,
    fromMavuno: true,
    campusId: "",
    churchName: "",
    hasMedical: false,
    medicalDetails: "",
    hasSpecialNeeds: false,
    specialNeedsDetails: "",
  }
}

const blank = (value: string) => value.trim() === ""

/*
  Everything that still needs fixing, in the order a person would fill the form in.
  The button stays off until this list is empty, and the first item is shown as a hint.
*/
export function validateWalkIn(
  campers: WalkInCamper[],
  contact: WalkInContact,
  mpesaCode: string,
  ageRange: { min: number; max: number | null },
  contactWord: string
): string[] {
  const out: string[] = []

  campers.forEach((c, i) => {
    const who = campers.length > 1 ? `Camper ${i + 1}` : "Camper"
    if (blank(c.firstName) || blank(c.lastName)) out.push(`${who}: enter the first and last name`)

    const age = Number(c.age)
    if (blank(c.age)) out.push(`${who}: choose the age`)
    else if (!Number.isInteger(age) || age < ageRange.min || (ageRange.max !== null && age > ageRange.max)) {
      out.push(
        ageRange.max !== null
          ? `${who}: age must be ${ageRange.min} to ${ageRange.max}`
          : `${who}: age must be ${ageRange.min} or above`
      )
    }

    if (c.gender === null) out.push(`${who}: choose a gender`)
    if (!isValidPhone(c.phone)) out.push(`${who}: enter a valid phone number`)
    if (c.baptised === null) out.push(`${who}: answer the baptism question`)
    if (c.fromMavuno && blank(c.campusId)) out.push(`${who}: select a campus`)
    if (!c.fromMavuno && blank(c.churchName)) out.push(`${who}: enter the church or organisation`)
    if (c.hasMedical && blank(c.medicalDetails)) out.push(`${who}: describe the medical condition`)
    if (c.hasSpecialNeeds && blank(c.specialNeedsDetails)) out.push(`${who}: describe the special needs`)
  })

  if (blank(contact.firstName) || blank(contact.lastName)) {
    out.push(`${contactWord}: enter the first and last name`)
  }
  if (!isValidPhone(contact.phone)) out.push(`${contactWord}: enter a valid phone number`)
  if (blank(contact.relationship)) out.push("Choose the relationship to the camper")
  if (!/^[A-Z0-9]{10}$/.test(mpesaCode.trim().toUpperCase())) {
    out.push("Enter the 10 character M-Pesa confirmation code")
  }
  return out
}