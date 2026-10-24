import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ReportRow } from "@/lib/api/reports"
import { formatPhone } from "@/lib/phone"
import { PAYMENT_LABELS, STATUS_LABELS } from "@/lib/reportConfig"

function formatTime(iso: string | null): string {
  if (!iso) return "-"
  return new Date(iso).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })
}

/* The full record behind a row, opened from the three dots menu */
export function ReportRecordDialog({
  row,
  campName,
  onClose,
}: {
  row: ReportRow | null
  campName: (campId: string) => string
  onClose: () => void
}) {
  const details: [string, string][] = row
    ? [
        ["Age and gender", `${row.age} - ${row.gender === "male" ? "Male" : "Female"}`],
        ["Phone number", row.phone ? formatPhone(row.phone) : "-"],
        ["Camp", row.serves_both ? "Both" : campName(row.camp_id)],
        ["Campus", row.campus ?? "-"],
        ...(row.participant_type === "facilitator" ? ([["Team", row.facilitator_role ?? "-"]] as [string, string][]) : []),
        ["Status", STATUS_LABELS[row.attendance_status]],
        ["Checked in", formatTime(row.checked_in_at)],
        ["Checked out", formatTime(row.checked_out_at)],
        ["Registration", row.source === "walk_in" ? "Walk-in" : "Online"],
        ["Payment", row.payment_status ? PAYMENT_LABELS[row.payment_status] : "-"],
        ["M-Pesa code", row.mpesa_receipt ?? "-"],
        ["Emergency contact", `${row.emergency_contact_name}, ${formatPhone(row.emergency_contact_phone)}`],
        ["Medical condition", row.has_medical_condition ? (row.medical_details ?? "Yes") : "None"],
        ["Special needs", row.has_special_needs ? (row.special_needs_details ?? "Yes") : "None"],
        ["Baptism", row.wants_baptism === undefined ? "-" : row.wants_baptism ? "Yes" : "No"],
        ["Registered on", formatTime(row.created_at)],
      ]
    : []

  return (
    <Dialog
      open={row !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{row ? `${row.first_name} ${row.last_name}` : ""}</DialogTitle>
          <DialogDescription>Full record</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
          {details.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="col-span-2">{value}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  )
}