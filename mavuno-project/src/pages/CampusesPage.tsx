import { Fragment, useEffect, useState } from "react"
import { AlertCircle, Plus, Search, MoreVertical } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

import { FormSelect } from "@/components/FormSelect"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Network = { id: string; name: string }
type Campus = { id: string; name: string; network_id: string | null }

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`

/* Our own rules raise plain English, and the common database refusals are put in plain words too */
function explain(error: { code?: string; message: string }): string {
  if (error.code === "42501") return "You do not have permission to do that."
  if (error.code === "23505") return "That name already exists."
  if (error.code === "23503") return "It is still in use, for example by a registered camper."
  return error.message
}

type NameDialogState =
  | { kind: "add-network" }
  | { kind: "rename-network"; network: Network }
  | { kind: "add-campus"; networkId?: string }
  | { kind: "rename-campus"; campus: Campus }
  | { kind: "move-campus"; campus: Campus }

function MoreMenu({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger type="button" className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label={label}>
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-44">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NameDialog({
  state,
  networks,
  campuses,
  onClose,
  onSave,
}: {
  state: NameDialogState | null
  networks: Network[]
  campuses: Campus[]
  onClose: () => void
  onSave: (name: string, networkId: string) => void
}) {
  const [name, setName] = useState("")
  const [networkId, setNetworkId] = useState("")

  useEffect(() => {
    if (!state) return
    setName(state.kind === "rename-network" ? state.network.name : state.kind === "rename-campus" ? state.campus.name : "")
    setNetworkId(state.kind === "add-campus" ? (state.networkId ?? "") : state.kind === "move-campus" ? (state.campus.network_id ?? "") : "")
  }, [state])

  if (!state) return null

  const isNetwork = state.kind === "add-network" || state.kind === "rename-network"
  const needsName = state.kind !== "move-campus"
  const needsNetwork = state.kind === "add-campus" || state.kind === "move-campus"
  const currentId = state.kind === "rename-network" ? state.network.id : state.kind === "rename-campus" ? state.campus.id : null
  const taken = needsName && (isNetwork ? networks : campuses).some((item) => item.id !== currentId && item.name.toLowerCase() === name.trim().toLowerCase())
  const unchanged =
    (state.kind === "rename-network" && name.trim() === state.network.name) ||
    (state.kind === "rename-campus" && name.trim() === state.campus.name) ||
    (state.kind === "move-campus" && networkId === (state.campus.network_id ?? ""))
  const valid = (!needsName || name.trim() !== "") && !taken && !unchanged && (!needsNetwork || networkId !== "")

  const copy = {
    "add-network": { title: "Add network", description: "Networks group campuses for reports.", label: "Network name", button: "Add network" },
    "rename-network": { title: "Rename network", description: "Reports show the new name for every campus in it.", label: "Name", button: "Save name" },
    "add-campus": { title: "Add campus", description: "Campers choose their campus when they register.", label: "Campus name", button: "Add campus" },
    "rename-campus": { title: "Rename campus", description: "Every registration at this campus is updated too.", label: "Name", button: "Save name" },
    "move-campus": { title: "Change network", description: state.kind === "move-campus" ? `Choose the network ${state.campus.name} belongs to.` : "", label: "", button: "Save network" },
  }[state.kind]

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="gap-0 sm:max-w-lg">
        <DialogHeader className="relative space-y-1 text-left">
          <DialogTitle className="text-base font-semibold leading-none tracking-tight">{copy.title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{copy.description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-4">
          {needsName && (
            <label className="flex flex-col gap-2 text-sm font-medium">
              {copy.label}
              <Input className="bg-muted/40" autoFocus value={name} onChange={(event) => setName(event.target.value)} />
              {taken && <span className="text-sm font-normal text-destructive">A {isNetwork ? "network" : "campus"} with this name already exists.</span>}
            </label>
          )}
          {needsNetwork && (
            <div className="flex flex-col gap-2 text-sm font-medium">
              Network
              {networks.length === 0 ? (
                <span className="text-sm font-normal text-muted-foreground">There are no networks yet. Add a network first.</span>
              ) : (
                <FormSelect
                  label="Network"
                  placeholder="Choose a network"
                  value={networkId}
                  onChange={setNetworkId}
                  options={[...networks].sort(byName).map((n) => ({ value: n.id, label: n.name }))}
                />
              )}
            </div>
          )}
        </div>
        <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={!valid} onClick={() => onSave(name.trim(), networkId)}>
            {copy.button}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type Deleting = { id: string; name: string; kind: "campus" | "network"; campuses?: number }

export default function CampusesAndNetworksPage() {
  const [networks, setNetworks] = useState<Network[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [query, setQuery] = useState("")
  const [networkFilter, setNetworkFilter] = useState("all")
  const [nameDialog, setNameDialog] = useState<NameDialogState | null>(null)
  const [deleting, setDeleting] = useState<Deleting | null>(null)
  const [moveTo, setMoveTo] = useState("")
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState("networks")
  const [loading, setLoading] = useState(true)

  async function loadData() {
    const [netRes, campRes] = await Promise.all([supabase.from("networks").select("*").order("name"), supabase.from("campuses").select("*").order("name")])
    if (netRes.error || campRes.error) {
      toast.error("Failed to load campuses and networks")
      setLoading(false)
      return
    }
    setNetworks((netRes.data ?? []) as Network[])
    setCampuses((campRes.data ?? []) as Campus[])
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [])

  const sortedNetworks = [...networks].sort(byName)
  const campusesIn = (networkId: string) => campuses.filter((campus) => campus.network_id === networkId).sort(byName)
  const matches = (campus: Campus) => campus.name.toLowerCase().includes(query.trim().toLowerCase())

  const groups = sortedNetworks
    .filter((network) => networkFilter === "all" || network.id === networkFilter)
    .map((network) => ({ network: network as Network | null, members: campusesIn(network.id).filter(matches) }))
  const unassigned = campuses.filter((c) => !c.network_id || !networks.some((n) => n.id === c.network_id)).filter(matches).sort(byName)
  if (networkFilter === "all" && unassigned.length > 0) groups.push({ network: null, members: unassigned })
  const visibleGroups = groups.filter((group) => group.members.length > 0)

  async function save(name: string, networkId: string) {
    if (!nameDialog || busy) return
    setBusy(true)
    try {
      let result
      if (nameDialog.kind === "add-network") {
        result = await supabase.from("networks").insert({ name })
      } else if (nameDialog.kind === "rename-network") {
        result = await supabase.from("networks").update({ name }).eq("id", nameDialog.network.id)
      } else if (nameDialog.kind === "add-campus") {
        result = await supabase.from("campuses").insert({ name, network_id: networkId })
      } else if (nameDialog.kind === "move-campus") {
        result = await supabase.from("campuses").update({ network_id: networkId }).eq("id", nameDialog.campus.id)
      } else {
        result = await supabase.from("campuses").update({ name }).eq("id", nameDialog.campus.id)
      }
      if (result.error) throw result.error
      toast.success("Saved")
      setNameDialog(null)
      await loadData()
    } catch (e) {
      toast.error(`Could not save. ${explain(e as { code?: string; message: string })}`)
    } finally {
      setBusy(false)
    }
  }

  function startDelete(next: Deleting) {
    setMoveTo("")
    setDeleting(next)
  }

  const otherNetworks = deleting?.kind === "network" ? sortedNetworks.filter((n) => n.id !== deleting.id) : []
  const mustMove = deleting?.kind === "network" && (deleting.campuses ?? 0) > 0
  const canDelete = !busy && (!mustMove || moveTo !== "")

  async function confirmDelete() {
    if (!deleting || !canDelete) return
    setBusy(true)
    try {
      if (deleting.kind === "network") {
        const { error } = await supabase.rpc("delete_network", { p_network: deleting.id, p_move_to: mustMove ? moveTo : null })
        if (error) throw error
      } else {
        const { error } = await supabase.from("campuses").delete().eq("id", deleting.id)
        if (error) throw error
      }
      toast.success(`${deleting.kind === "campus" ? "Campus" : "Network"} deleted`)
      setDeleting(null)
      await loadData()
    } catch (e) {
      toast.error(`Could not delete. ${explain(e as { code?: string; message: string })}`)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading campuses...</div>

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <div className="text-base font-semibold tabular-nums">{networks.length}</div>
          <div className="text-sm text-muted-foreground">Networks</div>
        </div>
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <div className="text-base font-semibold tabular-nums">{campuses.length}</div>
          <div className="text-sm text-muted-foreground">Campuses</div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="gap-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger className="w-full" value="networks">
            Networks
          </TabsTrigger>
          <TabsTrigger className="w-full" value="campuses">
            Campuses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="networks">
          <Card className="min-w-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Networks</CardTitle>
              <CardDescription>Networks group campuses for reports. Shared by MYA and MYF.</CardDescription>
              <CardAction>
                <Button type="button" onClick={() => setNameDialog({ kind: "add-network" })}>
                  <Plus className="mr-2 size-4" />
                  Add network
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {sortedNetworks.map((network) => {
                  const members = campusesIn(network.id)
                  return (
                    <section key={network.id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border">
                      <div className="flex items-start justify-between gap-3 p-4">
                        <div className="flex flex-col gap-1">
                          <h3 className="text-base font-semibold leading-none">{network.name}</h3>
                          <p className="text-sm tabular-nums text-muted-foreground">{plural(members.length, "campus")}</p>
                        </div>
                        <MoreMenu label={`More actions for ${network.name}`}>
                          <DropdownMenuItem onClick={() => setNameDialog({ kind: "add-campus", networkId: network.id })}>Add campus to network</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setNameDialog({ kind: "rename-network", network })}>Rename network</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => startDelete({ id: network.id, name: network.name, kind: "network", campuses: members.length })}>
                            Delete network
                          </DropdownMenuItem>
                        </MoreMenu>
                      </div>
                      <div className="flex flex-1 flex-wrap content-start gap-2 border-t bg-muted/40 p-4">
                        {members.length > 0 ? (
                          members.map((campus) => (
                            <span key={campus.id} className="rounded-md border bg-muted/50 px-2.5 py-1 text-sm">
                              {campus.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No campuses yet.</span>
                        )}
                      </div>
                    </section>
                  )
                })}
                {sortedNetworks.length === 0 && <p className="text-sm text-muted-foreground">No networks yet. Use Add network to create the first one.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campuses">
          <Card className="min-w-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Campuses</CardTitle>
              <CardDescription>Every campus campers can choose when they register. Changes apply to every report.</CardDescription>
              <CardAction>
                <Button type="button" onClick={() => setNameDialog({ kind: "add-campus" })}>
                  <Plus className="mr-2 size-4" />
                  Add campus
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="relative max-w-md flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="border bg-muted/50 pl-8" placeholder="Search by campus name" value={query} onChange={(event) => setQuery(event.target.value)} />
                </div>
                <FormSelect
                  label="Network"
                  placeholder="All networks"
                  className="w-44"
                  value={networkFilter}
                  onChange={(v) => setNetworkFilter(v === "" ? "all" : v)}
                  options={[{ value: "all", label: "All networks" }, ...sortedNetworks.map((n) => ({ value: n.id, label: n.name }))]}
                />
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Campus</TableHead>
                      <TableHead className="w-10">
                        <span className="sr-only">More actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleGroups.map(({ network, members }) => (
                      <Fragment key={network?.id ?? "none"}>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={2} className="whitespace-nowrap py-2 text-xs font-medium text-muted-foreground">
                            {network ? network.name : "No network"} · <span className="tabular-nums">{plural(network ? campusesIn(network.id).length : members.length, "campus")}</span>
                          </TableCell>
                        </TableRow>
                        {members.map((campus) => (
                          <TableRow key={campus.id} className="hover:bg-muted/50">
                            <TableCell className="w-full whitespace-nowrap font-medium">{campus.name}</TableCell>
                            <TableCell>
                              <MoreMenu label={`More actions for ${campus.name}`}>
                                <DropdownMenuItem onClick={() => setNameDialog({ kind: "rename-campus", campus })}>Rename campus</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setNameDialog({ kind: "move-campus", campus })}>Change network</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => startDelete({ id: campus.id, name: campus.name, kind: "campus" })}>
                                  Delete campus
                                </DropdownMenuItem>
                              </MoreMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </Fragment>
                    ))}
                    {visibleGroups.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                          No campuses match your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NameDialog state={nameDialog} networks={networks} campuses={campuses} onClose={() => setNameDialog(null)} onSave={save} />

      <Dialog open={deleting !== null} onOpenChange={(next) => !next && setDeleting(null)}>
        <DialogContent className="gap-0 sm:max-w-lg">
          <DialogHeader className="relative space-y-1 text-left">
            <DialogTitle className="flex items-center gap-2 pr-8 text-lg font-semibold leading-none tracking-tight">
              <AlertCircle className="text-destructive" />
              Delete {deleting?.kind}?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground">{deleting?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {mustMove && (
            <div className="flex flex-col gap-2 pt-4 text-sm font-medium">
              {plural(deleting?.campuses ?? 0, "campus")} will be moved to
              {otherNetworks.length === 0 ? (
                <span className="font-normal text-destructive">There is no other network to move them to. Add another network first.</span>
              ) : (
                <FormSelect
                  label="Move campuses to"
                  placeholder="Choose a network"
                  value={moveTo}
                  onChange={setMoveTo}
                  options={otherNetworks.map((n) => ({ value: n.id, label: n.name }))}
                />
              )}
            </div>
          )}

          <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={!canDelete} onClick={confirmDelete}>
              {mustMove ? "Move and delete" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}