import * as React from "react"
import { APP_CONFIG } from '@shared/constants'

const MOBILE_BREAKPOINT = APP_CONFIG.LIMITS.MOBILE_BREAKPOINT

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    try {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      const onChange = () => {
        try {
          setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        } catch (error) {
          // Silently handle mobile detection errors in production
        }
      }
      mql.addEventListener("change", onChange)
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      return () => {
        try {
          mql.removeEventListener("change", onChange)
        } catch (error) {
          // Silently handle cleanup errors in production
        }
      }
    } catch (error) {
      // Silently handle initialization errors and fallback to desktop
      // Fallback to desktop mode if detection fails
      setIsMobile(false);
    }
  }, [])

  return !!isMobile
}
