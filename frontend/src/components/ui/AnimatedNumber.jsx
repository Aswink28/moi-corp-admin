import { useEffect, useRef, useState } from 'react'

/**
 * Counts up to `value` on mount/update. Supports a formatter (e.g. currency).
 */
export default function AnimatedNumber({ value = 0, duration = 900, format = (n) => Math.round(n).toLocaleString('en-IN') }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef()
  const from = useRef(0)

  useEffect(() => {
    const start = performance.now()
    const startVal = from.current
    const target = Number(value) || 0
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setDisplay(startVal + (target - startVal) * eased)
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else from.current = target
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration])

  return <>{format(display)}</>
}
