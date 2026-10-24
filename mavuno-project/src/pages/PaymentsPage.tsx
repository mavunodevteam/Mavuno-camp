import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { fetchCamps } from "@/lib/api/lookups"
import { formatNumber } from "@/lib/format"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type PaymentStatus = "pending" | "success" | "failed" | "waiver_requested" | "waiver_approved"

type PaymentRow = {
  id: string
  batch_id: string
  code: string
  people: { name: string; age: number }[]
  kind: "Camper" | "Facilitator"
  camp: "MYF" | "MYA" | "-"
  campus: string | null
  expected: number
  status: PaymentStatus
  mpesa_receipt: string | null
}

const statusLabel: Record<PaymentStatus, string> = {
  pending: "Awaiting verification",
  success: "Verified",
  failed: "Flagged",
  waiver_requested: "Waiver requested",
  waiver_approved: "Waiver approved",
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  async function loadData() {
    setLoading(true)
    try {
      // 1. Scope to open edition camps
      const camps = await fetchCamps() // already scoped to open edition
      const byId = new Map(camps.map((c) => [c.id, c.category.toUpperCase() as "MYF" | "MYA"]))
      const openCampIds = Array.from(byId.keys())

      if (openCampIds.length === 0) {
        setPayments([])
        return
      }

      // 2. Fetch batches + payments + registrations for the open edition
      const { data, error } = await supabase
        .from("registration_batches")
        .select(`
          id,
          total_amount,
          camp_id,
          payments ( id, status, mpesa_receipt ),
          registrations ( first_name, last_name, age, participant_type, campus_id, campuses(name) )
        `)
        .in("camp_id", openCampIds)
        .order("created_at", { ascending: false })

      if (error) throw error

      // 3. Flatten into PaymentRow[]
      const rows: PaymentRow[] = (data ?? []).map((batch: any) => {
        const regs = batch.registrations ?? []
        const payment = batch.payments?.[0]
        const first = regs[0]
        const camp = byId.get(batch.camp_id) ?? "-"
        return {
          id: payment?.id ?? batch.id,
          batch_id: batch.id,
          code: payment?.mpesa_receipt ?? "—",
          people: regs.map((r: any) => ({ name: `${r.first_name} ${r.last_name}`, age: r.age })),
          kind: first?.participant_type === "facilitator" ? "Facilitator" : "Camper",
          camp,
          campus: first?.campuses?.name ?? null,
          expected: batch.total_amount,
          status: (payment?.status ?? "pending") as PaymentStatus,
          mpesa_receipt: payment?.mpesa_receipt ?? null,
        }
      })

      setPayments(rows)
    } catch (e) {
      toast.error((e as Error).message || "Failed to load payments")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function updateStatus(batchId: string, newStatus: PaymentStatus) {
    try {
      const { error } = await supabase
        .from("payments")
        .update({ status: newStatus })
        .eq("batch_id", batchId)
      if (error) throw error
      toast.success(`Payment marked as ${statusLabel[newStatus].toLowerCase()}`)
      loadData()
    } catch (e) {
      toast.error((e as Error).message || "Failed to update payment")
    }
  }

  const filtered = payments.filter((p) => {
    const text = `${p.people.map((x) => x.name).join(" ")} ${p.code}`.toLowerCase()
    return (
      text.includes(query.toLowerCase()) &&
      (statusFilter === "all" || p.status === statusFilter)
    )
  })

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <Card className="min-w-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Verify M-Pesa payments</CardTitle>
          <CardDescription>
            Review payments, verify the amounts, and flag any suspicious codes. Waiver requests are managed on the Waivers page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="border bg-muted/50 pl-8"
                placeholder="Search by name or M-Pesa code"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                {statusFilter === "all"
                  ? "All statuses"
                  : statusLabel[statusFilter as PaymentStatus] ?? "All statuses"}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Awaiting verification</SelectItem>
                <SelectItem value="success">Verified</SelectItem>
                <SelectItem value="failed">Flagged</SelectItem>
                <SelectItem value="waiver_requested">Waiver requested</SelectItem>
                <SelectItem value="waiver_approved">Waiver approved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>M-Pesa code</TableHead>
                  <TableHead>Campers</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Camp</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Loading...</TableCell>
                  </TableRow>
                )}

                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No payments found.</TableCell>
                  </TableRow>
                )}

                {!loading && filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Badge variant="outline" className="tabular-nums">{p.code}</Badge>
                    </TableCell>
                    <TableCell>
                      {p.people.map((person) => (
                        <div key={person.name}>
                          {person.name} <span className="text-muted-foreground">({person.age})</span>
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>{p.kind}</TableCell>
                    <TableCell><Badge variant="outline">{p.camp}</Badge></TableCell>
                    <TableCell>{p.campus ?? "-"}</TableCell>
                    <TableCell className="tabular-nums">{formatNumber(p.expected)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{statusLabel[p.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {/* Pending: Verify / Flag */}
                      {p.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(p.batch_id, "failed")}>
                            Flag
                          </Button>
                          <Button size="sm" onClick={() => updateStatus(p.batch_id, "success")}>
                            Verify
                          </Button>
                        </>
                      )}

                      {/* Waiver: point to Waivers page */}
                      {p.status === "waiver_requested" && (
                        <span className="text-xs text-muted-foreground">Manage in Waivers</span>
                      )}

                      {/* Done: Reopen */}
                      {(p.status === "success" || p.status === "failed" || p.status === "waiver_approved") && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(p.batch_id, "pending")}>
                          Reopen
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}