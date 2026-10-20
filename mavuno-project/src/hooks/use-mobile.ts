import * as React from "react"

/** Match project desktop breakpoint (68.75rem): below this, sidebar is a sheet overlay. */
const SIDEBAR_OVERLAY_BREAKPOINT_PX = 1100

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(max-width: ${SIDEBAR_OVERLAY_BREAKPOINT_PX - 1}px)`
    )
    const onChange = () => {
      setIsMobile(window.innerWidth < SIDEBAR_OVERLAY_BREAKPOINT_PX)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < SIDEBAR_OVERLAY_BREAKPOINT_PX)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
