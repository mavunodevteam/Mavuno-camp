import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Camp } from "@/lib/api/types"

export function CampTabs({
  camps,
  value,
  onChange,
}: {
  camps: Camp[]
  value: string
  onChange: (value: string) => void
}) {
  // Sort camps so MYF comes first, then MYA
  const sortedCamps = [...camps].sort((a, b) => {
    if (a.category === "myf" && b.category === "mya") return -1
    if (a.category === "mya" && b.category === "myf") return 1
    return 0
  })

  return (
    <Tabs value={value} onValueChange={onChange}>
      {/* 
        rounded-full: Makes the grey container a pill shape.
        bg-zinc-100: The light grey background.
        p-1: Gives a little padding inside the container.
        w-auto: Prevents it from stretching full width.
      */}
      <TabsList className="h-auto w-auto w-fit justify-start rounded-full bg-zinc-100 p-1">
        {/* All camps Tab */}
        <TabsTrigger
          value="all"
          className="rounded-full px-4 py-1.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
        >
          All camps
        </TabsTrigger>

        {/* Dynamically render MYA and MYF tabs from the database camps */}
        {sortedCamps.map((camp) => (
          <TabsTrigger
            key={camp.id}
            value={camp.id}
            className="rounded-full px-4 py-1.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
          >
            {camp.category.toUpperCase()}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}