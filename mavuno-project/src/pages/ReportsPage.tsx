import { useEffect, useState } from "react"
import { Printer } from "lucide-react"
import { toast } from "sonner"
import { ReportFilterBar } from "@/components/reports/ReportFilterBar"
import { ReportTable } from "@/components/reports/ReportTable"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { fetchCamps, fetchCampuses } from "@/lib/api/lookups"
import { fetchReportRows, fetchReportTotal } from "@/lib/api/reports"
import type { ReportFilters, ReportRow } from "@/lib/api/reports"
import {
  DEFAULT_COLUMNS,
  GENDER_LABELS,
  PAYMENT_LABELS,
  REGISTRATION_LABELS,
  STATUS_LABELS,
  TEMPLATES,
  type ColumnId,
} from "@/lib/reportConfig"
import { useDebouncedValue } from "@/lib/useDashboardData"

interface CampInfo {
  id: string
  category: string
  start_date?: string
}

/* When printing, hide the sidebar and the page chrome so only the report is on paper.
   If the sidebar still shows on the printout, check the data-slot names in
   src/components/ui/sidebar.tsx and adjust the selectors below. */
const PRINT_CSS = `
@media print {
  @page { size: landscape; margin: 10mm; }
  [data-slot="sidebar"], [data-slot="sidebar-gap"], [data-slot="sidebar-container"] { display: none !important; }
  [data-slot="sidebar-inset"] { margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
  [data-sonner-toaster] { display: none !important; }
}
`

/* A title built from the filters, until the person types their own */
function buildTitle(filters: ReportFilters, camps: CampInfo[]): string {
  const camp = camps.find((c) => c.id === filters.campId)
  const year = (camp?.start_date ?? camps[0]?.start_date ?? "").slice(0, 4) || String(new Date().getFullYear())
  const parts = [`${camp ? camp.category.toUpperCase() : "All camps"} ${year}`]
  if (filters.registration) parts.push(REGISTRATION_LABELS[filters.registration])
  if (filters.status) parts.push(STATUS_LABELS[filters.status])
  if (filters.payment) parts.push(PAYMENT_LABELS[filters.payment])
  if (filters.gender) parts.push(GENDER_LABELS[filters.gender])
  if (filters.campus) parts.push(filters.campus)
  if (filters.needsCare) parts.push("Medical or special needs")
  return parts.join(" - ")
}

export default function ReportsPage() {
  const [camps, setCamps] = useState<CampInfo[]>([])
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([])

  const [filters, setFilters] = useState<ReportFilters>({})
  const [search, setSearch] = useState("")
  const [columns, setColumns] = useState<ColumnId[]>(DEFAULT_COLUMNS)
  const [title, setTitle] = useState("")
  const [titleEdited, setTitleEdited] = useState(false)

  const [rows, setRows] = useState<ReportRow[]>([])
  const [totalAll, setTotalAll] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search)
  const key = JSON.stringify({ ...filters, search: debouncedSearch })

  useEffect(() => {
    Promise.all([fetchCamps(), fetchCampuses(), fetchReportTotal()])
      .then(([campList, campusList, total]) => {
        setCamps(campList)
        setCampuses(campusList)
        setTotalAll(total)
      })
      .catch((e: Error) => toast.error(e.message))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchReportRows(JSON.parse(key) as ReportFilters)
      .then((result) => {
        if (cancelled) return
        setRows(result)
        setLoading(false)
      })
      .catch((e: Error) => {
        if (cancelled) return
        setError(e.message)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [key])

  const campName = (campId: string) => {
    const camp = camps.find((c) => c.id === campId)
    return camp ? camp.category.toUpperCase() : "-"
  }

  const shownTitle = titleEdited ? title : buildTitle(filters, camps)

  function applyTemplate(templateId: string) {
    const template = TEMPLATES.find((t) => t.id === templateId)
    if (!template) return
    setFilters(template.filters)
    setSearch("")
    setColumns(template.columns)
    setTitle(template.title)
    setTitleEdited(true)
  }

  function reset() {
    setFilters({})
    setSearch("")
    setColumns(DEFAULT_COLUMNS)
    setTitle("")
    setTitleEdited(false)
  }

  return (
    <Card>
      <style>{PRINT_CSS}</style>
      <CardHeader className="print:hidden">
        <CardTitle>Camp roster &amp; status monitor</CardTitle>
        <CardDescription>Filter, review and print camper and facilitator records.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ReportFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          search={search}
          onSearchChange={setSearch}
          camps={camps}
          campuses={campuses}
          columns={columns}
          onColumnsChange={setColumns}
          onTemplate={applyTemplate}
          onReset={reset}
        />

        <div className="space-y-3 rounded-lg border p-4 print:border-0 print:p-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold print:hidden">Report title</p>
              <p className="text-xs text-muted-foreground print:hidden">Built from your filters. Edit it before printing.</p>
              <Input
                value={shownTitle}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setTitleEdited(true)
                }}
                className="w-80 print:hidden"
              />
              <h2 className="hidden text-xl font-bold print:block">{shownTitle}</h2>
              <p className="hidden text-xs text-muted-foreground print:block">
                Printed on {new Date().toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">
                {rows.length.toLocaleString()} of {totalAll.toLocaleString()} records
              </span>
              <Button onClick={() => window.print()} className="print:hidden">
                <Printer className="size-4" />
                Print report
              </Button>
            </div>
          </div>

          <ReportTable rows={rows} columns={columns} campName={campName} loading={loading} error={error} />
        </div>
      </CardContent>
    </Card>
  )
}