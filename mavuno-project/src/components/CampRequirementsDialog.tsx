import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RequirementsLists } from "@/components/welcome/RequirementsLists"
import type { Camp } from "@/lib/api/types"

/* "View camp requirements": what to bring, what to expect and good to know, for each camp that runs */
export function CampRequirementsDialog({
  camps,
  open,
  onOpenChange,
  initial,
}: {
  camps: Camp[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /* The camp to show first, such as the one whose "See the full list" link was pressed */
  initial?: Camp["category"] | null
}) {
  const [picked, setPicked] = useState<string | null>(null)

  useEffect(() => {
    if (open) setPicked(initial ?? null)
  }, [open, initial])

  const current = camps.find((c) => c.category === picked) ?? camps[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Camp requirements</DialogTitle>
          <DialogDescription>What to bring, what to expect, and other important details.</DialogDescription>
        </DialogHeader>
        {camps.length > 1 && (
          <Tabs value={current?.category ?? ""} onValueChange={(v) => setPicked(String(v))}>
            <TabsList className="grid w-full grid-cols-2">
              {camps.map((c) => (
                <TabsTrigger key={c.id} value={c.category}>
                  {c.category.toUpperCase()}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
        {current && <RequirementsLists bring={current.welcome_bring ?? null} expect={current.welcome_expect ?? null} know={current.welcome_know ?? null} />}
        {!current && <p className="text-sm text-muted-foreground">No camp is open right now.</p>}
      </DialogContent>
    </Dialog>
  )
}