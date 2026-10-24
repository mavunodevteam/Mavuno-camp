import type { Camp } from "@/lib/api/types"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/* "2026-12-02" and "2026-12-05" become "02 - 05 Dec 2026" */
export function formatRange(start: string, end: string): string {
  const [sy, sm, sd] = start.split("-").map(Number)
  const [ey, em, ed] = end.split("-").map(Number)
  const pad = (n: number) => String(n).padStart(2, "0")
  if (sy === ey && sm === em) {
    return `${pad(sd)} - ${pad(ed)} ${MONTHS[sm - 1]} ${sy}`
  }
  return `${pad(sd)} ${MONTHS[sm - 1]} - ${pad(ed)} ${MONTHS[em - 1]} ${ey}`
}

export function ageLabel(camp: Camp): string {
  return camp.max_age !== null ? `Age ${camp.min_age} - ${camp.max_age}` : `Age ${camp.min_age}+`
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-KE").format(value)
}