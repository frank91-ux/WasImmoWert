import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Synchronizes a vertical tab nav with scroll position.
 * Uses IntersectionObserver on the <main> scroll container
 * to detect which section is most visible.
 */
export function useScrollSync(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState(sectionIds[0] || '')
  const isScrollingRef = useRef(false)
  const sectionIdsRef = useRef(sectionIds)
  sectionIdsRef.current = sectionIds

  useEffect(() => {
    const container = document.querySelector('main')
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return

        // Track visibility of all observed sections
        const visible = new Map<string, number>()
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.intersectionRatio)
          }
        }

        if (visible.size > 0) {
          // Pick the section with the highest intersection ratio
          let best = ''
          let bestRatio = 0
          for (const [id, ratio] of visible) {
            if (ratio > bestRatio) {
              best = id
              bestRatio = ratio
            }
          }
          if (best) setActiveSection(best)
        }
      },
      {
        root: container,
        threshold: [0, 0.1, 0.25, 0.5, 0.75],
        rootMargin: '-5% 0px -50% 0px',
      },
    )

    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [sectionIds])

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return

    isScrollingRef.current = true
    setActiveSection(id)

    el.scrollIntoView({ behavior: 'smooth', block: 'start' })

    // Allow IntersectionObserver to take over again after scroll finishes
    setTimeout(() => {
      isScrollingRef.current = false
    }, 900)
  }, [])

  return { activeSection, scrollToSection, setActiveSection }
}
