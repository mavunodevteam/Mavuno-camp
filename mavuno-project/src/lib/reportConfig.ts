import type {
  AttendanceStatus,
  EditionInfo,
  ParticipantType,
  PaymentStatus,
  RegistrationKind,
  ReportFilters,
} from "@/lib/api/reports"

export type ReportKind = "campers" | "facilitators" | "age-gender"

export const PARTICIPANT_OF: Record<ReportKind, ParticipantType> = {
  campers: "camper",
  facilitators: "facilitator",
  "age-gender": "camper",
}

export const KIND_DESCRIPTION: Record<ReportKind, string> = {
  campers: "Filter, review and print camper records.",
  facilitators: "Filter, review and print facilitator records.",
  "age-gender": "See how campers divide by age, gender and campus.",
}

/* The word that sits between the camp and the edition in the default title */
export const KIND_TITLE_PHRASE: Record<ReportKind, string> = {
  campers: "",
  facilitators: "facilitators",
  "age-gender": "- age and gender",
}

export type ColumnId =
  | "camper"
  | "name"
  | "age"
  | "gender"
  | "phone"
  | "contact"
  | "team"
  | "camp"
  | "campus"
  | "status"
  | "medical"
  | "special"
  | "baptism"
  | "payment"
  | "registration"

/* The order columns always appear in, whichever are switched on */
export const COLUMN_ORDER: ColumnId[] = [
  "camper",
  "name",
  "age",
  "gender",
  "phone",
  "contact",
  "team",
  "camp",
  "campus",
  "status",
  "medical",
  "special",
  "baptism",
  "payment",
  "registration",
]

/* The columns each report offers in its Columns menu */
export const KIND_COLUMNS: Record<ReportKind, ColumnId[]> = {
  campers: ["camper", "phone", "contact", "camp", "campus", "status", "medical", "special", "baptism", "payment", "registration"],
  facilitators: ["camper", "phone", "contact", "team", "camp", "campus", "status", "medical", "special", "payment"],
  "age-gender": ["name", "age", "phone", "gender", "campus", "camp"],
}

/* The columns each report starts with, as in the design */
export const KIND_DEFAULTS: Record<ReportKind, ColumnId[]> = {
  campers: ["camper", "phone", "contact", "camp", "campus", "status", "medical", "special", "baptism"],
  facilitators: ["camper", "phone", "contact", "team", "camp", "campus", "status", "medical", "special"],
  "age-gender": ["name", "age", "phone", "gender", "campus", "camp"],
}

const COLUMN_LABELS: Record<ColumnId, string> = {
  camper: "Camper",
  name: "Name",
  age: "Age",
  gender: "Gender",
  phone: "Phone number",
  contact: "Emergency contact",
  team: "Team",
  camp: "Camp",
  campus: "Campus",
  status: "Status",
  medical: "Medical condition",
  special: "Special needs",
  baptism: "Baptism",
  payment: "Payment",
  registration: "Registration",
}

export function columnLabel(kind: ReportKind, id: ColumnId): string {
  if (kind === "facilitators" && id === "camper") return "Facilitator"
  return COLUMN_LABELS[id]
}

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  registered: "Registered",
  checked_in: "Checked in",
  checked_out: "Checked out",
}

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  success: "Paid",
  pending: "Payment pending",
  failed: "Payment failed",
  waiver_requested: "Assistance requested",
  waiver_approved: "Assistance approved",
}

export const REGISTRATION_LABELS: Record<RegistrationKind, string> = {
  online: "Online",
  walk_in: "Walk-in",
}

export const GENDER_LABELS = { male: "Male", female: "Female" } as const

export interface ReportTemplate {
  id: string
  label: string
  title: string
  filters: ReportFilters
  columns: ColumnId[]
}

/* Ready made reports. Each one sets the filters, the columns and the title in one click. */
export const TEMPLATES: Record<ReportKind, ReportTemplate[]> = {
  campers: [
    {
      id: "pending-arrivals",
      label: "Pending arrivals",
      title: "Pending arrivals",
      filters: { status: "registered" },
      columns: ["camper", "phone", "contact", "camp", "campus", "payment"],
    },
    {
      id: "medical",
      label: "Medical and special needs",
      title: "Medical and special needs",
      filters: { needsCare: true },
      columns: ["camper", "contact", "camp", "campus", "medical", "special"],
    },
    {
      id: "payments",
      label: "Payments to verify",
      title: "Payments to verify",
      filters: { payment: "pending" },
      columns: ["camper", "camp", "registration", "payment", "contact"],
    },
    {
      id: "assistance",
      label: "Assistance requests",
      title: "Financial assistance requests",
      filters: { payment: "waiver_requested" },
      columns: ["camper", "contact", "camp", "campus", "payment"],
    },
    {
      id: "walk-ins",
      label: "Walk-ins",
      title: "Walk-in registrations",
      filters: { registration: "walk_in" },
      columns: ["camper", "camp", "campus", "status", "payment"],
    },
    {
      id: "departed",
      label: "Checked out early",
      title: "Campers checked out",
      filters: { status: "checked_out" },
      columns: ["camper", "contact", "camp", "campus", "status"],
    },
  ],
  facilitators: [
    {
      id: "pending-arrivals",
      label: "Pending arrivals",
      title: "Facilitators pending arrival",
      filters: { status: "registered" },
      columns: ["camper", "phone", "team", "camp", "campus", "payment"],
    },
    {
      id: "medical",
      label: "Medical and special needs",
      title: "Facilitators with medical or special needs",
      filters: { needsCare: true },
      columns: ["camper", "phone", "contact", "team", "medical", "special"],
    },
    {
      id: "payments",
      label: "Payments to verify",
      title: "Facilitator payments to verify",
      filters: { payment: "pending" },
      columns: ["camper", "phone", "team", "payment"],
    },
  ],
  "age-gender": [],
}

/* A title built from the filters, until the person types their own.
   Examples: "All camps December 2026", "All camps facilitators December 2026",
   "All camps - age and gender December 2026" */
export function buildTitle(
  kind: ReportKind,
  filters: ReportFilters,
  camps: { id: string; category: string }[],
  editions: EditionInfo[]
): string {
  const camp = camps.find((c) => c.id === filters.campId)
  const edition = editions.find((e) => e.id === filters.editionId)

  const head = [camp ? camp.category.toUpperCase() : "All camps", KIND_TITLE_PHRASE[kind]]
    .filter(Boolean)
    .join(" ")
  const base = `${head} ${edition ? edition.name : editions.length > 0 ? "all editions" : ""}`.trim()

  const extras: string[] = []
  if (filters.registration) extras.push(REGISTRATION_LABELS[filters.registration])
  if (filters.status) extras.push(STATUS_LABELS[filters.status])
  if (filters.payment) extras.push(PAYMENT_LABELS[filters.payment])
  if (filters.gender) extras.push(GENDER_LABELS[filters.gender])
  if (filters.role) extras.push(filters.role)
  if (filters.age !== undefined) extras.push(`age ${filters.age}`)
  if (filters.campus) extras.push(filters.campus)
  if (filters.needsCare) extras.push("Medical or special needs")
  return [base, ...extras].join(" - ")
}