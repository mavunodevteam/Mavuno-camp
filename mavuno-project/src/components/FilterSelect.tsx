import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"

export type Option = { value: string; label: string }

/*
  A dropdown that always shows the chosen label, even before the list has been opened.
  The first option is the "no filter" choice, such as "All camps".
*/
export function FilterSelect({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: string
  onChange: (value: string) => void
  options: Option[]
  className?: string
  label: string
}) {
  const current = options.find((o) => o.value === value) ?? options[0]
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? options[0].value)}>
      <SelectTrigger className={className} aria-label={label}>
        {current.label}
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}