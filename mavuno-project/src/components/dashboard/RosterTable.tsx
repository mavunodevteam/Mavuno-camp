import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPhone } from "@/lib/phone"
import type { AttendanceStatus, Lookup, RosterRow } from "@/lib/api/types"
import { RowMenu } from "./RowMenu"

const STATUS: Record<AttendanceStatus, { label: string; className: string }> = {
  registered: { label: "Registered", className: "border-orange-200 bg-orange-50 text-orange-700" },
  checked_in: { label: "Checked in", className: "border-green-200 bg-green-50 text-green-700" },
  checked_out: { label: "Checked out", className: "border-zinc-200 bg-zinc-100 text-zinc-600" },
}

const SELECT_CLASS =
  "h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"

function formatTime(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" })
}

export interface RosterTableProps {
  rows: RosterRow[]
  total: number
  loading: boolean
  error: string | null
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  search: string
  onSearchChange: (value: string) => void
  campuses: Lookup[]
  campus: string
  onCampusChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  isHead: boolean
  busyId: string | null
  onCheckIn: (row: RosterRow) => void
  onExitPermit: (row: RosterRow) => void
  canManage?: boolean
  onVerifyPayment?: (row: RosterRow) => void
  onApproveAssistance?: (row: RosterRow) => void
}

export function RosterTable(p: RosterTableProps) {
  const totalPages = Math.max(1, Math.ceil(p.total / p.pageSize))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Camp roster &amp; status monitor</CardTitle>
        <CardDescription>
          Manage attendees, filter by campus or status, or process early exit permits.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={p.search}
            onChange={(e) => p.onSearchChange(e.target.value)}
            placeholder="Search by name, phone, M-Pesa code"
            className="flex-1"
          />
          <select
            className={SELECT_CLASS}
            value={p.campus}
            onChange={(e) => p.onCampusChange(e.target.value)}
            aria-label="Filter by campus"
          >
            <option value="all">All campuses</option>
            {p.campuses.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className={SELECT_CLASS}
            value={p.status}
            onChange={(e) => p.onStatusChange(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="registered">Registered</option>
            <option value="checked_in">Checked in</option>
            <option value="checked_out">Checked out</option>
          </select>
        </div>

        {p.error && <p className="text-sm text-destructive">{p.error}</p>}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Camper</TableHead>
              <TableHead>Emergency contact</TableHead>
              <TableHead>Campus</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Medical condition</TableHead>
              <TableHead>Special needs</TableHead>
              <TableHead>Actions</TableHead>
              {p.canManage && <TableHead>More</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {p.loading && (
              <TableRow>
                <TableCell colSpan={p.canManage ? 8 : 7}>Loading...</TableCell>
              </TableRow>
            )}
            {!p.loading && p.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={p.canManage ? 8 : 7}>No campers found.</TableCell>
              </TableRow>
            )}
            {!p.loading &&
              p.rows.map((row) => {
                const status = STATUS[row.attendance_status]
                const paymentOpen =
                  row.payment_status === "pending" || row.payment_status === "waiver_requested"
                return (
                  <TableRow key={row.registration_id}>
                    <TableCell>
                      <p className="font-medium">
                        {row.first_name} {row.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Age: {row.age} - {row.gender === "male" ? "Male" : "Female"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{row.emergency_contact_name}</p>
                      <p className="text-xs text-muted-foreground">{formatPhone(row.emergency_contact_phone)}</p>
                    </TableCell>
                    <TableCell>{row.campus ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                      {paymentOpen && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {row.payment_status === "pending" ? "Payment not verified" : "Assistance pending"}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{row.has_medical_condition ? (row.medical_details ?? "Yes") : "-"}</TableCell>
                    <TableCell>{row.has_special_needs ? (row.special_needs_details ?? "Yes") : "-"}</TableCell>
                    <TableCell>
                      {row.attendance_status === "registered" && (
                        <Button size="sm" disabled={p.busyId === row.registration_id} onClick={() => p.onCheckIn(row)}>
                          Check in
                        </Button>
                      )}
                      {row.attendance_status === "checked_in" &&
                        (p.isHead ? (
                          <Button variant="outline" size="sm" onClick={() => p.onExitPermit(row)}>
                            Issue exit permit
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">On site</span>
                        ))}
                      {row.attendance_status === "checked_out" && (
                        <span className="text-xs text-muted-foreground">{formatTime(row.checked_out_at)}</span>
                      )}
                    </TableCell>
                    {p.canManage && (
                      <TableCell>
                        <RowMenu
                          paymentStatus={row.payment_status}
                          onVerifyPayment={() => p.onVerifyPayment?.(row)}
                          onApproveAssistance={() => p.onApproveAssistance?.(row)}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {p.total.toLocaleString()} camper{p.total === 1 ? "" : "s"} - {p.pageSize} per page
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={p.page <= 1} onClick={() => p.onPageChange(p.page - 1)}>
              Previous
            </Button>
            <span>
              Page {p.page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={p.page >= totalPages}
              onClick={() => p.onPageChange(p.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}