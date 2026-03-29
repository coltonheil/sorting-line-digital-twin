import { useEffect, useState } from 'react'

export default function FPSCounter() {
  const [fps, setFps] = useState(60)

  useEffect(() => {
    let frames = 0
    let last = performance.now()
    let raf

    const tick = (now) => {
      frames += 1
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)))
        frames = 0
        last = now
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <div className="fps-counter">{fps} FPS</div>
}
