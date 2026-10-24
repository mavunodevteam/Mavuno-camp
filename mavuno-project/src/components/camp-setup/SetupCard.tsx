import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export type FieldSpec<T> = { key: keyof T; label: string; format: (value: any) => string }

type Change = { label: string; from: string; to: string }

export type LastSaved = { by: string; at: Date }

function sameValues<T>(fields: FieldSpec<T>[], a: T, b: T) {
  return fields.every((f) => f.format(a[f.key]) === f.format(b[f.key]))
}

export function SetupCard<T>({
  title,
  description,
  saved,
  fields,
  saveLabel,
  successMessage,
  canEdit,
  onDirtyChange,
  onSave,
  validate,
  warnings,
  headerAction,
  headerExtra,
  lastSaved,
  children,
}: {
  title: string
  description: React.ReactNode
  saved: T
  fields: FieldSpec<T>[]
  saveLabel: string
  successMessage: string
  canEdit: boolean
  onDirtyChange: (dirty: boolean) => void
  onSave: (value: T) => Promise<void> | void
  validate: (value: T) => boolean
  warnings: (draft: T, saved: T) => string[]
  headerAction?: (value: T) => React.ReactNode
  headerExtra?: React.ReactNode
  lastSaved?: LastSaved | null
  children: (value: T, editing: boolean, update: (patch: Partial<T>) => void) => React.ReactNode
}) {
  const [draft, setDraft] = useState<T | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const editing = draft !== null
  const value = draft ?? saved
  const dirty = editing && !sameValues(fields, draft!, saved)

  const changes: Change[] = draft
    ? fields
        .filter((f) => f.format(saved[f.key]) !== f.format(draft[f.key]))
        .map((f) => ({ label: f.label, from: f.format(saved[f.key]), to: f.format(draft[f.key]) }))
    : []

  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  async function confirmSave() {
    if (!draft) return
    try {
      await onSave(draft)
      setReviewing(false)
      setDraft(null)
      toast.success(successMessage)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {headerExtra}
        {(headerAction || (canEdit && !editing)) && (
          <CardAction>
            <div className="flex gap-3">
              {headerAction?.(value)}
              {canEdit && !editing && (
                <Button type="button" variant="outline" onClick={() => setDraft(saved)}>
                  Edit
                </Button>
              )}
            </div>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {children(value, editing, (patch) => setDraft((current) => ({ ...(current ?? saved), ...patch })))}
        {editing && (
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={!dirty || !validate(value)} onClick={() => setReviewing(true)}>
              {saveLabel}
            </Button>
          </div>
        )}
        {lastSaved && (
          <p className="text-xs text-muted-foreground">
            Last saved by {lastSaved.by}, <span className="tabular-nums">{format(lastSaved.at, "dd/MM/yy, hh:mm a")}</span>
          </p>
        )}
      </CardContent>

      <Dialog open={reviewing} onOpenChange={setReviewing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review changes</DialogTitle>
            <DialogDescription>Check these changes before you save them.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {changes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No changes to save.</p>
            ) : (
              changes.map((c) => (
                <div key={c.label} className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
                  <div className="text-muted-foreground">{c.label}</div>
                  <div className="tabular-nums">
                    {c.from} → <strong>{c.to}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
          {draft && warnings(draft, saved).length > 0 && (
            <div className="space-y-2 pt-2">
              {warnings(draft, saved).map((w) => (
                <p key={w} className="flex gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  {w}
                </p>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReviewing(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmSave}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}