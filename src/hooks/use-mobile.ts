import * as React from "react"

// 700px, no 768: el Fold desplegado mide ~700-850px de ancho interior y
// merece el sidebar acoplado tipo tablet, no el drawer de móvil — 768 lo
// dejaría atrapado en el modo angosto en su orientación más común.
const MOBILE_BREAKPOINT = 700

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
