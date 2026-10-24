import { useEffect, useState } from "react"
import { Printer } from "lucide-react"
import { toast } from "sonner"
import { ReportFilterBar, ReportOptions } from "@/components/reports/ReportFilterBar"
import { ReportRecordDialog } from "@/components/reports/ReportRecordDialog"
import { ReportTable } from "@/components/reports/ReportTable"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchCampuses, fetchFacilitatorRoles } from "@/lib/api/lookups"
import { fetchReportCamps } from "@/lib/api/reportCamps"
import {
  fetchAges,
  fetchEditions,
  fetchReportRows,
  fetchReportTotal,
  type EditionInfo,
  type ReportFilters,
  type ReportRow,
} from "@/lib/api/reports"
import {
  KIND_DEFAULTS,
  KIND_DESCRIPTION,
  PARTICIPANT_OF,
  TEMPLATES,
  buildTitle,
  type ColumnId,
  type ReportKind,
} from "@/lib/reportConfig"
import { useDebouncedValue } from "@/lib/useDashboardData"

interface CampInfo {
  id: string
  category: string
  edition_id: string | null
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

export default function ReportsPage() {
  const [kind, setKind] = useState<ReportKind>("campers")

  const [editions, setEditions] = useState<EditionInfo[]>([])
  const [camps, setCamps] = useState<CampInfo[]>([])
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([])
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([])
  const [ages, setAges] = useState<number[]>([])
  const [defaultEdition, setDefaultEdition] = useState<string | undefined>(undefined)
  const [ready, setReady] = useState(false)

  const [filters, setFilters] = useState<ReportFilters>({})
  const [search, setSearch] = useState("")
  const [columns, setColumns] = useState<ColumnId[]>(KIND_DEFAULTS.campers)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [titleEdited, setTitleEdited] = useState(false)

  const [rows, setRows] = useState<ReportRow[]>([])
  const [totalAll, setTotalAll] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<ReportRow | null>(null)

  const debouncedSearch = useDebouncedValue(search)
  const key = JSON.stringify({ kind, filters, search: debouncedSearch })

  /* The lists behind the dropdowns. The report starts on the open edition, as in the design. */
  useEffect(() => {
    Promise.all([fetchEditions(), fetchReportCamps(), fetchCampuses(), fetchFacilitatorRoles(), fetchAges()])
      .then(([editionList, campList, campusList, roleList, ageList]) => {
        const open = editionList.find((e) => e.is_open)
        setEditions(editionList)
        setCamps(campList)
        setCampuses(campusList)
        setRoles(roleList)
        setAges(ageList)
        setDefaultEdition(open?.id)
        setFilters({ editionId: open?.id })
      })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    setLoading(true)
    setError(null)
    const parsed = JSON.parse(key) as { kind: ReportKind; filters: ReportFilters; search: string }
    fetchReportRows({ ...parsed.filters, search: parsed.search }, PARTICIPANT_OF[parsed.kind])
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
  }, [key, ready])

  useEffect(() => {
    fetchReportTotal(PARTICIPANT_OF[kind])
      .then(setTotalAll)
      .catch((e: Error) => toast.error(e.message))
  }, [kind])

  const campName = (campId: string) => {
    const camp = camps.find((c) => c.id === campId)
    return camp ? camp.category.toUpperCase() : "-"
  }

  const shownTitle = titleEdited ? title : buildTitle(kind, filters, camps, editions)

  /* Switching tab starts that report fresh, on the same edition */
  function changeKind(next: ReportKind) {
    setKind(next)
    setFilters({ editionId: defaultEdition })
    setSearch("")
    setColumns(KIND_DEFAULTS[next])
    setTemplateId(null)
    setTitle("")
    setTitleEdited(false)
  }

  function applyTemplate(id: string | null) {
    setTemplateId(id)
    if (id === null) return
    const template = TEMPLATES[kind].find((t) => t.id === id)
    if (!template) return
    setFilters({ editionId: defaultEdition, ...template.filters })
    setSearch("")
    setColumns(template.columns)
    setTitle(template.title)
    setTitleEdited(true)
  }

  function reset() {
    setFilters({ editionId: defaultEdition })
    setSearch("")
    setColumns(KIND_DEFAULTS[kind])
    setTemplateId(null)
    setTitle("")
    setTitleEdited(false)
  }

  return (
    <div className="space-y-4">
      <style>{PRINT_CSS}</style>

      <Tabs value={kind} onValueChange={(v) => changeKind(String(v) as ReportKind)} className="print:hidden">
        <TabsList>
          <TabsTrigger value="campers">Campers</TabsTrigger>
          <TabsTrigger value="facilitators">Facilitators</TabsTrigger>
          <TabsTrigger value="age-gender">Age and gender</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Camp roster &amp; status monitor</CardTitle>
          <CardDescription>{KIND_DESCRIPTION[kind]}</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportFilterBar
            kind={kind}
            filters={filters}
            onFiltersChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            editions={editions}
            camps={camps}
            campuses={campuses}
            roles={roles}
            ages={ages}
            onReset={reset}
          />
        </CardContent>
      </Card>

      <Card className="print:border-0 print:shadow-none">
        <CardContent className="space-y-4 print:p-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-base font-semibold print:hidden">Report title</p>
              <p className="text-sm text-muted-foreground print:hidden">Built from your filters. Edit it before printing.</p>
              <Input
                value={shownTitle}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setTitleEdited(true)
                }}
                className="mt-2 w-full max-w-md print:hidden"
              />
              <h2 className="hidden text-xl font-bold print:block">{shownTitle}</h2>
              <p className="hidden text-xs text-muted-foreground print:block">
                Printed on {new Date().toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <Button onClick={() => window.print()} className="print:hidden">
                <Printer className="size-4" />
                Print report
              </Button>
              <span className="text-sm text-muted-foreground">
                {rows.length.toLocaleString()} of {totalAll.toLocaleString()} records
              </span>
            </div>
          </div>

          <ReportOptions
            kind={kind}
            templateId={templateId}
            onTemplate={applyTemplate}
            columns={columns}
            onColumnsChange={setColumns}
          />
        </CardContent>
      </Card>

      <ReportTable
        kind={kind}
        rows={rows}
        columns={columns}
        campName={campName}
        loading={loading}
        error={error}
        onView={setViewing}
      />

      <ReportRecordDialog row={viewing} campName={campName} onClose={() => setViewing(null)} />
    </div>
  )
}