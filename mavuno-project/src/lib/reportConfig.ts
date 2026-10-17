import type { AttendanceStatus, PaymentStatus, RegistrationKind, ReportFilters } from "@/lib/api/reports"

export type ColumnId =
  | "camper"
  | "contact"
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
  "contact",
  "camp",
  "campus",
  "status",
  "medical",
  "special",
  "baptism",
  "payment",
  "registration",
]

export const COLUMN_LABELS: Record<ColumnId, string> = {
  camper: "Camper",
  contact: "Emergency contact",
  camp: "Camp",
  campus: "Campus",
  status: "Status",
  medical: "Medical condition",
  special: "Special needs",
  baptism: "Baptism",
  payment: "Payment",
  registration: "Registration",
}

export const DEFAULT_COLUMNS: ColumnId[] = [
  "camper",
  "contact",
  "camp",
  "campus",
  "status",
  "medical",
  "special",
  "baptism",
]

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
  online: "Online campers",
  walk_in: "Walk-in campers",
  facilitator: "Facilitators",
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
export const TEMPLATES: ReportTemplate[] = [
  {
    id: "pending-arrivals",
    label: "Pending arrivals",
    title: "Pending arrivals",
    filters: { status: "registered" },
    columns: ["camper", "contact", "camp", "campus", "payment"],
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
]