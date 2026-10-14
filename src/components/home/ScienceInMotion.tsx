import { useEffect, useRef, useState } from 'react'

/**
 * Placeholder slot — to use your own footage, drop a short muted loop (MP4/WebM, ideally < 3 MB)
 * into public/videos/ and set its path here, e.g. '/videos/science-in-motion.mp4'.
 * While null, an animated SVG molecule is shown instead.
 */
const SCIENCE_VIDEO_SRC: string | null = null
const SCIENCE_VIDEO_POSTER: string | undefined = undefined

function MoleculeFallback() {
  const outer = [0, 60, 120, 180, 240, 300].map(deg => {
    const r = (deg * Math.PI) / 180
    return { x: 200 + 140 * Math.cos(r), y: 200 + 140 * Math.sin(r) }
  })
  const inner = [30, 150, 270].map(deg => {
    const r = (deg * Math.PI) / 180
    return { x: 200 + 75 * Math.cos(r), y: 200 + 75 * Math.sin(r) }
  })

  return (
    <svg viewBox="0 0 400 400" className="w-full h-full" role="img" aria-label="Animated peptide molecule illustration">
      <defs>
        <radialGradient id="mol-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>
      </defs>
      <g className="molecule-orbit">
        {outer.map((p, i) => (
          <line key={`o${i}`} x1={200} y1={200} x2={p.x} y2={p.y} stroke="#3a3a7a" strokeWidth={1.5} />
        ))}
        {outer.map((p, i) => (
          <circle key={`n${i}`} cx={p.x} cy={p.y} r={14} fill="#12123a" stroke="#9575cd" strokeWidth={2}
            className="molecule-node" style={{ animationDelay: `${i * 0.5}s` }} />
        ))}
      </g>
      <g className="molecule-orbit reverse">
        {inner.map((p, i) => (
          <circle key={`i${i}`} cx={p.x} cy={p.y} r={9} fill="#b39ddb" className="molecule-node" style={{ animationDelay: `${i * 0.8}s` }} />
        ))}
      </g>
      <circle cx={200} cy={200} r={34} fill="url(#mol-core)" />
    </svg>
  )
}

export default function ScienceInMotion() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)

  // Only fetch/play the video while it's on screen; never autoplay under reduced motion.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {})
      else video.pause()
    }, { threshold: 0.25 })
    io.observe(video)
    return () => io.disconnect()
  }, [])

  const showVideo = SCIENCE_VIDEO_SRC && !failed

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 overflow-hidden">
      <div className="ambient-orb w-[420px] h-[420px] -left-40 top-10" />
      <div className="relative grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div data-reveal>
          <p className="eyebrow mb-4">Science</p>
          <h2 className="heading-display text-4xl sm:text-5xl text-white">
            Science <em>in motion</em>
          </h2>
          <p className="mt-5 text-pharma-300 leading-relaxed max-w-md">
            ATHERYX™ and ELYSION™ are built on incretin-based peptides — GLP-1, GIP and glucagon receptor
            pathways delivered through a precision multi-dose pen.
          </p>
        </div>

        <div data-reveal className="relative aspect-square max-w-md w-full mx-auto rounded-[2rem] border border-pharma-700/50 bg-pharma-900/70 overflow-hidden">
          {showVideo ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              src={SCIENCE_VIDEO_SRC}
              poster={SCIENCE_VIDEO_POSTER}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden="true"
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="p-8 w-full h-full"><MoleculeFallback /></div>
          )}
        </div>
      </div>
    </section>
  )
}
