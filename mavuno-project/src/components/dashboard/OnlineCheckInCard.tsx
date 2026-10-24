import { useState, type FormEvent } from "react"
import { Search, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { checkIn, fetchRoster } from "@/lib/api/portal"
import type { RosterRow } from "@/lib/api/types"

export function OnlineCheckInCard({ campId, onChecked }: { campId: string; onChecked: () => void }) {
  const [query, setQuery] = useState("")
  const [matches, setMatches] = useState<RosterRow[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  async function performCheckIn(ids: string[]) {
    setBusy(true)
    try {
      for (const id of ids) {
        await checkIn(id)
      }
      toast.success(`${ids.length} camper${ids.length > 1 ? "s" : ""} checked in`)
      setDialogOpen(false)
      setQuery("")
      setMatches([])
      setSelectedIds(new Set())
      onChecked()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (query.trim() === "") return
    setBusy(true)
    try {
      const { rows } = await fetchRoster({
        campId: campId === "all" ? undefined : campId,
        search: query,
        status: "registered",
        pageSize: 20,
      })
      if (rows.length === 0) {
        toast.error("No registered camper found. They may already be checked in.")
      } else if (rows.length === 1) {
        // Single match — check in instantly
        await performCheckIn([rows[0].registration_id])
      } else {
        // Multiple matches — open the dialog
        setMatches(rows)
        setSelectedIds(new Set())
        setDialogOpen(true)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-base">Check-in online registrant</CardTitle>
          <CardDescription>
            Lookup camper's name, M-Pesa code or phone number to instantly check them in.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, phone, M-Pesa code"
                className="pl-8"
                aria-label="Search by name, phone, M-Pesa code"
              />
            </div>
            <Button type="submit" disabled={busy || query.trim() === ""}>
              {busy ? "Checking..." : "Check in"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Multi-match dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader className="relative space-y-1 text-left">
            <DialogTitle className="text-base font-bold">Check-in online registrant</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Search string: <span className="ml-1 rounded bg-muted px-3 py-1">{query || "All registrations"}</span>
            </DialogDescription>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close"
              className="absolute right-0 top-0"
              onClick={() => setDialogOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </DialogHeader>
          <div className="space-y-3 pt-3">
            <div className="text-sm">{matches.length} registrations found.</div>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {matches.map((row) => {
                const selected = selectedIds.has(row.registration_id)
                return (
                  <label
                    key={row.registration_id}
                    className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3 cursor-pointer hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleSelection(row.registration_id)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {row.first_name} {row.last_name}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        Age: {row.age} • {row.gender} • {row.campus ?? "No campus"}
                      </span>
                    </span>
                    <Badge variant="outline" className="shrink-0 bg-orange-50 text-orange-700">
                      Registered
                    </Badge>
                  </label>
                )
              })}
            </div>
            <DialogFooter className="mt-4 flex-row justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={busy || selectedIds.size === 0}
                onClick={() => performCheckIn(Array.from(selectedIds))}
              >
                {busy ? "Checking in..." : `Confirm check-in (${selectedIds.size})`}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}