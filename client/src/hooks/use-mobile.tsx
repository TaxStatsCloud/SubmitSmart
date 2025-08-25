import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    try {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      const onChange = () => {
        try {
          setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        } catch (error) {
          console.error('Mobile detection onChange error:', error);
        }
      }
      mql.addEventListener("change", onChange)
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      return () => {
        try {
          mql.removeEventListener("change", onChange)
        } catch (error) {
          console.error('Mobile detection cleanup error:', error);
        }
      }
    } catch (error) {
      console.error('Mobile detection initialization error:', error);
      // Fallback to desktop mode if detection fails
      setIsMobile(false);
    }
  }, [])

  return !!isMobile
}
