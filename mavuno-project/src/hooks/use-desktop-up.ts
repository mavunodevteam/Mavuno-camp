import * as React from "react"

/** Project desktop breakpoint (68.75rem) — matches `desktop:` in Tailwind. */
const DESKTOP_BREAKPOINT_PX = 1100

export function useDesktopUp() {
  const [desktopUp, setDesktopUp] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX}px)`)
    const onChange = () => setDesktopUp(mql.matches)
    mql.addEventListener("change", onChange)
    setDesktopUp(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return desktopUp
}
