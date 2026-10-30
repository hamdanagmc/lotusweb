import { useEffect, useState } from 'react'

/**
 * The site header's scroll state: solid past 80px; hidden while scrolling down
 * past 200px, back on scroll up. Shared so bars pinned under the header (the
 * Lotus Story menu) move with it.
 */
export function useHeaderScroll() {
  const [solid, setSolid] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setSolid(y > 80)
      if (y !== lastY) setHidden(y > 200 && y > lastY)
      lastY = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return { solid, hidden }
}
