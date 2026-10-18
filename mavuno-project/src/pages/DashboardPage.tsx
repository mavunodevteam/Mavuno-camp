import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/components/AuthProvider"
import { AttendanceChart } from "@/components/dashboard/AttendanceChart"
import { CampTabs } from "@/components/dashboard/CampTabs"
import { ExitPermitDialog } from "@/components/dashboard/ExitPermitDialog"
import { GenderChart } from "@/components/dashboard/GenderChart"
import { OnlineCheckInCard } from "@/components/dashboard/OnlineCheckInCard"
import { QuickSummary } from "@/components/dashboard/QuickSummary"
import { RosterTable } from "@/components/dashboard/RosterTable"
import { WalkInCard } from "@/components/dashboard/WalkInCard"
import { fetchCamps, fetchCampuses, fetchDepartureReasons } from "@/lib/api/lookups"
import { checkIn } from "@/lib/api/portal"
import type { AttendanceStatus, Camp, Lookup, RosterRow } from "@/lib/api/types"
import { useDashboardTotals, useDebouncedValue, useRoster } from "@/lib/useDashboardData"
import { approveWaiver, verifyPayment } from "@/lib/api/admin"

const PAGE_SIZE = 9

export default function DashboardPage() {
  const { isHead } = useAuth()

  const [camps, setCamps] = useState<Camp[]>([])
  const [campuses, setCampuses] = useState<Lookup[]>([])
  const [reasons, setReasons] = useState<Lookup[]>([])

  const [campId, setCampId] = useState("all")
  const [search, setSearch] = useState("")
  const [campus, setCampus] = useState("all")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)

  const [busyId, setBusyId] = useState<string | null>(null)
  const [permitRow, setPermitRow] = useState<RosterRow | null>(null)

  const debouncedSearch = useDebouncedValue(search)

  const dashboard = useDashboardTotals(campId)
  const roster = useRoster({
    campId: campId === "all" ? undefined : campId,
    search: debouncedSearch,
    campus: campus === "all" ? undefined : campus,
    status: status === "all" ? undefined : (status as AttendanceStatus),
    page,
    pageSize: PAGE_SIZE,
  })

  useEffect(() => {
    Promise.all([fetchCamps(), fetchCampuses(), fetchDepartureReasons()])
      .then(([campList, campusList, reasonList]) => {
        setCamps(campList)
        setCampuses(campusList)
        setReasons(reasonList)
      })
      .catch((e: Error) => toast.error(e.message))
  }, [])

  /* Changing any filter sends the table back to the first page */
  const changeCamp = (v: string) => {
    setCampId(v)
    setPage(1)
  }
  const changeSearch = (v: string) => {
    setSearch(v)
    setPage(1)
  }
  const changeCampus = (v: string) => {
    setCampus(v)
    setPage(1)
  }
  const changeStatus = (v: string) => {
    setStatus(v)
    setPage(1)
  }

  const reloadAll = () => {
    dashboard.reload()
    roster.reload()
  }

  async function handleCheckIn(row: RosterRow) {
    setBusyId(row.registration_id)
    try {
      await checkIn(row.registration_id)
      toast.success(`${row.first_name} ${row.last_name} checked in`)
      reloadAll()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setBusyId(null)
    }
  }

    async function handleVerifyPayment(row: RosterRow) {
    try {
      await verifyPayment(row.batch_id)
      toast.success("Payment marked as verified")
      reloadAll()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong")
    }
  }

  async function handleApproveAssistance(row: RosterRow) {
    try {
      await approveWaiver(row.batch_id)
      toast.success("Financial assistance approved")
      reloadAll()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong")
    }
  }

  return (
    <div className="space-y-4">
      <CampTabs camps={camps} value={campId} onChange={changeCamp} />

      {dashboard.error && <p className="text-sm text-destructive">{dashboard.error}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        <AttendanceChart totals={dashboard.totals} />
        <GenderChart totals={dashboard.totals} />
        <QuickSummary totals={dashboard.totals} loading={dashboard.loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OnlineCheckInCard campId={campId} onChecked={reloadAll} />
        <WalkInCard onOpen={() => toast("The walk-in registration form is the next piece to build")} />
      </div>

      <RosterTable
        rows={roster.rows}
        total={roster.total}
        loading={roster.loading}
        error={roster.error}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        search={search}
        onSearchChange={changeSearch}
        campuses={campuses}
        campus={campus}
        onCampusChange={changeCampus}
        status={status}
        onStatusChange={changeStatus}
        isHead={isHead}
        busyId={busyId}
        onCheckIn={handleCheckIn}
        onExitPermit={setPermitRow}
        canManage={isHead}
        onVerifyPayment={handleVerifyPayment}
        onApproveAssistance={handleApproveAssistance}
      />

      <ExitPermitDialog
        row={permitRow}
        reasons={reasons}
        onClose={() => setPermitRow(null)}
        onDone={reloadAll}
      />
    </div>
  )
}