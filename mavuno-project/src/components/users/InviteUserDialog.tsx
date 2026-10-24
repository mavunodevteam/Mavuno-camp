import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FormSelect } from "@/components/FormSelect"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CAMP_ACCESS_LABELS, inviteUser, type CampAccess, type RoleRow } from "@/lib/api/users"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function InviteUserDialog({
  open,
  roles,
  onClose,
  onInvited,
}: {
  open: boolean
  roles: RoleRow[]
  onClose: () => void
  onInvited: () => void
}) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [roleId, setRoleId] = useState("")
  const [campAccess, setCampAccess] = useState<CampAccess>("both")
  const [sending, setSending] = useState(false)

  const assignable = roles.filter((r) => r.can_sign_in && !r.is_locked)
  const valid = fullName.trim() !== "" && EMAIL.test(email.trim()) && roleId !== ""

  function reset() {
    setFullName("")
    setEmail("")
    setRoleId("")
    setCampAccess("both")
  }

  async function send() {
    if (!valid || sending) return
    setSending(true)
    try {
      await inviteUser({ fullName: fullName.trim(), email: email.trim().toLowerCase(), roleId, campAccess })
      toast.success(`Invite sent to ${email.trim().toLowerCase()}`)
      reset()
      onInvited()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send the invite.")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !sending) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>They get an email to set a password. Until they do, they show as invite pending.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Full name</Label>
            <Input value={fullName} autoFocus onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Email</Label>
            <Input type="email" value={email} placeholder="name@mavuno.org" onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <FormSelect
                label="Role"
                placeholder="Choose role"
                value={roleId}
                onChange={setRoleId}
                options={assignable.map((r) => ({ value: r.id, label: r.name }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Camp access</Label>
              <FormSelect
                label="Camp access"
                placeholder="Choose camp access"
                value={campAccess}
                onChange={(v) => setCampAccess(v as CampAccess)}
                options={(Object.keys(CAMP_ACCESS_LABELS) as CampAccess[]).map((k) => ({ value: k, label: CAMP_ACCESS_LABELS[k] }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={sending} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={!valid || sending} onClick={send}>
            {sending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send invite"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}