/*
  The rules and helpers behind the Camp setup page, kept apart from the screen so they can be tested.
  Dates are plain "yyyy-mm-dd" text, never Date objects, so a date can never slip a day across time zones.
*/

export type Ymd = string | null

export type CampDetails = {
  startDate: Ymd
  endDate: Ymd
  camperLimit: number
  onlineFee: number
  walkInFee: number
  opens: Ymd
  closes: Ymd
}

export type CampRecord = {
  id: string
  category: "myf" | "mya"
  editionId: string
  details: CampDetails
  runs: boolean
  paused: boolean
  spotsUsed: number
  lastSavedAt: Date | null
  lastSavedBy: string | null
}

/* A row of the camps table as the database returns it */
export interface CampRow {
  id: string
  name: string
  min_age: number
  max_age: number | null
  category: "myf" | "mya"
  edition_id: string
  start_date: string | null
  end_date: string | null
  camper_limit: number | null
  fee_online: number
  fee_walk_in: number
  registration_opens: string | null
  registration_closes: string | null
  registration_paused: boolean
  runs: boolean
  welcome_description: string | null
  welcome_image_url: string | null
  welcome_bring: string | null
  welcome_expect: string | null
  welcome_know: string | null
  updated_at: string | null
  updated_by_name: string | null
  welcome_updated_at: string | null
  welcome_updated_by_name: string | null
}

export function toCampRecord(row: CampRow, spotsUsed: number): CampRecord {
  return {
    id: row.id,
    category: row.category,
    editionId: row.edition_id,
    details: {
      startDate: row.start_date,
      endDate: row.end_date,
      camperLimit: row.camper_limit ?? 0,
      onlineFee: row.fee_online,
      walkInFee: row.fee_walk_in,
      opens: row.registration_opens,
      closes: row.registration_closes,
    },
    runs: row.runs,
    paused: row.registration_paused,
    spotsUsed,
    lastSavedAt: row.updated_at ? new Date(row.updated_at) : null,
    lastSavedBy: row.updated_by_name,
  }
}

export function todayYmd(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

/* "2026-12-02" becomes "02/12/2026" */
export function formatYmd(value: Ymd): string {
  if (!value) return "Not set"
  const [y, m, d] = value.split("-")
  return `${d}/${m}/${y}`
}

export function formatMoney(n: number): string {
  return `KES ${n.toLocaleString("en-KE")}`
}

/* Whole days from one date to another: positive when the second is later */
export function daysBetween(fromYmd: string, toYmd: string): number {
  const toUtc = (value: string): number => {
    const [y, m, d] = value.split("-").map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((toUtc(toYmd) - toUtc(fromYmd)) / 86400000)
}

export function datesSet(d: CampDetails): boolean {
  return !!d.startDate && !!d.endDate && !!d.opens && !!d.closes
}

export type LinkStatus = {
  label: "Closed" | "Dates needed" | "Inactive" | "Paused" | "Scheduled" | "Active link"
  variant: "default" | "secondary" | "outline"
}

export function linkStatus(camp: CampRecord, editionOpen: boolean, today: string = todayYmd()): LinkStatus {
  const { opens, closes } = camp.details
  if (!editionOpen) return { label: "Closed", variant: "secondary" }
  if (!datesSet(camp.details) || !opens || !closes) return { label: "Dates needed", variant: "outline" }
  if (daysBetween(today, closes) < 0) return { label: "Inactive", variant: "secondary" }
  if (camp.paused) return { label: "Paused", variant: "secondary" }
  if (opens > today) return { label: "Scheduled", variant: "outline" }
  return { label: "Active link", variant: "default" }
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}

export function linkHint(camp: CampRecord, status: LinkStatus["label"], today: string = todayYmd()): string {
  const { opens, closes } = camp.details
  if (status === "Closed") return "This edition is closed. Campers can't sign up."
  if (status === "Dates needed" || !opens || !closes) return "Set the camp dates and the registration window to open registration."
  if (status === "Inactive") return `Closed on ${formatYmd(closes)}.`
  if (status === "Paused") return "Campers can't sign up until you resume the link."
  if (status === "Scheduled") {
    const days = daysBetween(today, opens)
    return days === 1 ? "Opens tomorrow." : `Opens in ${plural(days, "day")}.`
  }
  const days = daysBetween(today, closes)
  return days === 0 ? "Closes today." : `Closes in ${plural(days, "day")}.`
}

/* The days two camps share, or null when they do not overlap */
export function campOverlap(a: CampDetails, b: CampDetails): { start: string; end: string } | null {
  if (!a.startDate || !a.endDate || !b.startDate || !b.endDate) return null
  const start = a.startDate > b.startDate ? a.startDate : b.startDate
  const end = a.endDate < b.endDate ? a.endDate : b.endDate
  return start <= end ? { start, end } : null
}

/* Can this camp's details be saved? */
export function detailsValid(d: CampDetails, spotsUsed: number): boolean {
  return (
    datesSet(d) &&
    d.endDate! >= d.startDate! &&
    d.closes! >= d.opens! &&
    d.camperLimit > 0 &&
    d.camperLimit >= spotsUsed &&
    d.onlineFee >= 0 &&
    d.walkInFee >= 0
  )
}

/* Switching a camp off is not allowed once anyone has registered, or if it is the only camp running */
export function canSwitchOff(spotsUsed: number, otherRuns: boolean): { ok: boolean; reason?: string } {
  if (spotsUsed > 0) return { ok: false, reason: `${spotsUsed} ${spotsUsed === 1 ? "person has" : "people have"} already registered, so this camp has to stay on.` }
  if (!otherRuns) return { ok: false, reason: "An edition needs at least one camp, so switch the other camp on first." }
  return { ok: true }
}