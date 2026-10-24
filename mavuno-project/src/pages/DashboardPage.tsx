import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { Search } from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/AuthProvider"
import { fetchCamps, fetchCampuses, fetchDepartureReasons } from "@/lib/api/lookups"
import { checkIn, fetchRoster, issueExitPermit } from "@/lib/api/portal"
import type { AttendanceStatus, Camp, Lookup, RosterRow } from "@/lib/api/types"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { AttendanceChart } from "@/components/dashboard/AttendanceChart"
import { GenderChart } from "@/components/dashboard/GenderChart"
import { QuickSummary } from "@/components/dashboard/QuickSummary"
import { RosterTable } from "@/components/dashboard/RosterTable"

const PAGE_SIZE = 10

type EditCamper = {
  id: string
  firstName: string
  lastName: string
  age: string
  gender: string
  phone: string
  medical: string
  needs: string
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { isHead } = useAuth()

  const [camps, setCamps] = useState<Camp[]>([])
  const [campuses, setCampuses] = useState<Lookup[]>([])
  const [reasons, setReasons] = useState<Lookup[]>([])

  const [campId, setCampId] = useState("all")
  const [search, setSearch] = useState("")
  const [campus, setCampus] = useState("all")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)

  const [rows, setRows] = useState<RosterRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [checkInQuery, setCheckInQuery] = useState("")
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false)
  const [checkInMatches, setCheckInMatches] = useState<RosterRow[]>([])
  const [selectedCheckIns, setSelectedCheckIns] = useState<Set<string>>(new Set())

  const [exitPermitRow, setExitPermitRow] = useState<RosterRow | null>(null)
  const [undoRow, setUndoRow] = useState<{ row: RosterRow; kind: "check-in" | "check-out" } | null>(null)
  const [cancelRow, setCancelRow] = useState<RosterRow | null>(null)
  const [editRow, setEditRow] = useState<EditCamper | null>(null)

  const [stats, setStats] = useState({
    total_registered_campers: 0, present_on_site: 0, pending_arrivals: 0, departed: 0,
    walk_in_registrations: 0, online_checked_in: 0, walk_in_checked_in: 0,
    present_male: 0, present_female: 0, total_registered_facilitators: 0,
  })

  // Load camps/campuses/reasons once
  useEffect(() => {
    Promise.all([fetchCamps(), fetchCampuses(), fetchDepartureReasons()])
      .then(([c, cp, r]) => {
        // Deduplicate camps by category
        const unique = c.reduce((acc, x) => {
          if (!acc.find((k) => k.category === x.category)) acc.push(x)
          return acc
        }, [] as Camp[])
        setCamps(unique)
        setCampuses(cp)
        setReasons(r)
      })
      .catch((e: Error) => toast.error(e.message))
  }, [])

  // Load dashboard counts
  async function loadStats() {
    const { data } = await supabase.from("dashboard_counts").select("*")
    if (!data) return
    const ids = new Set(camps.map((c) => c.id))
    const scoped = data.filter((d: any) => ids.has(d.camp_id))
    const filtered = campId === "all" ? scoped : scoped.filter((d: any) => d.camp_id === campId)
    const totals = filtered.reduce((acc: any, d: any) => {
      acc.total_registered_campers += d.total_registered_campers ?? 0
      acc.present_on_site += d.present_on_site ?? 0
      acc.pending_arrivals += d.pending_arrivals ?? 0
      acc.departed += d.departed ?? 0
      acc.walk_in_registrations += d.walk_in_registrations ?? 0
      acc.online_checked_in += d.online_checked_in ?? 0
      acc.walk_in_checked_in += d.walk_in_checked_in ?? 0
      acc.present_male += d.present_male ?? 0
      acc.present_female += d.present_female ?? 0
      acc.total_registered_facilitators += d.total_registered_facilitators ?? 0
      return acc
    }, {
      total_registered_campers: 0, present_on_site: 0, pending_arrivals: 0, departed: 0,
      walk_in_registrations: 0, online_checked_in: 0, walk_in_checked_in: 0,
      present_male: 0, present_female: 0, total_registered_facilitators: 0,
    })
    setStats(totals)
  }

  // Load roster
  async function loadRoster() {
    setLoading(true)
    try {
      const result = await fetchRoster({
        campId: campId === "all" ? undefined : campId,
        search: search || undefined,
        campus: campus === "all" ? undefined : campus,
        status: status === "all" ? undefined : (status as AttendanceStatus),
        page,
        pageSize: PAGE_SIZE,
      })
      setRows(result.rows)
      setTotal(result.total)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStats() }, [campId])
  useEffect(() => { loadRoster() }, [campId, search, campus, status, page])

  function reloadAll() { loadStats(); loadRoster() }

  async function handleCheckIn(row: RosterRow) {
    setBusyId(row.registration_id)
    try {
      await checkIn(row.registration_id)
      toast.success(`${row.first_name} ${row.last_name} checked in`)
      reloadAll()
    } catch (e) { toast.error((e as Error).message) }
    finally { setBusyId(null) }
  }

  async function handleUndoCheckIn(row: RosterRow) {
    try {
      const { error } = await supabase.from("attendance").delete().eq("registration_id", row.registration_id)
      if (error) throw error
      toast.success("Check-in undone")
      reloadAll()
    } catch (e) { toast.error((e as Error).message) }
  }

  async function handleCancelRegistration(row: RosterRow) {
    try {
      const { error } = await supabase.from("registrations").delete().eq("id", row.registration_id)
      if (error) throw error
      toast.success("Registration cancelled")
      reloadAll()
    } catch (e) { toast.error((e as Error).message) }
  }

  async function handleIssueExitPermit(row: RosterRow, reasonId: string) {
    try {
      await issueExitPermit(row.registration_id, reasonId)
      toast.success("Exit permit issued")
      setExitPermitRow(null)
      reloadAll()
    } catch (e) { toast.error((e as Error).message) }
  }

  async function handleOnlineCheckIn(e: React.FormEvent) {
    e.preventDefault()
    if (!checkInQuery.trim()) return
    try {
      const { rows: matches } = await fetchRoster({
        campId: campId === "all" ? undefined : campId,
        search: checkInQuery,
        status: "registered",
        pageSize: 20,
      })
      if (matches.length === 0) toast.error("No registered camper found")
      else if (matches.length === 1) await handleCheckIn(matches[0])
      else { setCheckInMatches(matches); setSelectedCheckIns(new Set()); setCheckInDialogOpen(true) }
    } catch (e) { toast.error((e as Error).message) }
  }

  async function confirmBatchCheckIn() {
    try {
      for (const id of selectedCheckIns) await checkIn(id)
      toast.success(`${selectedCheckIns.size} camper(s) checked in`)
      setCheckInDialogOpen(false)
      setCheckInQuery("")
      reloadAll()
    } catch (e) { toast.error((e as Error).message) }
  }

  async function handleSaveEdit() {
    if (!editRow) return
    try {
      const { error } = await supabase.from("registrations").update({
        first_name: editRow.firstName,
        last_name: editRow.lastName,
        age: Number(editRow.age),
        gender: editRow.gender.toLowerCase(),
        phone: editRow.phone,
        has_medical_condition: Boolean(editRow.medical),
        medical_details: editRow.medical || null,
        has_special_needs: Boolean(editRow.needs),
        special_needs_details: editRow.needs || null,
      }).eq("id", editRow.id)
      if (error) throw error
      toast.success("Camper details updated")
      setEditRow(null)
      reloadAll()
    } catch (e) { toast.error((e as Error).message) }
  }

  // Derive labels
  const campLabel = campId === "all" ? "All camps" : (camps.find(c => c.id === campId)?.category.toUpperCase() ?? "All camps")

  return (
    <div className="space-y-4">
      {/* Camp tabs */}
      {camps.length > 1 && (
        <Tabs value={campId} onValueChange={(v) => { setCampId(v); setPage(1) }}>
          <TabsList>
            <TabsTrigger value="all">All camps</TabsTrigger>
            {camps.map((c) => (
              <TabsTrigger key={c.id} value={c.id}>{c.category.toUpperCase()}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_0.9fr]">
        <div className="h-[320px]">
          <AttendanceChart totals={stats} />
        </div>
        <div className="h-[320px]">
          <GenderChart totals={stats} />
        </div>
        <div className="h-[320px]">
          <QuickSummary totals={stats} scopeLabel={campLabel} />
        </div>
      </div>

      {/* Check-in and walk-in cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Check-in online registrant</CardTitle>
            <CardDescription>Lookup camper's name, M-Pesa code or phone number to instantly check them in.</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={checkInQuery} onChange={(e) => setCheckInQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleOnlineCheckIn(e)} className="pl-8" placeholder="Search by name, phone, M-Pesa code" />
            </div>
            <Button onClick={handleOnlineCheckIn} disabled={!checkInQuery.trim()}>Check in</Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Walk-in registration</CardTitle>
            <CardDescription>Capture full camper details. Walk-ins are auto-checked in upon payment verification.</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button className="w-full" onClick={() => navigate("/walk-in?camp=myf")}>Open walk-in registration form</Button>
          </CardContent>
        </Card>
      </div>

      {/* Roster */}
      <RosterTable
        rows={rows}
        total={total}
        loading={loading}
        error={null}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        campuses={campuses}
        campus={campus}
        onCampusChange={(v) => { setCampus(v); setPage(1) }}
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1) }}
        isHead={isHead}
        busyId={busyId}
        onCheckIn={handleCheckIn}
        onExitPermit={setExitPermitRow}
        onUndoCheckIn={(row) => setUndoRow({ row, kind: "check-in" })}
        onEditDetails={(row) => setEditRow({
          id: row.registration_id,
          firstName: row.first_name,
          lastName: row.last_name,
          age: String(row.age),
          gender: row.gender,
          phone: row.phone ?? "",
          medical: row.medical_details ?? "",
          needs: row.special_needs_details ?? "",
        })}
        onCancelRegistration={setCancelRow}
      />

      {/* Check-in dialog */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check-in online registrant</DialogTitle>
            <DialogDescription>{checkInMatches.length} registrations found for "{checkInQuery}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {checkInMatches.map((row) => (
              <label key={row.registration_id} className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3 cursor-pointer">
                <input type="checkbox" checked={selectedCheckIns.has(row.registration_id)} onChange={(e) => {
                  const next = new Set(selectedCheckIns)
                  e.target.checked ? next.add(row.registration_id) : next.delete(row.registration_id)
                  setSelectedCheckIns(next)
                }} className="mt-1" />
                <div className="flex-1">
                  <div className="font-medium">{row.first_name} {row.last_name}</div>
                  <div className="text-sm text-muted-foreground">Age {row.age} • {row.gender} • {row.campus ?? "No campus"}</div>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckInDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmBatchCheckIn} disabled={selectedCheckIns.size === 0}>Check in ({selectedCheckIns.size})</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit permit dialog */}
      <Dialog open={!!exitPermitRow} onOpenChange={(o) => !o && setExitPermitRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue exit permit</DialogTitle>
            <DialogDescription>
              Issue exit permit for <strong>{exitPermitRow?.first_name} {exitPermitRow?.last_name}</strong>? They will be marked as checked out.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <select className="w-full h-9 rounded-md border px-3" onChange={(e) => e.currentTarget.dataset.reasonId = e.target.value}>
              <option value="">Select reason</option>
              {reasons.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExitPermitRow(null)}>Cancel</Button>
            <Button onClick={() => {
              const select = document.querySelector<HTMLSelectElement>("select[data-reason-id]")
              if (exitPermitRow && select?.value) handleIssueExitPermit(exitPermitRow, select.value)
            }}>Issue permit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Undo confirmation */}
      <Dialog open={!!undoRow} onOpenChange={(o) => !o && setUndoRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undo {undoRow?.kind === "check-in" ? "check-in" : "check-out"}?</DialogTitle>
            <DialogDescription>
              {undoRow?.row.first_name} {undoRow?.row.last_name} will be moved back to {undoRow?.kind === "check-in" ? "Registered" : "Checked in"}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUndoRow(null)}>Cancel</Button>
            <Button onClick={() => { if (undoRow) { handleUndoCheckIn(undoRow.row); setUndoRow(null) } }}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel registration */}
      <Dialog open={!!cancelRow} onOpenChange={(o) => !o && setCancelRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel registration?</DialogTitle>
            <DialogDescription>
              <strong>{cancelRow?.first_name} {cancelRow?.last_name}</strong> will be removed from the roster and their spot freed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelRow(null)}>Keep</Button>
            <Button variant="destructive" onClick={() => { if (cancelRow) { handleCancelRegistration(cancelRow); setCancelRow(null) } }}>Cancel registration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit details dialog */}
      <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit camper details</DialogTitle>
          </DialogHeader>
          {editRow && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium">First name</span>
                <Input value={editRow.firstName} onChange={(e) => setEditRow({ ...editRow, firstName: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Last name</span>
                <Input value={editRow.lastName} onChange={(e) => setEditRow({ ...editRow, lastName: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Age</span>
                <Input value={editRow.age} onChange={(e) => setEditRow({ ...editRow, age: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Gender</span>
                <select className="h-9 w-full rounded-md border px-3" value={editRow.gender} onChange={(e) => setEditRow({ ...editRow, gender: e.target.value })}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm font-medium">Phone</span>
                <Input value={editRow.phone} onChange={(e) => setEditRow({ ...editRow, phone: e.target.value })} />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm font-medium">Medical condition</span>
                <Input value={editRow.medical} onChange={(e) => setEditRow({ ...editRow, medical: e.target.value })} placeholder="e.g. Asthma" />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm font-medium">Special needs</span>
                <Input value={editRow.needs} onChange={(e) => setEditRow({ ...editRow, needs: e.target.value })} placeholder="e.g. Autistic" />
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}