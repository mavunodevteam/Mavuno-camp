import { supabase } from "@/lib/supabase"
import { friendlyError } from "@/lib/errors"

export type AttendanceStatus = "registered" | "checked_in" | "checked_out"
export type PaymentStatus = "pending" | "success" | "failed" | "waiver_requested" | "waiver_approved"
export type RegistrationKind = "online" | "walk_in" | "facilitator"

export interface ReportFilters {
  campId?: string
  gender?: "male" | "female"
  campus?: string
  payment?: PaymentStatus
  status?: AttendanceStatus
  registration?: RegistrationKind
  needsCare?: boolean /* medical condition or special needs */
  search?: string
}

/* One row of the camper_roster view */
export interface ReportRow {
  registration_id: string
  batch_id: string
  camp_id: string
  source: "online" | "walk_in"
  participant_type: "camper" | "facilitator"
  first_name: string
  last_name: string
  age: number
  gender: "male" | "female"
  phone: string | null
  campus: string | null
  has_medical_condition: boolean
  medical_details: string | null
  has_special_needs: boolean
  special_needs_details: string | null
  emergency_contact_name: string
  emergency_contact_phone: string
  mpesa_receipt: string | null
  payment_status: PaymentStatus | null
  attendance_status: AttendanceStatus
  checked_in_at: string | null
  checked_out_at: string | null
  created_at: string
  wants_baptism?: boolean /* present once the view has been updated */
}

const CHUNK = 1000 /* the database returns at most this many rows per request */
const MAX_ROWS = 5000

/* Every row that matches, fetched in chunks, sorted by name for printing */
export async function fetchReportRows(f: ReportFilters): Promise<ReportRow[]> {
  const all: ReportRow[] = []

  for (let from = 0; from < MAX_ROWS; from += CHUNK) {
    let query = supabase
      .from("camper_roster")
      .select("*")
      .order("last_name")
      .order("first_name")
      .order("registration_id")
      .range(from, from + CHUNK - 1)

    if (f.campId) query = query.eq("camp_id", f.campId)
    if (f.gender) query = query.eq("gender", f.gender)
    if (f.campus) query = query.eq("campus", f.campus)
    if (f.payment) query = query.eq("payment_status", f.payment)
    if (f.status) query = query.eq("attendance_status", f.status)
    if (f.needsCare) query = query.or("has_medical_condition.eq.true,has_special_needs.eq.true")

    if (f.registration === "facilitator") {
      query = query.eq("participant_type", "facilitator")
    } else if (f.registration === "online") {
      query = query.eq("participant_type", "camper").eq("source", "online")
    } else if (f.registration === "walk_in") {
      query = query.eq("participant_type", "camper").eq("source", "walk_in")
    }

    const terms = (f.search ?? "").trim().split(/\s+/).filter(Boolean)
    for (const raw of terms) {
      let t = raw.replace(/[%,()*\\]/g, "")
      if (!t) continue
      /* Phones are stored as 254..., so a typed 07... must be converted before searching */
      if (/^0\d+$/.test(t)) t = "254" + t.slice(1)
      query = query.or(
        `first_name.ilike.%${t}%,last_name.ilike.%${t}%,phone.ilike.%${t}%,mpesa_receipt.ilike.%${t}%`,
      )
    }

    const { data, error } = await query
    if (error) throw new Error(friendlyError(error))
    const rows = (data ?? []) as ReportRow[]
    all.push(...rows)
    if (rows.length < CHUNK) break
  }
  return all
}

/* The "of 38 records" figure: everything in the roster, ignoring filters */
export async function fetchReportTotal(): Promise<number> {
  const { count, error } = await supabase
    .from("camper_roster")
    .select("*", { count: "exact", head: true })
  if (error) throw new Error(friendlyError(error))
  return count ?? 0
}