import type { ReactNode } from "react"
import type { ReportRow } from "@/lib/api/reports"
import { formatPhone } from "@/lib/phone"
import {
  COLUMN_LABELS,
  COLUMN_ORDER,
  PAYMENT_LABELS,
  STATUS_LABELS,
  type ColumnId,
} from "@/lib/reportConfig"

const STATUS_CLASS: Record<ReportRow["attendance_status"], string> = {
  registered: "border-orange-200 bg-orange-50 text-orange-700",
  checked_in: "border-green-200 bg-green-50 text-green-700",
  checked_out: "border-zinc-200 bg-zinc-100 text-zinc-600",
}

function registrationLabel(row: ReportRow): string {
  if (row.participant_type === "facilitator") return "Facilitator"
  return row.source === "walk_in" ? "Walk-in" : "Online"
}

function cell(id: ColumnId, row: ReportRow, campName: (campId: string) => string): ReactNode {
  switch (id) {
    case "camper":
      return (
        <>
          <p className="font-medium">
            {row.first_name} {row.last_name}
          </p>
          <p className="text-xs text-muted-foreground">
            Age: {row.age} - {row.gender === "male" ? "Male" : "Female"}
          </p>
        </>
      )
    case "contact":
      return (
        <>
          <p>{row.emergency_contact_name}</p>
          <p className="text-xs text-muted-foreground">{formatPhone(row.emergency_contact_phone)}</p>
        </>
      )
    case "camp":
      return campName(row.camp_id)
    case "campus":
      return row.campus ?? "-"
    case "status":
      return (
        <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${STATUS_CLASS[row.attendance_status]}`}>
          {STATUS_LABELS[row.attendance_status]}
        </span>
      )
    case "medical":
      return row.has_medical_condition ? (row.medical_details ?? "Yes") : "-"
    case "special":
      return row.has_special_needs ? (row.special_needs_details ?? "Yes") : "-"
    case "baptism":
      return row.wants_baptism === undefined ? "-" : row.wants_baptism ? "Yes" : "No"
    case "payment":
      return row.payment_status ? PAYMENT_LABELS[row.payment_status] : "-"
    case "registration":
      return registrationLabel(row)
  }
}

/* A plain HTML table on purpose: it prints cleanly and repeats its header on every page */
export function ReportTable({
  rows,
  columns,
  campName,
  loading,
  error,
}: {
  rows: ReportRow[]
  columns: ColumnId[]
  campName: (campId: string) => string
  loading: boolean
  error: string | null
}) {
  const visible = COLUMN_ORDER.filter((id) => columns.includes(id))

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive print:hidden">{error}</p>}
      <div className="overflow-x-auto rounded-md border print:overflow-visible print:border-0">
        <table className="w-full border-collapse text-left text-sm print:text-xs">
          <thead className="bg-muted/50">
            <tr>
              {visible.map((id) => (
                <th key={id} className="border-b px-3 py-2 font-medium">
                  {COLUMN_LABELS[id]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={visible.length} className="px-3 py-4 text-muted-foreground">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={visible.length} className="px-3 py-4 text-muted-foreground">
                  No records match these filters.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => (
                <tr key={row.registration_id} className="break-inside-avoid border-b last:border-b-0">
                  {visible.map((id) => (
                    <td key={id} className="px-3 py-2 align-top">
                      {cell(id, row, campName)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}