import { useSidebar } from "@/components/ui/sidebar"
import { useDesktopUp } from "@/hooks/use-desktop-up"

/** Desktop with sidebar collapsed: payment panel beside the scrollable form frame. */
export function useWalkInPaymentAside(): boolean {
  const desktopUp = useDesktopUp()
  const { state, isMobile } = useSidebar()
  return desktopUp && !isMobile && state === "collapsed"
}
