import { Swiper, SwiperSlide } from 'swiper/react'
import { A11y, Keyboard, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import { AtheryxFeaturedCard, ElysionFeaturedCard } from './FeaturedProductCards'

/** Swipeable ATHERYX™ / ELYSION™ cards. Lazy-loaded from HomePage to keep Swiper out of the main bundle. */
export default function ProductSwiper() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div>
      <Swiper
        className="product-swiper"
        modules={[A11y, Keyboard, Pagination]}
        slidesPerView={1.12}
        spaceBetween={16}
        grabCursor
        keyboard={{ enabled: true }}
        pagination={{ clickable: true }}
        speed={reduceMotion ? 0 : 600}
        breakpoints={{ 768: { slidesPerView: 2, spaceBetween: 24 } }}
        a11y={{ prevSlideMessage: 'Previous product', nextSlideMessage: 'Next product' }}
      >
        <SwiperSlide><AtheryxFeaturedCard /></SwiperSlide>
        <SwiperSlide><ElysionFeaturedCard /></SwiperSlide>
      </Swiper>

      <p className="md:hidden mt-3 flex items-center justify-center gap-2 text-xs text-pharma-400" aria-hidden="true">
        Swipe to explore
        <svg className="w-4 h-4 swipe-hint-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </p>
    </div>
  )
}
