import { useState } from "react"
import { Image as ImageIcon } from "lucide-react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { DashboardTotals } from "@/lib/api/types"
import { logAction } from "@/lib/api/audit"

export function QuickSummary({
  totals,
  loading,
  scopeLabel = "All camps",
}: {
  totals: DashboardTotals | null
  loading?: boolean
  scopeLabel?: string
}) {
  const [imageOpen, setImageOpen] = useState(false)

  const rows = [
    { label: "Campers departed early", value: totals?.departed ?? 0 },
    { label: "Total registered campers", value: totals?.total_registered_campers ?? 0 },
    { label: "Campers present on site", value: totals?.present_on_site ?? 0 },
    { label: "Walk-in registrations", value: totals?.walk_in_registrations ?? 0 },
    { label: "Facilitators registered", value: totals?.total_registered_facilitators ?? 0 },
    { label: "Pending arrivals", value: totals?.pending_arrivals ?? 0 },
  ]

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Quick summary</CardTitle>
          <CardDescription>
            {scopeLabel === "All camps"
              ? "A summary of campers data"
              : `A summary of ${scopeLabel} campers data`}
          </CardDescription>
          <CardAction>
            <Tooltip>
              <TooltipTrigger  >
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="View summary as image"
                  onClick={() => {
                    setImageOpen(true)
                    logAction({
                      user_name: "Admin", // or use useAuth() to get real name
                      action: "Summary image viewed",
                      area: "sensitive",
                      subject: "Quick summary",
                      camp: scopeLabel === "MYF" || scopeLabel === "MYA" ? scopeLabel : null,
                    })
                  }}
                >
                  <ImageIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View as image</TooltipContent>
            </Tooltip>
          </CardAction>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          {loading ? (
            <p className="px-6 text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="max-h-[220px] space-y-2 overflow-y-auto px-6 pb-6">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col justify-center rounded-lg border border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {row.value.toLocaleString()}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {row.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* "View as image" dialog */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick summary · {scopeLabel}</DialogTitle>
            <DialogDescription>
              Screenshot this or use your browser's print option.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3"
              >
                <span className="text-sm font-medium text-muted-foreground">{row.label}</span>
                <span className="text-lg font-bold tabular-nums">{row.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}