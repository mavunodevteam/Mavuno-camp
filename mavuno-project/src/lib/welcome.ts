import { formatYmd, todayYmd } from "@/lib/campSetup"

export type CampCategory = "myf" | "mya"

/* Used until an admin saves their own picture and words */
export const DEFAULT_IMAGE: Record<CampCategory, string> = {
  myf: "/assets/MYF.png",
  mya: "/assets/MYA.png",
}

export const DEFAULT_DESCRIPTION: Record<CampCategory, string> = {
  myf: "Empowering teenagers through mentorship and engaging activities designed for this crucial development stage.",
  mya: "A space for young adults navigating post-high school life, campus, careers, and building lasting communities.",
}

/* One item per line, blank lines ignored */
export function splitLines(text: string | null | undefined): string[] {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/* "2026-12-02" and "2026-12-05" become "02 - 05 Dec 2026". Empty dates read as to be announced. */
export function formatCampRange(start: string | null, end: string | null): string {
  if (!start || !end) return "Dates to be announced"
  const [sy, sm, sd] = start.split("-").map(Number)
  const [ey, em, ed] = end.split("-").map(Number)
  const pad = (n: number) => String(n).padStart(2, "0")
  if (sy === ey && sm === em) return `${pad(sd)} - ${pad(ed)} ${MONTHS[sm - 1]} ${sy}`
  return `${pad(sd)} ${MONTHS[sm - 1]} - ${pad(ed)} ${MONTHS[em - 1]} ${ey}`
}

export function ageLabel(minAge: number, maxAge: number | null): string {
  return maxAge !== null ? `Age ${minAge} - ${maxAge}` : `Age ${minAge}+`
}

/* What the public button says. The database decides open or closed; the window dates add the wording. */
export function registrationState(
  camp: { registration_open: boolean; registration_opens?: string | null; registration_closes?: string | null },
  today: string = todayYmd()
): { open: boolean; label: string } {
  if (!camp.registration_open) return { open: false, label: "Registration closed" }
  if (camp.registration_opens && camp.registration_opens > today) {
    return { open: false, label: `Registration opens ${formatYmd(camp.registration_opens)}` }
  }
  if (camp.registration_closes && camp.registration_closes < today) return { open: false, label: "Registration closed" }
  return { open: true, label: "" }
}