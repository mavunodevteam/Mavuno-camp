import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardTotals } from "@/lib/api/types"

export function QuickSummary({
  totals,
  loading,
}: {
  totals: DashboardTotals | null
  loading?: boolean
}) {
  const rows = [
    { label: "Campers departed early", value: totals?.departed ?? 0 },
    { label: "Total registered campers", value: totals?.total_registered_campers ?? 0 },
    { label: "Campers present on site", value: totals?.present_on_site ?? 0 },
    { label: "Walk-in registrations", value: totals?.walk_in_registrations ?? 0 },
    { label: "Facilitators registered", value: totals?.total_registered_facilitators ?? 0 },
    { label: "Pending arrivals", value: totals?.pending_arrivals ?? 0 },
  ]

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Quick summary</CardTitle>
        <CardDescription>A summary of campers data</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        {loading ? (
          <p className="px-6 text-sm text-muted-foreground">Loading...</p>
        ) : (
          // The max-h and overflow-y-auto creates the scrollbar you see in Figma
          <div className="max-h-[220px] space-y-2 overflow-y-auto px-6 pb-6">
            {rows.map((row) => (
              <div 
                key={row.label} 
                className="flex flex-col justify-center rounded-lg border border-zinc-100 bg-zinc-50/50 px-4 py-3"
              >
                <span className="text-2xl font-bold text-zinc-900">
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
  )
}