import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AttendanceStatus, PaymentStatus, RegistrationKind, ReportFilters } from "@/lib/api/reports"
import {
  COLUMN_LABELS,
  COLUMN_ORDER,
  GENDER_LABELS,
  PAYMENT_LABELS,
  REGISTRATION_LABELS,
  STATUS_LABELS,
  TEMPLATES,
  type ColumnId,
} from "@/lib/reportConfig"

const SELECT_CLASS =
  "h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"

export interface CampOption {
  id: string
  category: string
}

/* "all" in a dropdown means no filter */
function pick<T extends string>(value: string): T | undefined {
  return value === "all" ? undefined : (value as T)
}

export function ReportFilterBar({
  filters,
  onFiltersChange,
  search,
  onSearchChange,
  camps,
  campuses,
  columns,
  onColumnsChange,
  onTemplate,
  onReset,
}: {
  filters: ReportFilters
  onFiltersChange: (next: ReportFilters) => void
  search: string
  onSearchChange: (value: string) => void
  camps: CampOption[]
  campuses: { id: string; name: string }[]
  columns: ColumnId[]
  onColumnsChange: (next: ColumnId[]) => void
  onTemplate: (templateId: string) => void
  onReset: () => void
}) {
  const set = (patch: Partial<ReportFilters>) => onFiltersChange({ ...filters, ...patch })

  function toggleColumn(id: ColumnId) {
    const next = columns.includes(id) ? columns.filter((c) => c !== id) : [...columns, id]
    /* Always keep at least one column so the table never disappears */
    if (next.length > 0) onColumnsChange(next)
  }

  return (
    <div className="space-y-3 print:hidden">
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by name, phone, M-Pesa code"
        className="max-w-sm"
      />

      <div className="flex flex-wrap gap-2">
        <select
          className={SELECT_CLASS}
          aria-label="Camp"
          value={filters.campId ?? "all"}
          onChange={(e) => set({ campId: pick(e.target.value) })}
        >
          <option value="all">All camps</option>
          {camps.map((c) => (
            <option key={c.id} value={c.id}>
              {c.category.toUpperCase()}
            </option>
          ))}
        </select>

        <select
          className={SELECT_CLASS}
          aria-label="Gender"
          value={filters.gender ?? "all"}
          onChange={(e) => set({ gender: pick<"male" | "female">(e.target.value) })}
        >
          <option value="all">All genders</option>
          <option value="male">{GENDER_LABELS.male}</option>
          <option value="female">{GENDER_LABELS.female}</option>
        </select>

        <select
          className={SELECT_CLASS}
          aria-label="Campus"
          value={filters.campus ?? "all"}
          onChange={(e) => set({ campus: pick(e.target.value) })}
        >
          <option value="all">All campuses</option>
          {campuses.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className={SELECT_CLASS}
          aria-label="Payment"
          value={filters.payment ?? "all"}
          onChange={(e) => set({ payment: pick<PaymentStatus>(e.target.value) })}
        >
          <option value="all">All payments</option>
          {(Object.keys(PAYMENT_LABELS) as PaymentStatus[]).map((p) => (
            <option key={p} value={p}>
              {PAYMENT_LABELS[p]}
            </option>
          ))}
        </select>

        <select
          className={SELECT_CLASS}
          aria-label="Status"
          value={filters.status ?? "all"}
          onChange={(e) => set({ status: pick<AttendanceStatus>(e.target.value) })}
        >
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          className={SELECT_CLASS}
          aria-label="Registration"
          value={filters.registration ?? "all"}
          onChange={(e) => set({ registration: pick<RegistrationKind>(e.target.value) })}
        >
          <option value="all">All registrations</option>
          {(Object.keys(REGISTRATION_LABELS) as RegistrationKind[]).map((r) => (
            <option key={r} value={r}>
              {REGISTRATION_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className={SELECT_CLASS}
          aria-label="Report templates"
          value=""
          onChange={(e) => {
            if (e.target.value) onTemplate(e.target.value)
          }}
        >
          <option value="">Report templates</option>
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        <details className="relative">
          <summary className={`${SELECT_CLASS} flex cursor-pointer list-none items-center`}>Columns</summary>
          <div className="absolute left-0 z-10 mt-1 w-56 space-y-2 rounded-md border bg-popover p-3 shadow-md">
            {COLUMN_ORDER.map((id) => (
              <label key={id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={columns.includes(id)} onChange={() => toggleColumn(id)} />
                {COLUMN_LABELS[id]}
              </label>
            ))}
          </div>
        </details>

        <Button onClick={onReset}>Reset</Button>
      </div>
    </div>
  )
}