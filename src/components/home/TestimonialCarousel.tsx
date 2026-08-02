import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react'

interface Testimonial {
  src: string
  label: string
  caption: string
}

const testimonials: Testimonial[] = [
  {
    src: '/videos/testimonial-1.mp4',
    label: 'Staff Experience',
    caption: 'Bila doktor kami sendiri amalkan peptide therapy',
  },
  {
    src: '/videos/testimonial-2.mp4',
    label: 'Patient Transformation',
    caption: 'Transformasi yang menakjubkan — 170K views',
  },
  {
    src: '/videos/testimonial-3.mp4',
    label: 'Patient Results',
    caption: '"Baby sihat ke dalam perut?" — hasil peptide therapy',
  },
]

export default function TestimonialCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const playActiveVideo = useCallback(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return
      if (i === activeIndex) {
        video.currentTime = 0
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, [activeIndex])

  useEffect(() => {
    playActiveVideo()
  }, [activeIndex, playActiveVideo])

  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) video.muted = muted
    })
  }, [muted])

  const goTo = (index: number) => {
    if (index < 0) index = testimonials.length - 1
    if (index >= testimonials.length) index = 0
    setActiveIndex(index)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      goTo(diff > 0 ? activeIndex + 1 : activeIndex - 1)
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {/* Section Header */}
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Real Transformations
        </h2>
        <p className="mt-2 text-pharma-400 text-sm">
          See what our patients and staff have experienced
        </p>
      </div>

      {/* Carousel */}
      <div
        className="relative max-w-2xl mx-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Video container */}
        <div className="relative rounded-card overflow-hidden bg-pharma-850 border border-pharma-700/50 shadow-2xl">
          {/* Active label badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-accent-500/90 backdrop-blur-sm text-white">
              {testimonials[activeIndex].label}
            </span>
          </div>

          {/* Unmute toggle */}
          <button
            onClick={() => setMuted(!muted)}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-pharma-950/70 backdrop-blur-sm text-white hover:bg-pharma-950/90 transition-colors"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {/* Videos */}
          <div className="aspect-[9/16] sm:aspect-[4/5] relative bg-pharma-950">
            {testimonials.map((t, i) => (
              <video
                key={t.src}
                ref={(el) => { videoRefs.current[i] = el }}
                src={t.src}
                muted
                loop
                playsInline
                preload="auto"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-400 ${
                  i === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              />
            ))}
          </div>

          {/* Caption */}
          <div className="px-4 py-3 bg-pharma-850/80 backdrop-blur-sm border-t border-pharma-700/30">
            <p className="text-sm text-pharma-200 text-center">
              {testimonials[activeIndex].caption}
            </p>
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={() => goTo(activeIndex - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-pharma-950/70 backdrop-blur-sm text-white hover:bg-accent-500/80 transition-colors -ml-4 sm:-ml-6"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => goTo(activeIndex + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-pharma-950/70 backdrop-blur-sm text-white hover:bg-accent-500/80 transition-colors -mr-4 sm:-mr-6"
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'bg-accent-500 w-6'
                  : 'bg-pharma-600 hover:bg-pharma-400'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
