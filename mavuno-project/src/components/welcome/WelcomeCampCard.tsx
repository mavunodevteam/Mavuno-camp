import type { ReactNode } from "react"
import { Calendar, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { splitLines, type CampCategory } from "@/lib/welcome"

export const BUTTON_CLASS: Record<CampCategory, string> = {
  myf: "bg-[#F97316] hover:bg-[#ea580c] text-white",
  mya: "bg-zinc-900 hover:bg-zinc-800 text-white",
}

const BRING_PREVIEW_COUNT = 3

const money = (amount: number) => `KES ${amount.toLocaleString("en-KE")}`

/*
  One camp on the welcome page. The public page and the admin Preview both draw this,
  so what an admin previews is what campers see.
*/
export function WelcomeCampCard({
  category,
  name,
  age,
  dates,
  description,
  image,
  bring,
  fee,
  onSeeFullList,
  children,
}: {
  category: CampCategory
  name: string
  age: string
  dates: string
  description: string
  image: string
  /* The "what to bring" text an admin saved, one item per line. The first few show on the card. */
  bring?: string | null
  fee?: number | null
  onSeeFullList?: () => void
  children: ReactNode
}) {
  const label = category.toUpperCase()
  const title = name.toUpperCase().startsWith(label) ? name : `${label}: ${name}`
  const items = splitLines(bring).slice(0, BRING_PREVIEW_COUNT)

  return (
    <Card className="flex flex-col gap-0 overflow-hidden border-zinc-200 bg-white py-0 text-zinc-900 shadow-sm ring-0 transition-shadow hover:shadow-md">
      <div className="relative h-[248px] w-full overflow-hidden bg-zinc-100">
        <img src={image} alt={`${label} camp`} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute left-4 top-4 rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white shadow-sm">{age}</div>
      </div>

      <CardHeader className="gap-2 px-5 pt-4">
        <CardTitle className="text-lg font-bold text-zinc-900">{title}</CardTitle>
        <p className="flex items-center gap-2 text-sm font-medium text-zinc-900">
          <Calendar className="size-4 text-zinc-500" />
          {dates}
        </p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 px-5 pt-1 pb-4">
        <CardDescription className="text-sm leading-relaxed text-zinc-500">{description}</CardDescription>
        {items.length > 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">What to bring</h3>
            <ul className="flex flex-col gap-2">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                  <Check className="mt-0.5 size-4 shrink-0 text-zinc-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {onSeeFullList && (
              <button type="button" onClick={onSeeFullList} className="mt-3 text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600">
                See the full list for {label}
              </button>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-zinc-200 bg-white px-5 py-4">
        {fee !== null && fee !== undefined && (
          <div className="flex w-full items-center justify-between text-sm">
            <span className="text-zinc-500">Registration fee</span>
            <span className="font-semibold text-zinc-900">{money(fee)}</span>
          </div>
        )}
        <div className="w-full">{children}</div>
      </CardFooter>
    </Card>
  )
}