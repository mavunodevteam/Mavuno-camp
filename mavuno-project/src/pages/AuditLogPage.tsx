import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { startOfDay, subDays, endOfDay } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Search } from "lucide-react"
import { formatDateTime } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

// --- 1. Define the shape of our real database data ---
type Area = "users" | "roles" | "camp-setup" | "campuses" | "campers" | "waivers-payments" | "sensitive" | "sign-in"
type Change = { label: string; from: string; to: string }
type Entry = { id: string; created_at: string; user_name: string; removed?: boolean; action: string; area: Area; camp: "MYA" | "MYF" | null; edition_id: string | null; subject: string; summary?: string; changes?: Change[] }

const areas: { value: Area; label: string }[] = [
  { value: "users", label: "Users" },
  { value: "roles", label: "Roles" },
  { value: "camp-setup", label: "Camp setup" },
  { value: "campuses", label: "Campuses and networks" },
  { value: "campers", label: "Campers" },
  { value: "waivers-payments", label: "Waivers and payments" },
  { value: "sensitive", label: "Sensitive access" },
  { value: "sign-in", label: "Sign-in" },
]

const pageSize = 10

function inWhen(entry: Entry, when: string, range: DateRange | undefined) {
  const entryDate = new Date(entry.created_at)
  const now = new Date()
  if (when === "today") return entryDate >= startOfDay(now)
  if (when === "7d") return entryDate >= startOfDay(subDays(now, 6))
  if (when === "30d") return entryDate >= startOfDay(subDays(now, 29))
  if (when === "custom" && range?.from) return entryDate >= startOfDay(range.from) && entryDate <= endOfDay(range.to ?? range.from)
  return true
}

function Detail({ entry, onOpen }: { entry: Entry; onOpen: () => void }) {
  const changes = entry.changes ?? []
  return (
    <span>
      <span className="font-medium">{entry.subject}</span>
      {entry.summary && <span className="text-muted-foreground"> · {entry.summary}</span>}
      {changes.length === 1 && <span className="text-muted-foreground"> · {changes[0].label} {changes[0].from} → <span className="text-foreground">{changes[0].to}</span></span>}
      {changes.length > 1 && <span className="text-muted-foreground"> · <button type="button" className="text-foreground underline underline-offset-4" onClick={onOpen}>{changes.length} changes</button></span>}
    </span>
  )
}

export default function AuditLogPage() {
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const initialCamp = searchParams.get("camp") || "all"
  const initialArea = searchParams.get("area") || "all"

  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState(initialQuery)
  const [camp, setCamp] = useState(initialCamp)
  const [when, setWhen] = useState("all")
  const [range] = useState<DateRange | undefined>()
  const [area, setArea] = useState(initialArea)
  const [shown, setShown] = useState(pageSize)
  const [open, setOpen] = useState<Entry | null>(null)

  // --- 2. Fetch the real data from Supabase ---
  useEffect(() => {
    async function fetchLogs() {
      setLoading(true)
      // NOTE: You will need an "audit_logs" table in Supabase for this to work.
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        toast.error("Failed to load audit logs")
        console.error(error)
      } else {
        setEntries(data as Entry[])
      }
      setLoading(false)
    }
    fetchLogs()
  }, [])

const [edition, setEdition] = useState("all")
const [editions, setEditions] = useState<{ id: string; name: string }[]>([])
useEffect(() => {
  async function loadEditions() {
    const { data, error } = await supabase
      .from("editions")
      .select("id, name")
      .order("name", { ascending: false })
    if (error) {
      console.error("Failed to load editions:", error)
      return
    }
    setEditions(data ?? [])
  }
  loadEditions()
}, [])

  const filtered = entries.filter((entry) => {
    const text = `${entry.user_name} ${entry.action} ${entry.subject} ${entry.summary ?? ""} ${(entry.changes ?? []).map((change) => `${change.label} ${change.from} ${change.to}`).join(" ")}`.toLowerCase()
    return (
      text.includes(query.trim().toLowerCase()) &&
      (camp === "all" || (camp === "system" ? entry.camp === null : entry.camp === camp)) &&
      (area === "all" || entry.area === area) &&
      (edition === "all" || entry.edition_id === edition) &&
      inWhen(entry, when, range)
    )
  })

  useEffect(() => setShown(pageSize), [query, camp, when, range, area , edition])

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <Card className="min-w-0 shadow-none">
        <CardHeader className="gap-1">
          <CardTitle className="text-base">System activity</CardTitle>
          <CardDescription>Every change made in the portal, newest first. Entries cannot be edited or deleted.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="border bg-muted/50 pl-8" placeholder="Search by user, camper name, action" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {/* 1. Editions */}
              <Select value={edition} onValueChange={setEdition}>
                {/* 👇 Replace <SelectValue /> with this explicit label 👇 */}
                <SelectTrigger className="w-40" aria-label="Edition">
                  {edition === "all" ? "All editions" : editions.find((e) => e.id === edition)?.name ?? "All editions"}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All editions</SelectItem>
                  {editions.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 2. Camps */}
              <Select value={camp} onValueChange={setCamp}>
                {/* 👇 Replace <SelectValue /> with this 👇 */}
                <SelectTrigger className="w-36" aria-label="Camp">
                  {camp === "all" ? "All camps" : camp === "MYA" ? "MYA" : camp === "MYF" ? "MYF" : "System-wide"}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All camps</SelectItem>
                  <SelectItem value="MYA">MYA</SelectItem>
                  <SelectItem value="MYF">MYF</SelectItem>
                  <SelectItem value="system">System-wide</SelectItem>
                </SelectContent>
              </Select>

              {/* 3. Time */}
              <Select value={when} onValueChange={setWhen}>
                {/* 👇 Replace <SelectValue /> with this 👇 */}
                <SelectTrigger className="w-40" aria-label="When">
                  {when === "all" ? "All time" 
                    : when === "today" ? "Today" 
                    : when === "7d" ? "Last 7 days" 
                    : when === "30d" ? "Last 30 days" 
                    : "Custom range"}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>

              {/* 4. Actions */}
              <Select value={area} onValueChange={setArea}>
                {/* 👇 Replace <SelectValue /> with this 👇 */}
                <SelectTrigger className="w-44" aria-label="Action">
                  {area === "all" ? "All actions" : areas.find((a) => a.value === area)?.label ?? "All actions"}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {areas.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="whitespace-nowrap">When</TableHead>
                  <TableHead className="whitespace-nowrap">User</TableHead>
                  <TableHead className="whitespace-nowrap">Action</TableHead>
                  <TableHead className="whitespace-nowrap">Detail</TableHead>
                  <TableHead className="whitespace-nowrap">Camp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Loading logs...</TableCell></TableRow>}
                {!loading && filtered.slice(0, shown).map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-muted/50">
                    <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">{formatDateTime(new Date(entry.created_at))}</TableCell>
                    <TableCell className="whitespace-nowrap">{entry.user_name}{entry.removed && <span className="text-muted-foreground"> (removed)</span>}</TableCell>
                    <TableCell className="whitespace-nowrap"><Badge variant="outline" className="whitespace-nowrap">{entry.action}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap"><Detail entry={entry} onOpen={() => setOpen(entry)} /></TableCell>
                    <TableCell className="whitespace-nowrap">{entry.camp ?? "-"}</TableCell>
                  </TableRow>
                ))}
                {!loading && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No entries match these filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground tabular-nums">Showing {Math.min(shown, filtered.length)} of {filtered.length} entries</p>
              {shown < filtered.length && <Button type="button" variant="outline" onClick={() => setShown((current) => current + pageSize)}>Load more</Button>}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent className="gap-0 sm:max-w-lg">
          <DialogHeader className="relative space-y-1 text-left">
            <DialogTitle className="text-base font-semibold leading-none tracking-tight">{open?.action}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              <strong className="text-foreground">{open?.subject}</strong> by {open?.user_name}, <span className="tabular-nums">{open ? formatDateTime(new Date(open.created_at)) : ""}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pt-4">
            {(open?.changes ?? []).map((change) => (
              <div key={change.label} className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
                <div className="text-muted-foreground">{change.label}</div>
                <div className="tabular-nums">{change.from} → <strong className="text-foreground">{change.to}</strong></div>
              </div>
            ))}
          </div>
          <DialogFooter className="mt-4 flex-row justify-end gap-3 sm:mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}