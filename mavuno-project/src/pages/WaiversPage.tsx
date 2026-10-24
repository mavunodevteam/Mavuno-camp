import { useCallback, useEffect, useMemo, useState } from "react"
import { MoreVertical, RefreshCw, Search, Ticket } from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import { formatDateTime } from "@/lib/format"
import { fetchCamps, fetchCampuses } from "@/lib/api/lookups"
import { approveWaiver as approveWaiverApi, rejectWaiver as rejectWaiverApi } from "@/lib/api/admin"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"



type Arrival = "registered" | "checked_in" | "checked_out"
type Kind = "advance" | "walk-in" | null

type WaiverRow = {
  registration_id: string
  batch_id: string
  name: string
  age: number
  gender: string
  phone: string
  camp: string
  campus: string | null
  arrival: Arrival
  pending: boolean              // true = waiting for the admin, false = approved
  requested_at: string
  kind: Kind
  baptism: boolean | null
  approved_at: string | null
  approved_by: string | null
}

const ARRIVAL_LABEL: Record<Arrival, string> = {
  registered: "Not arrived",
  checked_in: "Checked in",
  checked_out: "Checked out",
}


type Option = { value: string; label: string }

// Renders the label itself so the trigger never shows the raw value ("all") before the list is opened.
function FilterSelect({ value, onChange, options, className }: { value: string; onChange: (v: string) => void; options: Option[]; className: string }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? options[0].value)}>
      <SelectTrigger className={className}>{options.find((o) => o.value === value)?.label ?? options[0].label}</SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export default function WaiversPage() {
  const [waivers, setWaivers] = useState<WaiverRow[]>([])
  const [camps, setCamps] = useState<{ id: string; category: string }[]>([])
  const [campusNames, setCampusNames] = useState<string[]>([])
  const [editionName, setEditionName] = useState<string | null>(null)
  const [noOpenEdition, setNoOpenEdition] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busyBatch, setBusyBatch] = useState<string | null>(null)

  const [query, setQuery] = useState("")
  const [campFilter, setCampFilter] = useState("all")
  const [campusFilter, setCampusFilter] = useState("all")
  const [arrivalFilter, setArrivalFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const [issuing, setIssuing] = useState(false)
  const [rejecting, setRejecting] = useState<WaiverRow | null>(null)

  // Everything on this page belongs to the open edition: its camps decide which waivers are shown.
  const loadData = useCallback(async (initial = false) => {
    if (initial) setLoading(true)
    else setRefreshing(true)
    try {
      const [openCamps, campuses, edition] = await Promise.all([
        fetchCamps(), // open edition only
        fetchCampuses(),
        supabase.from("editions").select("name").eq("is_open", true).maybeSingle(),
      ])
      setCamps(openCamps.map((c) => ({ id: c.id, category: c.category })))
      setCampusNames(campuses.map((c) => c.name))
      setEditionName(edition.data?.name ?? null)

      const byId = new Map(openCamps.map((c) => [c.id, c.category.toUpperCase()]))
      if (byId.size === 0) {
        setNoOpenEdition(true)
        setWaivers([])
        return
      }
      setNoOpenEdition(false)

      const { data, error } = await supabase
        .from("camper_roster")
        .select("*")
        .in("camp_id", Array.from(byId.keys()))
        .in("payment_status", ["waiver_requested", "waiver_approved"])
      if (error) throw error
      const roster: any[] = data ?? []

      // Extra details the roster view does not carry. If either lookup fails (for example the
      // approver columns have not been added yet) the page still works and shows "-".
      const regIds = roster.map((d) => d.registration_id)
      const batchIds = Array.from(new Set(roster.map((d) => d.batch_id)))
      const [regsRes, paysRes] = await Promise.all([
        regIds.length
          ? supabase.from("registrations").select("id, wants_baptism").in("id", regIds)
          : Promise.resolve({ data: [], error: null }),
        batchIds.length
          ? supabase.from("payments").select("batch_id, waiver_reviewed_by_name, waiver_reviewed_at").in("batch_id", batchIds)
          : Promise.resolve({ data: [], error: null }),
      ])
      if (regsRes.error) console.warn("Could not load baptism / registration type", regsRes.error)
      if (paysRes.error) console.warn("Could not load approver details", paysRes.error)

      const regById = new Map<string, any>(((regsRes.data ?? []) as any[]).map((r) => [r.id, r]))
      const payByBatch = new Map<string, any>(((paysRes.data ?? []) as any[]).map((p) => [p.batch_id, p]))

      const rows: WaiverRow[] = roster.map((d) => {
        const reg = regById.get(d.registration_id)
        const pay = payByBatch.get(d.batch_id)
        const pending = d.payment_status === "waiver_requested"
        return {
          registration_id: d.registration_id,
          batch_id: d.batch_id,
          name: `${d.first_name} ${d.last_name}`,
          age: d.age,
          gender: d.gender,
          phone: d.phone ?? "",
          camp: byId.get(d.camp_id) ?? "-",
          campus: d.campus ?? null,
          arrival: d.attendance_status,
          pending,
          requested_at: d.created_at,
          kind: (reg?.registration_kind ?? null) as Kind,
          baptism: typeof reg?.wants_baptism === "boolean" ? reg.wants_baptism : null,
          approved_at: !pending ? pay?.waiver_reviewed_at ?? null : null,
          approved_by: !pending ? pay?.waiver_reviewed_by_name ?? null : null,
        }
      })
      // Waiting requests first, then newest
      rows.sort((a, b) => Number(b.pending) - Number(a.pending) || b.requested_at.localeCompare(a.requested_at))
      setWaivers(rows)
    } catch (e) {
      toast.error("Failed to load waivers")
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadData(true) }, [loadData])

  // New requests arrive from the registration form, so refresh whenever the admin comes back to this tab.
  useEffect(() => {
    const onFocus = () => loadData()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [loadData])

  async function approve(row: WaiverRow) {
    setBusyBatch(row.batch_id)
    try {
      await approveWaiverApi(row.batch_id)
      toast.success(`Waiver approved for ${row.name}`)
      await loadData()
    } catch (e) {
      toast.error((e as Error).message || "Failed to approve waiver")
    } finally {
      setBusyBatch(null)
    }
  }

  async function reject(row: WaiverRow) {
    setBusyBatch(row.batch_id)
    try {
      await rejectWaiverApi(row.batch_id)
      toast.success(`Waiver rejected for ${row.name}`)
      setRejecting(null)
      await loadData()
    } catch (e) {
      toast.error((e as Error).message || "Failed to reject waiver")
    } finally {
      setBusyBatch(null)
    }
  }

  const pendingCount = waivers.filter((w) => w.pending).length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return waivers.filter((w) =>
      `${w.name} ${w.phone} ${w.campus ?? ""}`.toLowerCase().includes(q) &&
      (campFilter === "all" || w.camp === campFilter) &&
      (campusFilter === "all" || w.campus === campusFilter) &&
      (arrivalFilter === "all" || w.arrival === arrivalFilter) &&
      (statusFilter === "all" || (statusFilter === "pending" ? w.pending : !w.pending))
    )
  }, [waivers, query, campFilter, campusFilter, arrivalFilter, statusFilter])

  const campOptions: Option[] = [
    { value: "all", label: "All camps" },
    ...camps.map((c) => ({ value: c.category.toUpperCase(), label: c.category.toUpperCase() })),
  ]
  const campusOptions: Option[] = [
    { value: "all", label: "All campuses" },
    ...[...campusNames].sort((a, b) => a.localeCompare(b)).map((n) => ({ value: n, label: n })),
  ]
  const arrivalOptions: Option[] = [
    { value: "all", label: "All arrivals" },
    { value: "registered", label: "Not arrived" },
    { value: "checked_in", label: "Checked in" },
    { value: "checked_out", label: "Checked out" },
  ]
  const statusOptions: Option[] = [
    { value: "all", label: "All waivers" },
    { value: "pending", label: "Pending approval" },
    { value: "approved", label: "Approved" },
  ]

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading waivers...</div>

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      {editionName && (
        <p className="text-sm text-muted-foreground">
          Edition: <strong className="text-foreground">{editionName}</strong>
        </p>
      )}

      <Card className="min-w-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Full waivers</CardTitle>
          <CardDescription>
            {pendingCount > 0
              ? <><strong className="text-foreground tabular-nums">{pendingCount}</strong> waiting for your approval. Campers who ask for a waiver when they register appear here.</>
              : "Register campers with a fee of KES 0, at the desk or in advance."}
          </CardDescription>
          <CardAction className="flex gap-2">
            <Button type="button" variant="outline" size="icon" aria-label="Refresh" disabled={refreshing} onClick={() => loadData()}>
              <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            <Button type="button" onClick={() => setIssuing(true)}><Ticket className="mr-2 size-4" />Issue waiver</Button>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="border bg-muted/50 pl-8" placeholder="Search by name, phone, campus" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterSelect className="w-36" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
              <FilterSelect className="w-32" value={campFilter} onChange={setCampFilter} options={campOptions} />
              <FilterSelect className="w-40" value={campusFilter} onChange={setCampusFilter} options={campusOptions} />
              <FilterSelect className="w-36" value={arrivalFilter} onChange={setArrivalFilter} options={arrivalOptions} />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="whitespace-nowrap">Camper</TableHead>
                  <TableHead className="whitespace-nowrap">Camp</TableHead>
                  <TableHead className="whitespace-nowrap">Campus</TableHead>
                  <TableHead className="whitespace-nowrap">Waiver</TableHead>
                  <TableHead className="whitespace-nowrap">Arrival</TableHead>
                  <TableHead className="whitespace-nowrap">Issued on</TableHead>
                  <TableHead className="whitespace-nowrap">Issued by</TableHead>
                  <TableHead className="whitespace-nowrap">Baptism</TableHead>
                  <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((w) => (
                  <TableRow key={w.registration_id} className="hover:bg-muted/50">
                    <TableCell className="whitespace-nowrap">
                      <div className="font-medium">{w.name}</div>
                      <div className="text-muted-foreground">Age: {w.age} - {w.gender === "male" ? "Male" : "Female"}</div>
                      {w.pending && (
                        <div className="text-xs text-muted-foreground tabular-nums">Requested {formatDateTime(new Date(w.requested_at))}</div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{w.camp}</TableCell>
                    <TableCell className="whitespace-nowrap">{w.campus ?? "-"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {w.kind === "advance" && <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">In advance</Badge>}
                      {w.kind === "walk-in" && <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Walk-in</Badge>}
                      {w.kind === null && "-"}
                    </TableCell>
                    <TableCell className={`whitespace-nowrap ${w.arrival === "registered" ? "text-muted-foreground" : ""}`}>{ARRIVAL_LABEL[w.arrival] ?? w.arrival}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {w.pending
                        ? <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">Pending approval</Badge>
                        : w.approved_at ? formatDateTime(new Date(w.approved_at)) : "-"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{w.pending ? "-" : w.approved_by ?? "-"}</TableCell>
                    <TableCell className="whitespace-nowrap">{w.baptism === null ? "-" : w.baptism ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {w.pending && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            type="button"
                            disabled={busyBatch === w.batch_id}
                            className={buttonVariants({ variant: "ghost", size: "icon" })}
                            aria-label={`Actions for ${w.name}`}
                          >
                            <MoreVertical className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" sideOffset={6} className="min-w-40">
                            <DropdownMenuItem onClick={() => approve(w)}>Approve waiver</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setRejecting(w)}>Reject waiver</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      {noOpenEdition
                        ? "There is no open edition. Open one in Camp setup to receive waiver requests."
                        : waivers.length === 0
                          ? "No waiver requests yet."
                          : "No waivers match these filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={rejecting !== null} onOpenChange={(next) => !next && setRejecting(null)}>
        <DialogContent className="gap-0 sm:max-w-lg">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-semibold leading-none tracking-tight">Reject waiver?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              <strong className="text-foreground">{rejecting?.name}</strong>'s waiver request will be declined and their payment marked as failed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
            <Button type="button" variant="outline" disabled={busyBatch !== null} onClick={() => setRejecting(null)}>Keep</Button>
            <Button type="button" variant="destructive" disabled={busyBatch !== null} onClick={() => rejecting && reject(rejecting)}>Reject waiver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={issuing} onOpenChange={setIssuing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue waiver</DialogTitle>
            <DialogDescription>This flow is coming soon. For now, use the Camper Registration page to request a waiver.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIssuing(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}