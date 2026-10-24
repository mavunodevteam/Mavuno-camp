export interface Camp {
  id: string
  name: string
  category: 'myf' | 'mya'
  start_date: string | null
  end_date: string | null
  min_age: number
  max_age: number | null
  fee_online: number
  fee_walk_in: number
  registration_open: boolean
  runs?: boolean
  registration_opens?: string | null
  registration_closes?: string | null
  welcome_description?: string | null
  welcome_image_url?: string | null
  welcome_bring?: string | null
  welcome_expect?: string | null
  welcome_know?: string | null
}

export type Campus = {
  id: string
  name: string
  created_at: string
}

export type FacilitatorRole = {
  id: string
  name: string
  created_at: string
}

export type DepartureReason = {
  id: string
  name: string
  created_at: string
}

export type Contact = {
  id: string
  first_name: string
  last_name: string
  phone: string
  contact_type: "guardian" | "emergency"
  created_at: string
}

export type StaffProfile = {
  id: string
  full_name: string
  phone: string | null
  access_level: "facilitator" | "head" | "admin"
  is_active: boolean
  created_at: string
}

export type RegistrationBatch = {
  id: string
  camp_id: string
  contact_id: string
  relationship_to_campers: string
  source: "online" | "walk_in"
  registered_by: string | null
  total_amount: number
  created_at: string
}

export type Registration = {
  id: string
  batch_id: string
  participant_type: "camper" | "facilitator"
  first_name: string
  last_name: string
  age: number
  gender: "male" | "female"
  phone: string | null
  email: string | null
  wants_baptism: boolean
  from_mavuno: boolean | null
  campus_id: string | null
  church_name: string | null
  facilitator_role_id: string | null
  has_medical_condition: boolean
  medical_details: string | null
  has_special_needs: boolean
  special_needs_details: string | null
  created_at: string
}

export type Payment = {
  id: string
  batch_id: string
  mpesa_receipt: string | null
  amount: number
  status: "pending" | "success" | "failed" | "waiver_requested" | "waiver_approved"
  waiver_approved_by: string | null
  recorded_by: string | null
  created_at: string
}

export type Attendance = {
  id: string
  registration_id: string
  checked_in_at: string
  checked_in_by: string
  checked_out_at: string | null
  departure_reason_id: string | null
  departure_authorized_by: string | null
  notes: string | null
}

export type AttendanceStatus =
  | "registered"
  | "checked_in"
  | "checked_out"

export type ParticipantType = "camper" | "facilitator"

export type Lookup = {
  id: string
  name: string
}

export type RosterRow = {
  registration_id: string
  camp_id: string
  camp_name: string
  participant_type: ParticipantType
  first_name: string
  last_name: string
  age: number
  gender: "male" | "female"
  phone: string | null
  email: string | null
  campus: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  attendance_status: AttendanceStatus
  payment_status: Payment["status"] | null
  checked_out_at: string | null
  has_medical_condition: boolean
  medical_details: string | null
  has_special_needs: boolean
  special_needs_details: string | null
  created_at: string
}

export type DashboardCounts = {
  camp_id: string
  camp_name: string
  total_registered_campers: number
  present_on_site: number
  pending_arrivals: number
  departed: number
  walk_in_registrations: number
  online_checked_in: number
  walk_in_checked_in: number
  present_male: number
  present_female: number
  total_registered_facilitators: number
}

export type DashboardTotals = Omit<
  DashboardCounts,
  "camp_id" | "camp_name"
>