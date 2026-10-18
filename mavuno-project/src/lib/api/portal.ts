import { supabase } from "@/lib/supabase"
import { friendlyError } from "@/lib/errors"
import type {
  AttendanceStatus,
  DashboardCounts,
  DashboardTotals,
  ParticipantType,
  RosterRow,
} from "./types"

export interface RosterFilters {
  campId?: string
  participantType?: ParticipantType
  search?: string
  campus?: string
  status?: AttendanceStatus
  page?: number
  pageSize?: number
}

export interface RosterResult {
  rows: RosterRow[]
  total: number
}

export async function fetchRoster(f: RosterFilters): Promise<RosterResult> {
  const page = f.page ?? 1
  const pageSize = f.pageSize ?? 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("camper_roster")
    .select("*", { count: "exact" })
    .eq("participant_type", f.participantType ?? "camper")
    .order("created_at", { ascending: false })
    .range(from, to)

  if (f.campId) query = query.eq("camp_id", f.campId)
  if (f.campus) query = query.eq("campus", f.campus)
  if (f.status) query = query.eq("attendance_status", f.status)

  if (f.search) {
    const s = f.search.replace(/[%_]/g, "")
    query = query.or(
      `first_name.ilike.%${s}%,last_name.ilike.%${s}%,phone.ilike.%${s}%,mpesa_receipt.ilike.%${s}%`
    )
  }

  const { data, error, count } = await query
  if (error) throw new Error(friendlyError(error))
  return { rows: (data ?? []) as RosterRow[], total: count ?? 0 }
}

/* One row per camp. The dashboard adds them up for the "All camps" tab. */
export async function fetchAllDashboards(): Promise<DashboardCounts[]> {
  const { data, error } = await supabase.from("dashboard_counts").select("*")
  if (error) throw new Error(friendlyError(error))
  return (data ?? []) as DashboardCounts[]
}

export function sumDashboards(rows: DashboardCounts[]): DashboardTotals {
  const totals: DashboardTotals = {
    total_registered_campers: 0,
    present_on_site: 0,
    pending_arrivals: 0,
    departed: 0,
    walk_in_registrations: 0,
    online_checked_in: 0,
    walk_in_checked_in: 0,
    present_male: 0,
    present_female: 0,
    total_registered_facilitators: 0,
  }
  for (const r of rows) {
    totals.total_registered_campers += r.total_registered_campers
    totals.present_on_site += r.present_on_site
    totals.pending_arrivals += r.pending_arrivals
    totals.departed += r.departed
    totals.walk_in_registrations += r.walk_in_registrations
    totals.online_checked_in += r.online_checked_in
    totals.walk_in_checked_in += r.walk_in_checked_in
    totals.present_male += r.present_male
    totals.present_female += r.present_female
    totals.total_registered_facilitators += r.total_registered_facilitators
  }
  return totals
}

export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export async function checkIn(registrationId: string): Promise<void> {
  const userId = await currentUserId()
  if (!userId) throw new Error("You must be signed in to check someone in")
  const { error } = await supabase
    .from("attendance")
    .insert({ registration_id: registrationId, checked_in_by: userId })
  if (error) throw new Error(friendlyError(error))
}

export async function issueExitPermit(
  registrationId: string,
  departureReasonId: string,
  notes?: string
): Promise<void> {
  const userId = await currentUserId()

  if (!userId) {
    throw new Error("You must be signed in")
  }

  const { error } = await supabase
    .from("attendance")
    .update({
      checked_out_at: new Date().toISOString(),
      departure_reason_id: departureReasonId,
      departure_authorized_by: userId,
      notes: notes?.trim() || null,
    })
    .eq("registration_id", registrationId)
    .is("checked_out_at", null)

  if (error) {
    throw new Error(friendlyError(error))
  }
}

export interface WaiverRow {
  batch_id: string
  first_name: string
  last_name: string
  age: number
  gender: string
  campus: string | null
  camp_name: string
  status: string
  created_at: string
  wants_baptism: boolean
}

export async function fetchWaivers(): Promise<WaiverRow[]> {
  const { data, error } = await supabase
    .from("registration_batches")
    .select(`
      id,
      created_at,
      camps (name),
      payments!inner (status),
      registrations (first_name, last_name, age, gender, wants_baptism, campuses(name))
    `)
    .eq("payments.status", "waiver_requested")

  if (error) throw new Error(friendlyError(error))
  
  return (data ?? []).map((b: any) => {
    const reg = b.registrations?.[0] // Safely get the first camper
    return {
      batch_id: b.id,
      first_name: reg?.first_name ?? "Unknown",
      last_name: reg?.last_name ?? "",
      age: reg?.age ?? 0,
      gender: reg?.gender ?? "",
      campus: reg?.campuses?.name ?? "N/A",
      camp_name: b.camps?.name ?? "N/A",
      status: "pending",
      created_at: b.created_at,
      wants_baptism: reg?.wants_baptism ?? false,
    }
  })
}

export async function approveWaiver(batchId: string): Promise<void> {
  const { error } = await supabase.rpc("approve_waiver", { p_batch_id: batchId })
  if (error) throw new Error(friendlyError(error))
}

export async function rejectWaiver(batchId: string): Promise<void> {
  const { error } = await supabase
    .from("payments")
    .update({ status: "failed" })
    .eq("batch_id", batchId)
    .eq("status", "waiver_requested")
  
  if (error) throw new Error(friendlyError(error))
}