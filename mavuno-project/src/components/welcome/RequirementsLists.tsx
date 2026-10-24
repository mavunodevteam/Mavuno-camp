import { splitLines } from "@/lib/welcome"

const SECTIONS = [
  { key: "bring", label: "What to bring" },
  { key: "expect", label: "What to expect" },
  { key: "know", label: "Good to know" },
] as const

/* The three lists a camper reads before coming: bring, expect, good to know */
export function RequirementsLists({ bring, expect, know }: { bring: string | null; expect: string | null; know: string | null }) {
  const text = { bring, expect, know }
  return (
    <div className="flex flex-col gap-4">
      {SECTIONS.map(({ key, label }) => {
        const items = splitLines(text[key])
        if (items.length === 0) return null
        return (
          <section key={key} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{label}</h3>
            <ul className="list-disc space-y-1 rounded-md border px-4 py-3 pl-8 text-sm">
              {items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}