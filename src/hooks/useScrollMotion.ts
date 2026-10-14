import { useEffect, type RefObject } from 'react'

/**
 * Lenis smooth scroll + GSAP ScrollTrigger reveals, scoped to `rootRef`.
 *
 *   data-reveal            → fades/lifts in when scrolled into view
 *   data-reveal-stagger    → its direct children fade/lift in one after another
 *
 * Libraries are dynamically imported after first paint so they stay out of the
 * main bundle. Does nothing when the user prefers reduced motion.
 */
export function useScrollMotion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    let cleanup = () => {}

    // Wait until the browser is idle so the motion libraries never compete with first paint
    const whenIdle = (cb: () => void) =>
      'requestIdleCallback' in window ? window.requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 300)

    whenIdle(() => Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('lenis')]).then(
      ([{ gsap }, { ScrollTrigger }, { default: Lenis }]) => {
        if (cancelled) return
        gsap.registerPlugin(ScrollTrigger)

        const lenis = new Lenis({ duration: 1.1, allowNestedScroll: true })
        lenis.on('scroll', ScrollTrigger.update)
        const tick = (time: number) => lenis.raf(time * 1000)
        gsap.ticker.add(tick)
        gsap.ticker.lagSmoothing(0)

        const ctx = gsap.context(() => {
          gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(el => {
            gsap.from(el, {
              autoAlpha: 0,
              y: 40,
              duration: 1,
              ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 85%', once: true },
            })
          })

          gsap.utils.toArray<HTMLElement>('[data-reveal-stagger]').forEach(group => {
            gsap.from(group.children, {
              autoAlpha: 0,
              y: 48,
              duration: 0.9,
              ease: 'power3.out',
              stagger: 0.12,
              scrollTrigger: { trigger: group, start: 'top 85%', once: true },
            })
          })
        }, root)

        cleanup = () => {
          ctx.revert()
          gsap.ticker.remove(tick)
          gsap.ticker.lagSmoothing(500, 33)
          lenis.destroy()
        }
      },
    ))

    return () => {
      cancelled = true
      cleanup()
    }
  }, [rootRef])
}
