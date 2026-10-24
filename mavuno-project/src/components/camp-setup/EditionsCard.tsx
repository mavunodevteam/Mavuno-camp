import { useMemo, useState } from "react"
import { AlertCircle, Loader2, MoreVertical } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export type EditionRow = {
  id: string
  name: string
  year: number
  open: boolean
  startDate: Date | null
  endDate: Date | null
}

export function yearFromName(name: string) {
  const match = name.match(/\d{4}/)
  return match ? Number(match[0]) : new Date().getFullYear()
}

const dates = (e: EditionRow) =>
  e.startDate && e.endDate ? `${format(e.startDate, "dd/MM/yyyy")} - ${format(e.endDate, "dd/MM/yyyy")}` : "-"

const statusClass = (open: boolean) =>
  open
    ? "border-transparent bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
    : "bg-muted text-muted-foreground"

function LoadingButton({ pending, loadingLabel, children, ...props }: React.ComponentProps<typeof Button> & { pending?: boolean; loadingLabel?: string }) {
  return (
    <Button {...props} disabled={pending || props.disabled}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export function EditionsCard({
  editions,
  canEdit = true,
  onCreate,
  onRename,
  onClose,
  onReopen,
}: {
  editions: EditionRow[]
  canEdit?: boolean
  onCreate: (name: string) => Promise<void>
  onRename: (id: string, name: string) => Promise<void>
  onClose: (id: string) => Promise<void>
  onReopen: (id: string) => Promise<void>
}) {
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [pending, setPending] = useState(false)
  const [editing, setEditing] = useState<EditionRow | "new" | null>(null)
  const [closing, setClosing] = useState<EditionRow | null>(null)
  const [switching, setSwitching] = useState<{ name: string; reopen: EditionRow | null } | null>(null)

  const openOne = editions.find((e) => e.open)
  const years = useMemo(() => Array.from(new Set(editions.map((e) => e.year))).sort((a, b) => b - a), [editions])
  const shown = useMemo(() => {
    const list = year === "all" ? editions : editions.filter((e) => String(e.year) === year)
    return [...list].sort(
      (a, b) =>
        Number(b.open) - Number(a.open) ||
        (b.startDate?.getTime() ?? Infinity) - (a.startDate?.getTime() ?? Infinity) ||
        a.name.localeCompare(b.name)
    )
  }, [editions, year])

  async function run(fn: () => Promise<void>, action: string, success?: string) {
    setPending(true)
    try {
      await fn()
      if (success) toast.success(success)
      return true
    } catch (e: any) {
      toast.error(`Could not ${action}. ${e?.message ?? "Try again."}`)
      return false
    } finally {
      setPending(false)
    }
  }

  const create = (name: string) =>
    run(async () => {
      await onCreate(name)
      setYear(String(yearFromName(name)))
    }, "create the edition", "Edition successfully created")

  const reopen = (edition: EditionRow) =>
    run(() => onReopen(edition.id), "reopen the edition", "Edition successfully reopened")

  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Camp editions</CardTitle>
        <CardDescription>
          One run of the camps. Registrations, payments and waivers belong to the edition they were made in.
        </CardDescription>
        {canEdit && (
          <CardAction>
            <Button type="button" variant="outline" onClick={() => setEditing("new")}>
              New edition
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between gap-3">
          <Select value={year} onValueChange={(v) => setYear(v ?? "all")}>
            {/* 👇 Replace <SelectValue /> with this 👇 */}
            <SelectTrigger className="w-36">
                {year === "all" ? "All years" : year}
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {years.map((item) => (
                <SelectItem key={item} value={String(item)}>{item}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground tabular-nums">
            {shown.length} of {editions.length} editions
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="whitespace-nowrap">Edition</TableHead>
                <TableHead className="whitespace-nowrap">Dates</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                {canEdit && (
                  <TableHead className="w-10">
                    <span className="sr-only">More actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canEdit ? 4 : 3} className="h-24 text-center text-muted-foreground">
                    No editions in {year}. Pick another year or create a new edition.
                  </TableCell>
                </TableRow>
              )}
              {shown.map((edition) => (
                <TableRow key={edition.id} className="hover:bg-muted/50">
                  <TableCell className="whitespace-nowrap font-medium">{edition.name}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{dates(edition)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="outline" className={cn("whitespace-nowrap", statusClass(edition.open))}>
                      {edition.open ? "Open" : "Closed"}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon" })}>
                          <MoreVertical />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(edition)}>Rename edition</DropdownMenuItem>
                          {edition.open ? (
                            <DropdownMenuItem onClick={() => setClosing(edition)}>Close edition</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => (openOne ? setSwitching({ name: edition.name, reopen: edition }) : reopen(edition))}>
                              Reopen edition
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* New / Rename dialog */}
      {editing && (
        <EditionDialog
          edition={editing === "new" ? null : editing}
          names={editions.filter((item) => item !== editing).map((item) => item.name)}
          onClose={() => setEditing(null)}
          pending={pending}
          onSave={async (name) => {
            if (editing === "new") {
              if (openOne) {
                setSwitching({ name, reopen: null })
                setEditing(null)
                return
              }
              if (!(await create(name))) return
            } else if (!(await run(() => onRename(editing.id, name), "rename the edition", "Edition successfully renamed"))) return
            setEditing(null)
          }}
        />
      )}

      {/* Switch open edition dialog */}
      <Dialog open={switching !== null} onOpenChange={(next) => { if (!next) setSwitching(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive" />
              Open {switching?.name} and close {openOne?.name}?
            </DialogTitle>
            <DialogDescription>
              Only one edition is open at a time. <strong>{openOne?.name}</strong> becomes read-only.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwitching(null)}>Cancel</Button>
            <LoadingButton
              pending={pending}
              loadingLabel="Opening..."
              onClick={async () => {
                if (!switching) return
                const ok = switching.reopen ? await reopen(switching.reopen) : await create(switching.name)
                if (ok) setSwitching(null)
              }}
            >
              Open edition
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close edition dialog */}
      <Dialog open={closing !== null} onOpenChange={(next) => { if (!next) setClosing(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive" />
              Close {closing?.name}?
            </DialogTitle>
            <DialogDescription>
              <strong>{closing?.name}</strong> becomes read-only. Its records stay in Reports.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClosing(null)}>Cancel</Button>
            <LoadingButton
              pending={pending}
              loadingLabel="Closing..."
              onClick={async () => {
                if (!closing) return
                if (await run(() => onClose(closing.id), "close the edition", "Edition successfully closed")) setClosing(null)
              }}
            >
              Close edition
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function EditionDialog({ edition, names, onClose, onSave, pending }: {
  edition: EditionRow | null
  names: string[]
  onClose: () => void
  onSave: (name: string) => void | Promise<void>
  pending: boolean
}) {
  const [name, setName] = useState(edition?.name ?? "")
  const trimmed = name.trim()
  const duplicate = names.some((n) => n.toLowerCase() === trimmed.toLowerCase())
  const submit = () => { if (trimmed && !duplicate) onSave(trimmed) }

  return (
    <Dialog open onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edition ? "Rename edition" : "New edition"}</DialogTitle>
          <DialogDescription>
            {edition ? "Registrations, payments and waivers stay with this edition." : "Give this run of the camps a name."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label>Edition name</Label>
          <Input
            autoFocus
            value={name}
            placeholder="e.g. Easter 2027"
            aria-invalid={duplicate}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          {duplicate && <p className="text-sm text-destructive">An edition with this name already exists.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={onClose}>Cancel</Button>
          <LoadingButton pending={pending} loadingLabel="Saving..." disabled={!trimmed || duplicate} onClick={submit}>
            {edition ? "Save name" : "Create edition"}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}