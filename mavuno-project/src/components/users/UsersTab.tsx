import { useState } from "react"
import { MoreVertical, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { FormSelect } from "@/components/FormSelect"
import { InviteUserDialog } from "@/components/users/InviteUserDialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  CAMP_ACCESS_LABELS,
  cancelInvite,
  renameUser,
  resendInvite,
  setUserActive,
  setUserCampAccess,
  setUserRole,
  type CampAccess,
  type RoleRow,
  type StaffRow,
} from "@/lib/api/users"

const displayName = (s: StaffRow) => (s.invite_pending ? s.email : (s.full_name ?? s.email))

export function UsersTab({ staff, roles, onChanged }: { staff: StaffRow[]; roles: RoleRow[]; onChanged: () => Promise<void> }) {
  const [inviting, setInviting] = useState(false)
  const [switchingOff, setSwitchingOff] = useState<StaffRow | null>(null)
  const [renaming, setRenaming] = useState<StaffRow | null>(null)
  const [cancelling, setCancelling] = useState<StaffRow | null>(null)
  const [busy, setBusy] = useState(false)

  const roleById = new Map(roles.map((r) => [r.id, r]))
  const assignable = roles.filter((r) => r.can_sign_in && !r.is_locked)
  const sorted = [...staff].sort((a, b) => displayName(a).toLowerCase().localeCompare(displayName(b).toLowerCase()))

  /* Do a change, say what happened, and refresh. On a refusal the table is refreshed too, so nothing looks changed that was not. */
  async function run(work: () => Promise<void>, success?: string): Promise<boolean> {
    setBusy(true)
    try {
      await work()
      if (success) toast.success(success)
      await onChanged()
      return true
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.")
      await onChanged()
      return false
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Users</CardTitle>
        <CardDescription>Everyone with an account. Deactivating a user blocks sign in but keeps their history.</CardDescription>
        <CardAction>
          <Button type="button" onClick={() => setInviting(true)}>
            <UserPlus className="size-4" />
            Invite user
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Camp access</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">More actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((user) => {
                const role = user.role_id ? roleById.get(user.role_id) : undefined
                const locked = role?.is_locked ?? false
                return (
                  <TableRow key={user.id}>
                    <TableCell className="whitespace-nowrap">
                      {user.invite_pending ? (
                        <span>{user.email}</span>
                      ) : (
                        <div className="flex flex-col">
                          <span>
                            {user.full_name ?? user.email}
                            {user.is_me && <span className="text-muted-foreground"> (you)</span>}
                          </span>
                          <span className="text-muted-foreground">{user.email}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <FormSelect
                        label={`Role for ${displayName(user)}`}
                        placeholder="Choose role"
                        className="w-44"
                        value={user.role_id ?? ""}
                        disabled={busy || locked || user.is_me}
                        onChange={(roleId) => void run(() => setUserRole(user.id, roleId), "Role updated")}
                        options={(locked && role ? [role] : assignable).map((r) => ({ value: r.id, label: r.name }))}
                      />
                    </TableCell>
                    <TableCell>
                      <FormSelect
                        label={`Camp access for ${displayName(user)}`}
                        placeholder="Camp access"
                        className="w-36"
                        value={user.camp_access}
                        disabled={busy}
                        onChange={(access) => void run(() => setUserCampAccess(user.id, access as CampAccess), "Camp access updated")}
                        options={(Object.keys(CAMP_ACCESS_LABELS) as CampAccess[]).map((k) => ({ value: k, label: CAMP_ACCESS_LABELS[k] }))}
                      />
                    </TableCell>
                    <TableCell>
                      {user.invite_pending ? (
                        <Badge variant="outline" className="whitespace-nowrap border-blue-200 bg-blue-50 text-blue-700">
                          Invite pending
                        </Badge>
                      ) : (
                        <Switch
                          aria-label={`${displayName(user)} is active`}
                          checked={user.is_active}
                          disabled={busy || locked || user.is_me}
                          onCheckedChange={(next) => {
                            if (next) void run(() => setUserActive(user.id, true), `${displayName(user)} switched on`)
                            else setSwitchingOff(user)
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger aria-label={`Actions for ${displayName(user)}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
                          <MoreVertical />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.invite_pending ? (
                            <>
                              <DropdownMenuItem onClick={() => void run(() => resendInvite(user.id), `Invite sent again to ${user.email}`)}>Resend invite</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setCancelling(user)}>Cancel invite</DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem onClick={() => setRenaming(user)}>Edit name</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No users yet. Use Invite user to add the first one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <InviteUserDialog open={inviting} roles={roles} onClose={() => setInviting(false)} onInvited={() => void onChanged()} />

      <Dialog open={switchingOff !== null} onOpenChange={(next) => { if (!next) setSwitchingOff(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch off {switchingOff ? displayName(switchingOff) : ""}?</DialogTitle>
            <DialogDescription>
              They will not be able to sign in or see any records. Their history stays, and you can switch them back on at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSwitchingOff(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!switchingOff) return
                if (await run(() => setUserActive(switchingOff.id, false), `${displayName(switchingOff)} switched off`)) setSwitchingOff(null)
              }}
            >
              Switch off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelling !== null} onOpenChange={(next) => { if (!next) setCancelling(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel the invite for {cancelling?.email}?</DialogTitle>
            <DialogDescription>The invite link stops working and they are removed from the list. You can invite them again later.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCancelling(null)}>
              Keep invite
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!cancelling) return
                if (await run(() => cancelInvite(cancelling.id), "Invite cancelled")) setCancelling(null)
              }}
            >
              Cancel invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {renaming && (
        <RenameDialog
          user={renaming}
          busy={busy}
          onClose={() => setRenaming(null)}
          onSave={async (name) => {
            if (await run(() => renameUser(renaming.id, name), "Name updated")) setRenaming(null)
          }}
        />
      )}
    </Card>
  )
}

function RenameDialog({ user, busy, onClose, onSave }: { user: StaffRow; busy: boolean; onClose: () => void; onSave: (name: string) => void | Promise<void> }) {
  const [name, setName] = useState(user.full_name ?? "")
  const trimmed = name.trim()
  return (
    <Dialog open onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit name</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label>Full name</Label>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && trimmed && void onSave(trimmed)} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={!trimmed || busy || trimmed === (user.full_name ?? "")} onClick={() => void onSave(trimmed)}>
            Save name
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}