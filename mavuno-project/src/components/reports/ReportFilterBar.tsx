import { ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FilterSelect, type Option } from "@/components/FilterSelect"
import type {
  AttendanceStatus,
  EditionInfo,
  PaymentStatus,
  RegistrationKind,
  ReportFilters,
} from "@/lib/api/reports"
import {
  GENDER_LABELS,
  KIND_COLUMNS,
  PAYMENT_LABELS,
  REGISTRATION_LABELS,
  STATUS_LABELS,
  TEMPLATES,
  columnLabel,
  type ColumnId,
  type ReportKind,
} from "@/lib/reportConfig"

export interface CampOption {
  id: string
  category: string
  edition_id?: string | null
}

/* "all" in a dropdown means no filter */
function pick<T extends string>(value: string): T | undefined {
  return value === "all" ? undefined : (value as T)
}

const SEARCH_PLACEHOLDER: Record<ReportKind, string> = {
  campers: "Search by name, phone, M-Pesa code",
  facilitators: "Search by name or phone",
  "age-gender": "Search by name",
}

/* The search box and the filters. Which filters appear depends on the report. */
export function ReportFilterBar({
  kind,
  filters,
  onFiltersChange,
  search,
  onSearchChange,
  editions,
  camps,
  campuses,
  roles,
  ages,
  onReset,
}: {
  kind: ReportKind
  filters: ReportFilters
  onFiltersChange: (next: ReportFilters) => void
  search: string
  onSearchChange: (value: string) => void
  editions: EditionInfo[]
  camps: CampOption[]
  campuses: { id: string; name: string }[]
  roles: { id: string; name: string }[]
  ages: number[]
  onReset: () => void
}) {
  const set = (patch: Partial<ReportFilters>) => onFiltersChange({ ...filters, ...patch })

  const editionOptions: Option[] = [
    { value: "all", label: "All editions" },
    ...editions.map((e) => ({ value: e.id, label: e.name })),
  ]
  const campOptions: Option[] = [
    { value: "all", label: "All camps" },
    ...camps
      .filter((c) => !filters.editionId || c.edition_id === filters.editionId)
      .map((c) => {
        /* Across all editions the same camp name repeats, so the edition is added to tell them apart */
        const edition = filters.editionId ? undefined : editions.find((e) => e.id === c.edition_id)
        return { value: c.id, label: edition ? `${c.category.toUpperCase()} (${edition.name})` : c.category.toUpperCase() }
      }),
  ]
  const roleOptions: Option[] = [
    { value: "all", label: "All facilitators" },
    ...roles.map((r) => ({ value: r.name, label: r.name })),
  ]
  const ageOptions: Option[] = [
    { value: "all", label: "All ages" },
    ...ages.map((a) => ({ value: String(a), label: String(a) })),
  ]
  const campusOptions: Option[] = [
    { value: "all", label: "All campuses" },
    ...campuses.map((c) => ({ value: c.name, label: c.name })),
  ]
  const statusOptions: Option[] = [
    { value: "all", label: "All statuses" },
    ...(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((s) => ({ value: s, label: STATUS_LABELS[s] })),
  ]
  const paymentOptions: Option[] = [
    { value: "all", label: "All payments" },
    ...(Object.keys(PAYMENT_LABELS) as PaymentStatus[]).map((p) => ({ value: p, label: PAYMENT_LABELS[p] })),
  ]
  const registrationOptions: Option[] = [
    { value: "all", label: "All registrations" },
    ...(Object.keys(REGISTRATION_LABELS) as RegistrationKind[]).map((r) => ({ value: r, label: REGISTRATION_LABELS[r] })),
  ]
  const genderOptions: Option[] = [
    { value: "all", label: "All genders" },
    { value: "male", label: GENDER_LABELS.male },
    { value: "female", label: GENDER_LABELS.female },
  ]

  const trigger = "h-9 w-auto min-w-32"

  return (
    <div className="space-y-4 print:hidden">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="bg-muted/50 pl-8"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={SEARCH_PLACEHOLDER[kind]}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {editions.length > 0 && (
          <FilterSelect
            label="Edition"
            className={trigger}
            value={filters.editionId ?? "all"}
            onChange={(v) => set({ editionId: pick(v), campId: undefined })}
            options={editionOptions}
          />
        )}
        <FilterSelect
          label="Camp"
          className={trigger}
          value={filters.campId ?? "all"}
          onChange={(v) => set({ campId: pick(v) })}
          options={campOptions}
        />
        {kind === "facilitators" && (
          <FilterSelect
            label="Role"
            className={trigger}
            value={filters.role ?? "all"}
            onChange={(v) => set({ role: pick(v) })}
            options={roleOptions}
          />
        )}
        {kind === "age-gender" && (
          <FilterSelect
            label="Age"
            className={trigger}
            value={filters.age === undefined ? "all" : String(filters.age)}
            onChange={(v) => set({ age: v === "all" ? undefined : Number(v) })}
            options={ageOptions}
          />
        )}
        <FilterSelect
          label="Campus"
          className={trigger}
          value={filters.campus ?? "all"}
          onChange={(v) => set({ campus: pick(v) })}
          options={campusOptions}
        />
        {kind !== "age-gender" && (
          <>
            <FilterSelect
              label="Status"
              className={trigger}
              value={filters.status ?? "all"}
              onChange={(v) => set({ status: pick<AttendanceStatus>(v) })}
              options={statusOptions}
            />
            <FilterSelect
              label="Payment"
              className={trigger}
              value={filters.payment ?? "all"}
              onChange={(v) => set({ payment: pick<PaymentStatus>(v) })}
              options={paymentOptions}
            />
          </>
        )}
        {kind === "campers" && (
          <FilterSelect
            label="Registration"
            className={trigger}
            value={filters.registration ?? "all"}
            onChange={(v) => set({ registration: pick<RegistrationKind>(v) })}
            options={registrationOptions}
          />
        )}
        <FilterSelect
          label="Gender"
          className={trigger}
          value={filters.gender ?? "all"}
          onChange={(v) => set({ gender: pick<"male" | "female">(v) })}
          options={genderOptions}
        />
        <Button variant="outline" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  )
}

/* The report template dropdown and the Columns menu, shown under the report title */
export function ReportOptions({
  kind,
  templateId,
  onTemplate,
  columns,
  onColumnsChange,
}: {
  kind: ReportKind
  templateId: string | null
  onTemplate: (templateId: string | null) => void
  columns: ColumnId[]
  onColumnsChange: (next: ColumnId[]) => void
}) {
  const templates = TEMPLATES[kind]
  const templateOptions: Option[] = [
    { value: "none", label: "No report template" },
    ...templates.map((t) => ({ value: t.id, label: t.label })),
  ]

  function toggleColumn(id: ColumnId) {
    const next = columns.includes(id) ? columns.filter((c) => c !== id) : [...columns, id]
    /* Always keep at least one column so the table never disappears */
    if (next.length > 0) onColumnsChange(next)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      {templates.length > 0 && (
        <FilterSelect
          label="Report template"
          className="h-9 w-auto min-w-44"
          value={templateId ?? "none"}
          onChange={(v) => onTemplate(v === "none" ? null : v)}
          options={templateOptions}
        />
      )}
      <details className="relative">
        <summary className="flex h-9 min-w-32 cursor-pointer list-none items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm">
          Columns
          <ChevronDown className="size-4 text-muted-foreground" />
        </summary>
        <div className="absolute left-0 z-10 mt-1 w-56 space-y-2 rounded-md border bg-popover p-3 shadow-md">
          {KIND_COLUMNS[kind].map((id) => (
            <label key={id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={columns.includes(id)} onChange={() => toggleColumn(id)} />
              {columnLabel(kind, id)}
            </label>
          ))}
        </div>
      </details>
    </div>
  )
}