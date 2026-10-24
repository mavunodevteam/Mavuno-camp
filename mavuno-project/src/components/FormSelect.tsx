import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type FormOption = { value: string; label: string }

/*
  A dropdown for form fields. It shows the chosen label, or the placeholder when nothing is chosen,
  and it works before the list has ever been opened.
*/
export function FormSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
  className,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  options: FormOption[]
  placeholder: string
  label: string
  className?: string
  disabled?: boolean
}) {
  const current = options.find((o) => o.value === value)
  return (
    <Select value={value === "" ? null : value} disabled={disabled} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger className={cn("w-full", className)} aria-label={label}>
        <span className={current ? undefined : "text-muted-foreground"}>
          {current ? current.label : placeholder}
        </span>
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