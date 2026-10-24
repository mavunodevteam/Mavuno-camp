import type { ReactNode } from "react"
import { MoreVertical } from "lucide-react"
import type { ReportRow } from "@/lib/api/reports"
import { formatPhone } from "@/lib/phone"
import {
  COLUMN_ORDER,
  PAYMENT_LABELS,
  STATUS_LABELS,
  columnLabel,
  type ColumnId,
  type ReportKind,
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

function genderLabel(row: ReportRow): string {
  return row.gender === "male" ? "Male" : "Female"
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
            Age: {row.age} - {genderLabel(row)}
          </p>
        </>
      )
    case "name":
      return (
        <span className="font-medium">
          {row.first_name} {row.last_name}
        </span>
      )
    case "age":
      return row.age
    case "gender":
      return genderLabel(row)
    case "phone":
      return row.phone ? formatPhone(row.phone) : "-"
    case "contact":
      return (
        <>
          <p>{row.emergency_contact_name}</p>
          <p className="text-xs text-muted-foreground">{formatPhone(row.emergency_contact_phone)}</p>
        </>
      )
    case "team":
      return row.facilitator_role ?? "-"
    case "camp":
      return row.serves_both ? "Both" : campName(row.camp_id)
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

/* The three dots on each row. For now it has one action: see the full record. */
function RowMenu({ onView }: { onView: () => void }) {
  return (
    <details className="relative">
      <summary
        aria-label="Row actions"
        className="flex size-8 cursor-pointer list-none items-center justify-center rounded-md hover:bg-muted"
      >
        <MoreVertical className="size-4" />
      </summary>
      <div className="absolute right-0 z-10 mt-1 w-40 rounded-md border bg-popover p-1 shadow-md">
        <button
          type="button"
          className="block w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
          onClick={(e) => {
            e.currentTarget.closest("details")?.removeAttribute("open")
            onView()
          }}
        >
          View details
        </button>
      </div>
    </details>
  )
}

/* A plain HTML table on purpose: it prints cleanly and repeats its header on every page */
export function ReportTable({
  kind,
  rows,
  columns,
  campName,
  loading,
  error,
  onView,
}: {
  kind: ReportKind
  rows: ReportRow[]
  columns: ColumnId[]
  campName: (campId: string) => string
  loading: boolean
  error: string | null
  onView: (row: ReportRow) => void
}) {
  const visible = COLUMN_ORDER.filter((id) => columns.includes(id))
  const span = visible.length + 1

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive print:hidden">{error}</p>}
      <div className="overflow-x-auto rounded-md border print:overflow-visible print:border-0">
        <table className="w-full border-collapse text-left text-sm print:text-xs">
          <thead className="bg-muted/50">
            <tr>
              {visible.map((id) => (
                <th key={id} className="whitespace-nowrap border-b px-3 py-3 font-medium">
                  {columnLabel(kind, id)}
                </th>
              ))}
              <th className="w-10 border-b px-3 py-3 print:hidden">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={span} className="px-3 py-4 text-muted-foreground">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={span} className="px-3 py-4 text-muted-foreground">
                  No records match these filters.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => (
                <tr key={row.registration_id} className="break-inside-avoid border-b last:border-b-0">
                  {visible.map((id) => (
                    <td key={id} className="whitespace-nowrap px-3 py-2 align-top">
                      {cell(id, row, campName)}
                    </td>
                  ))}
                  <td className="px-3 py-2 align-top print:hidden">
                    <RowMenu onView={() => onView(row)} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}