import { useEffect, useState } from "react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fetchWaivers, approveWaiver, rejectWaiver, type WaiverRow } from "@/lib/api/portal"

export default function WaiversPage() {
  const [waivers, setWaivers] = useState<WaiverRow[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    try {
      setLoading(true)
      setError(null) // Clear previous errors
      const data = await fetchWaivers()
      setWaivers(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleApprove(batchId: string) {
    try {
      await approveWaiver(batchId)
      loadData()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  async function handleReject(batchId: string) {
    if (!confirm("Are you sure you want to reject this waiver?")) return
    try {
      await rejectWaiver(batchId)
      loadData()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const filtered = waivers.filter(
    (w) =>
      w.first_name.toLowerCase().includes(search.toLowerCase()) ||
      w.last_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waivers"
        description="Review full waiver requests. Approving sets the fee to KES 0. A rejected camper stays unpaid."
      >
        <Button variant="outline">Issue waiver</Button>
      </PageHeader>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by name, phone, M-Pesa code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {/* Add other filters from Figma here later */}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading waivers...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox />
                </TableHead>
                <TableHead>Camper</TableHead>
                <TableHead>Camp</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested on</TableHead>
                <TableHead>Approved by</TableHead>
                <TableHead>Baptism</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No waiver requests found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((w) => (
                  <TableRow key={w.batch_id}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{w.first_name} {w.last_name}</div>
                      <div className="text-xs text-muted-foreground">Age: {w.age} • {w.gender}</div>
                    </TableCell>
                    <TableCell>{w.camp_name}</TableCell>
                    <TableCell>{w.campus}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(w.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell>{w.wants_baptism ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleReject(w.batch_id)}>
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(w.batch_id)}>
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}