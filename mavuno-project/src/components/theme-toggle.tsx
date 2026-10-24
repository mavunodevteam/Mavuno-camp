import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"

/* A sun or moon icon with a slider. Slide on for dark mode, off for light mode. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  /* The saved theme is only known in the browser, so wait before showing the real state */
  useEffect(() => {
    setMounted(true)
  }, [])

  const dark = mounted && resolvedTheme === "dark"
  const Icon = dark ? Moon : Sun

  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" aria-hidden />
      <Switch aria-label="Dark mode" checked={dark} onCheckedChange={(next) => setTheme(next ? "dark" : "light")} />
    </div>
  )
}