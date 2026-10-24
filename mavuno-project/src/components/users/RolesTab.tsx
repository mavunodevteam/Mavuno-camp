import { Fragment, useState } from "react"
import { MoreVertical, Plus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { createRole, deleteRole, setRolePermission, updateRole, type RoleRow } from "@/lib/api/users"
import { PERMISSION_COUNT, PERMISSION_GROUPS, type PermissionId } from "@/lib/permissions"

export function RolesTab({
  roles,
  counts,
  onChanged,
  onLocalChange,
}: {
  roles: RoleRow[]
  counts: Record<string, number>
  onChanged: () => Promise<void>
  /* Used to show a tick straight away, before the database has answered */
  onLocalChange: (next: RoleRow[]) => void
}) {
  const [editing, setEditing] = useState<RoleRow | "new" | null>(null)
  const [deleting, setDeleting] = useState<RoleRow | null>(null)
  const [busy, setBusy] = useState(false)

  const sorted = [...roles].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
  /* In the permissions table the locked Super admin role comes first */
  const signInRoles = roles
    .filter((r) => r.can_sign_in)
    .sort((a, b) => Number(b.is_locked) - Number(a.is_locked) || a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

  async function run(work: () => Promise<void>, success: string): Promise<boolean> {
    setBusy(true)
    try {
      await work()
      toast.success(success)
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

  async function toggle(role: RoleRow, permission: PermissionId, granted: boolean) {
    const next = roles.map((r) =>
      r.id === role.id
        ? { ...r, permissions: granted ? [...r.permissions, permission] : r.permissions.filter((p) => p !== permission) }
        : r
    )
    onLocalChange(next)
    try {
      await setRolePermission(role.id, permission, granted)
      toast.success("Permission updated")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save that change.")
    }
    await onChanged()
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="min-w-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Roles</CardTitle>
          <CardDescription>Roles with system access can sign in. The others only tag people, like teams.</CardDescription>
          <CardAction>
            <Button type="button" onClick={() => setEditing("new")}>
              <Plus className="size-4" />
              Add role
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>System access</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">More actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        {role.name}
                        {role.is_locked && <Badge variant="outline">Locked</Badge>}
                      </span>
                    </TableCell>
                    <TableCell>
                      {role.description ? (
                        <span>{role.description}</span>
                      ) : role.is_locked ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setEditing(role)}>
                          Add description
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      {role.can_sign_in ? (
                        <Badge variant="outline" className="whitespace-nowrap border-green-200 bg-green-50 text-green-700">
                          Can sign in
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="whitespace-nowrap text-muted-foreground">
                          No access
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">{counts[role.id] ?? 0}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {role.can_sign_in ? `${role.permissions.length} of ${PERMISSION_COUNT}` : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger aria-label={`Actions for ${role.name}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
                          <MoreVertical />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled={role.is_locked} onClick={() => setEditing(role)}>
                            Edit role
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={role.is_locked} onClick={() => setDeleting(role)}>
                            Delete role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Permissions by role</CardTitle>
          <CardDescription>Only roles with system access appear here. Ticks save straight away.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Permission</TableHead>
                  {signInRoles.map((role) => (
                    <TableHead key={role.id} className="whitespace-nowrap">
                      {role.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSION_GROUPS.map((group) => (
                  <Fragment key={group.label}>
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={signInRoles.length + 1} className="py-2 text-xs text-muted-foreground">
                        {group.label}
                      </TableCell>
                    </TableRow>
                    {group.permissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            {permission.label}
                            {permission.sensitive && <Badge variant="outline" className="text-xs text-muted-foreground">Sensitive</Badge>}
                          </span>
                        </TableCell>
                        {signInRoles.map((role) => (
                          <TableCell key={role.id}>
                            <Checkbox
                              aria-label={`${role.name}: ${permission.label}`}
                              checked={role.permissions.includes(permission.id)}
                              disabled={role.is_locked}
                              onCheckedChange={(checked) => void toggle(role, permission.id, checked === true)}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editing && (
        <RoleDialog
          role={editing === "new" ? null : editing}
          existingNames={roles.filter((r) => r !== editing).map((r) => r.name)}
          users={editing === "new" ? 0 : (counts[editing.id] ?? 0)}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={async (input) => {
            const ok =
              editing === "new"
                ? await run(() => createRole(input), "Role successfully created")
                : await run(() => updateRole(editing.id, input), "Role successfully updated")
            if (ok) setEditing(null)
          }}
        />
      )}

      <Dialog open={deleting !== null} onOpenChange={(next) => { if (!next) setDeleting(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.name}?</DialogTitle>
            <DialogDescription>
              {deleting && (counts[deleting.id] ?? 0) > 0
                ? `${counts[deleting.id]} ${counts[deleting.id] === 1 ? "person has" : "people have"} this role, so it cannot be deleted yet. Give them another role first.`
                : "This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!deleting) return
                if (await run(() => deleteRole(deleting.id), "Role successfully deleted")) setDeleting(null)
              }}
            >
              Delete role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RoleDialog({
  role,
  existingNames,
  users,
  busy,
  onClose,
  onSave,
}: {
  role: RoleRow | null
  existingNames: string[]
  users: number
  busy: boolean
  onClose: () => void
  onSave: (input: { name: string; description: string; canSignIn: boolean }) => void | Promise<void>
}) {
  const [name, setName] = useState(role?.name ?? "")
  const [description, setDescription] = useState(role?.description ?? "")
  const [canSignIn, setCanSignIn] = useState(role?.can_sign_in ?? false)
  const trimmed = name.trim()
  const duplicate = existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())
  /* A role that people already use cannot lose its sign in access */
  const lockedOn = role !== null && role.can_sign_in && users > 0

  return (
    <Dialog open onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{role ? "Edit role" : "Add role"}</DialogTitle>
          <DialogDescription>
            {role ? "Change the name, the description, or whether this role can sign in." : "Add a team to tag people, or a role that can sign in."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Role name</Label>
            <Input autoFocus value={name} aria-invalid={duplicate} placeholder="e.g. Hospitality team" onChange={(e) => setName(e.target.value)} />
            {duplicate && <p className="text-sm text-destructive">A role with this name already exists.</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label>Description</Label>
            <Textarea value={description} placeholder="What this role does" onChange={(e) => setDescription(e.target.value.slice(0, 120))} />
          </div>
          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Can sign in</p>
              <p className="text-sm text-muted-foreground">
                {lockedOn
                  ? `${users} ${users === 1 ? "person has" : "people have"} this role, so it has to keep system access.`
                  : "People with this role can sign in. Choose what they can do under Permissions by role."}
              </p>
            </div>
            <Switch aria-label="Can sign in" checked={canSignIn} disabled={lockedOn} onCheckedChange={setCanSignIn} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={!trimmed || duplicate || busy} onClick={() => void onSave({ name: trimmed, description, canSignIn })}>
            {role ? "Save role" : "Add role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}