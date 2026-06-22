<script setup lang="ts">
const musicSrc = '/audio/music.m4a'

type AttendanceStatus = 'attending' | 'not_attending'

type RsvpForm = {
  guestName: string
  wishMessage: string
  attendanceStatus: AttendanceStatus
  guestCount: number
}

type CountdownItem = {
  label: string
  value: string
}

type Wish = {
  id: string
  name: string
  message: string
}

const weddingDate = new Date('2026-10-24T17:30:00+07:00')
const now = ref(new Date())
const backgroundMusic = ref<HTMLAudioElement | null>(null)
const invitationIntro = ref<HTMLElement | null>(null)
const isMusicPlaying = ref(false)
const hasAudioError = ref(false)
const isIntroOpen = ref(false)
const isIntroAnimating = ref(false)
const isSubmittingRsvp = ref(false)
const rsvpStatusMessage = ref('')
const rsvpStatusTone = ref<'success' | 'error'>('success')
let countdownTimer: ReturnType<typeof window.setInterval> | undefined
let stopCountdownFlipWatch: ReturnType<typeof watch> | undefined
let stopGallerySlideWatch: ReturnType<typeof watch> | undefined
let lockedScrollY = 0
let introTouchStartY = 0

const isMobileViewport = () => window.matchMedia('(max-width: 820px)').matches

function updateViewportHeight() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
}

function syncIntroScrollLock() {
  if (!isIntroOpen.value) {
    lockedScrollY = 0
    window.scrollTo(0, 0)
    document.documentElement.classList.add('invitation-locked')
    document.body.classList.add('invitation-locked')
    document.body.style.position = 'fixed'
    document.body.style.top = '0'
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    return
  }

  document.documentElement.classList.remove('invitation-locked')
  document.body.classList.remove('invitation-locked')
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.left = ''
  document.body.style.right = ''
  document.body.style.width = ''
  window.scrollTo(0, lockedScrollY)
}

const form = reactive<RsvpForm>({
  guestName: '',
  wishMessage: '',
  attendanceStatus: 'attending',
  guestCount: 2
})

const galleryImages = [
  '/photos/IMG_0134.JPG',
  '/photos/IMG_0136.JPG',
  '/photos/IMG_0138.JPG',
  '/photos/IMG_0139.JPG',
  '/photos/IMG_0142.JPG',
  '/photos/IMG_0148.JPG',
  '/photos/IMG_0149.JPG',
  '/photos/IMG_0150.JPG',
  '/photos/IMG_0151.JPG',
  '/photos/IMG_0152.JPG'
]
const activeGalleryIndex = ref(3)
const activeGalleryImage = computed(() => galleryImages[activeGalleryIndex.value])
const gallerySlideDirection = ref(1)

const { data: wishes, refresh: refreshWishes } = await useFetch<Wish[]>('/api/wishes', {
  default: () => []
})

const timeline = [
  {
    time: '16:30',
    title: 'Đón khách',
    text: 'Cùng lưu lại những khung hình đầu tiên tại khu vực welcome.'
  },
  {
    time: '17:30',
    title: 'Lễ thành hôn',
    text: 'Khoảnh khắc trao nhẫn và lời hẹn ước trước gia đình, bạn bè.'
  },
  {
    time: '18:30',
    title: 'Tiệc tối',
    text: 'Dùng bữa, nâng ly và chia sẻ niềm vui trong không gian ấm cúng.'
  }
]

const countdown = computed<CountdownItem[]>(() => {
  const diff = Math.max(weddingDate.getTime() - now.value.getTime(), 0)
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1000)

  return [
    { label: 'Ngày', value: String(days).padStart(2, '0') },
    { label: 'Giờ', value: String(hours).padStart(2, '0') },
    { label: 'Phút', value: String(minutes).padStart(2, '0') },
    { label: 'Giây', value: String(seconds).padStart(2, '0') }
  ]
})

function animateCountdownDigit(unitIndex: number, digitIndex: number) {
  const { $gsap } = useNuxtApp()
  const digit = document.querySelector<HTMLElement>(
    `[data-countdown-index="${unitIndex}"] [data-digit-index="${digitIndex}"]`
  )
  const number = digit?.querySelector<HTMLElement>('.countdown-digit__number')

  if (!digit || !number) {
    return
  }

  $gsap.killTweensOf(number)
  $gsap.timeline()
    .set(number, {
      transformPerspective: 700,
      transformOrigin: 'center top'
    })
    .fromTo(number, {
      rotateX: -86,
      yPercent: -68,
      opacity: 0.18
    }, {
      rotateX: 0,
      yPercent: 0,
      opacity: 1,
      duration: 0.58,
      ease: 'power3.out'
    })
}

const submitLabel = computed(() => {
  if (isSubmittingRsvp.value) {
    return 'Đang gửi...'
  }

  return form.attendanceStatus === 'attending' ? 'Gửi xác nhận tham dự' : 'Gửi lời chúc'
})

async function submitRsvp() {
  if (isSubmittingRsvp.value) {
    return
  }

  isSubmittingRsvp.value = true
  rsvpStatusMessage.value = ''

  try {
    await $fetch('/api/rsvp', {
      method: 'POST',
      body: {
        guestName: form.guestName,
        wishMessage: form.wishMessage,
        attendanceStatus: form.attendanceStatus,
        guestCount: form.attendanceStatus === 'attending' ? form.guestCount : 0
      }
    })

    form.guestName = ''
    form.wishMessage = ''
    form.attendanceStatus = 'attending'
    form.guestCount = 2
    rsvpStatusTone.value = 'success'
    rsvpStatusMessage.value = 'Cảm ơn bạn. Lời chúc sẽ hiển thị sau khi được duyệt.'
    await refreshWishes()
  }
  catch (error) {
    rsvpStatusTone.value = 'error'
    rsvpStatusMessage.value = error instanceof Error ? error.message : 'Không thể gửi xác nhận lúc này.'
  }
  finally {
    isSubmittingRsvp.value = false
  }
}

function showPreviousGalleryImage() {
  gallerySlideDirection.value = -1
  activeGalleryIndex.value = (activeGalleryIndex.value - 1 + galleryImages.length) % galleryImages.length
}

function showNextGalleryImage() {
  gallerySlideDirection.value = 1
  activeGalleryIndex.value = (activeGalleryIndex.value + 1) % galleryImages.length
}

function showGalleryImage(index: number) {
  if (index === activeGalleryIndex.value) {
    return
  }

  gallerySlideDirection.value = index > activeGalleryIndex.value ? 1 : -1
  activeGalleryIndex.value = index
}

async function playBackgroundMusic() {
  if (!backgroundMusic.value || hasAudioError.value) {
    return
  }

  try {
    backgroundMusic.value.volume = 0.36
    await backgroundMusic.value.play()
    isMusicPlaying.value = true
  }
  catch {
    isMusicPlaying.value = false
  }
}

function pauseBackgroundMusic() {
  backgroundMusic.value?.pause()
  isMusicPlaying.value = false
}

async function toggleBackgroundMusic() {
  if (isMusicPlaying.value) {
    pauseBackgroundMusic()
    return
  }

  await playBackgroundMusic()
}

function handleAudioError() {
  hasAudioError.value = true
  isMusicPlaying.value = false
}

function handleIntroWheel(event: WheelEvent) {
  if (event.deltaY > 8) {
    void playBackgroundMusic()
    void openInvitationIntro()
  }
}

function handleIntroTouchStart(event: TouchEvent) {
  introTouchStartY = event.touches[0]?.clientY ?? 0
  void playBackgroundMusic()
}

function handleIntroTouchMove(event: TouchEvent) {
  const currentY = event.touches[0]?.clientY ?? introTouchStartY

  if (introTouchStartY - currentY > 24) {
    void playBackgroundMusic()
    void openInvitationIntro()
  }
}

async function openInvitationIntro() {
  if (isIntroAnimating.value || isIntroOpen.value || !invitationIntro.value) {
    return
  }

  isIntroAnimating.value = true
  const { $gsap } = useNuxtApp()
  const intro = invitationIntro.value
  const doorOffset = isMobileViewport() ? 0 : 12

  await playBackgroundMusic()

  $gsap.timeline({
    defaults: { ease: 'power3.inOut' },
    onComplete: () => {
      isIntroOpen.value = true
      isIntroAnimating.value = false
    }
  })
    .to(intro.querySelector('.invitation-card__seal'), {
      scale: 0.68,
      opacity: 0,
      duration: 0.48,
      ease: 'power2.out'
    })
    .to(intro.querySelector('.invitation-card__left'), {
      rotateY: -118,
      x: -doorOffset,
      duration: 1.73,
      transformOrigin: 'left center'
    }, 0.12)
    .to(intro.querySelector('.invitation-card__right'), {
      rotateY: 118,
      x: doorOffset,
      duration: 1.73,
      transformOrigin: 'right center'
    }, 0.12)
    .to(intro.querySelector('.invitation-card__inside'), {
      scale: 1.04,
      opacity: 0,
      duration: 1.08
    }, 0.84)
    .to(intro, {
      autoAlpha: 0,
      duration: 0.93,
      pointerEvents: 'none'
    }, 1.29)
    .fromTo('.hero-copy > *', {
      y: 34,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 1.29,
      stagger: 0.21,
      ease: 'power3.out'
    }, 1.02)
}

onMounted(() => {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }

  updateViewportHeight()
  window.addEventListener('resize', updateViewportHeight)
  window.addEventListener('orientationchange', updateViewportHeight)
  window.visualViewport?.addEventListener('resize', updateViewportHeight)

  countdownTimer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)

  const { $gsap } = useNuxtApp()
  syncIntroScrollLock()
  window.requestAnimationFrame(() => {
    if (!isIntroOpen.value) {
      syncIntroScrollLock()
    }
  })

  $gsap.set('.hero-copy > *', { y: 34, opacity: 0 })
  $gsap.from('.hero-photo', {
    scale: 1.12,
    opacity: 0,
    duration: 1.8,
    ease: 'power3.out'
  })

  $gsap.from('.invitation-card', {
    y: 34,
    rotateX: 5,
    opacity: 0,
    duration: 1.15,
    ease: 'power3.out'
  })

  $gsap.from('.invitation-card__ornament', {
    scale: 0.82,
    opacity: 0,
    duration: 1,
    delay: 0.28,
    ease: 'power3.out'
  })

  const revealElements = document.querySelectorAll('.reveal')
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return
        }

        $gsap.to(entry.target, {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out'
        })
        observer.unobserve(entry.target)
      })
    },
    { threshold: 0.18 }
  )

  revealElements.forEach((element) => observer.observe(element))

  stopCountdownFlipWatch = watch(countdown, (current, previous) => {
    current.forEach((item, index) => {
      if (!previous?.[index] || item.value === previous[index].value) {
        return
      }

      item.value.split('').forEach((digit, digitIndex) => {
        if (digit !== previous[index].value[digitIndex]) {
          animateCountdownDigit(index, digitIndex)
        }
      })
    })
  })

  watch(isIntroOpen, () => {
    syncIntroScrollLock()
  })

  stopGallerySlideWatch = watch(activeGalleryIndex, async () => {
    await nextTick()

    const direction = gallerySlideDirection.value
    const frame = document.querySelector<HTMLElement>('.gallery-frame')
    const background = frame?.querySelector<HTMLElement>('.gallery-frame__background')
    const photo = frame?.querySelector<HTMLElement>('.gallery-frame__photo')
    const activeThumb = document.querySelector<HTMLElement>('.gallery-thumb.is-active')

    if (!frame || !background || !photo) {
      return
    }

    $gsap.killTweensOf([background, photo, activeThumb])
    $gsap.timeline({ defaults: { ease: 'power3.out' } })
      .fromTo(background, {
        xPercent: direction * 5,
        scale: 1.22,
        opacity: 0.18
      }, {
        xPercent: 0,
        scale: 1.14,
        opacity: 0.74,
        duration: 0.82
      }, 0)
      .fromTo(photo, {
        xPercent: direction * 22,
        scale: 0.985,
        opacity: 0
      }, {
        xPercent: 0,
        scale: 1,
        opacity: 1,
        duration: 0.72
      }, 0.04)

    if (activeThumb) {
      $gsap.fromTo(activeThumb, { scale: 0.92 }, { scale: 1, duration: 0.34, ease: 'back.out(1.8)' })
    }
  })
})

onBeforeUnmount(() => {
  if (countdownTimer) {
    window.clearInterval(countdownTimer)
  }

  stopCountdownFlipWatch?.()
  stopGallerySlideWatch?.()
  pauseBackgroundMusic()
  window.removeEventListener('resize', updateViewportHeight)
  window.removeEventListener('orientationchange', updateViewportHeight)
  window.visualViewport?.removeEventListener('resize', updateViewportHeight)
  document.body.classList.remove('invitation-locked')
})
</script>

<template>
  <main class="wedding-page">
    <audio
      ref="backgroundMusic"
      :src="musicSrc"
      loop
      playsinline
      preload="auto"
      @error="handleAudioError"
      @play="isMusicPlaying = true"
      @pause="isMusicPlaying = false"
    />

    <button
      class="music-toggle"
      type="button"
      :class="{ 'is-playing': isMusicPlaying }"
      :aria-label="isMusicPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'"
      :title="isMusicPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'"
      :disabled="hasAudioError"
      @click="toggleBackgroundMusic"
    >
      <span class="music-toggle__icon" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span class="music-toggle__label">{{ isMusicPlaying ? 'On' : 'Off' }}</span>
    </button>

    <div
      v-if="!isIntroOpen"
      ref="invitationIntro"
      class="invitation-intro"
      @click="openInvitationIntro"
      @wheel.prevent="handleIntroWheel"
      @touchstart.passive="handleIntroTouchStart"
      @touchmove.prevent="handleIntroTouchMove"
    >
      <button
        class="invitation-card"
        type="button"
        :disabled="isIntroAnimating"
        aria-label="Mở thiệp cưới"
      >
        <span class="invitation-card__inside">
          <span class="invitation-card__ornament" aria-hidden="true" />
          <span class="invitation-card__script">Wedding invitation</span>
          <span class="invitation-card__names">Đình Dương<br>Thu Hà</span>
          <span class="invitation-card__date">24 - 25.10.2026</span>
          <span class="invitation-card__hint">Chạm để mở thiệp</span>
        </span>
        <span class="invitation-card__door invitation-card__left" aria-hidden="true" />
        <span class="invitation-card__door invitation-card__right" aria-hidden="true" />
        <span class="invitation-card__seal" aria-hidden="true">D<br>&amp;<br>H</span>
      </button>
    </div>

    <section class="hero">
      <img
        class="hero-photo"
        src="/photos/IMG_0139.JPG"
        alt="Đình Dương và Thu Hà trong trang phục cưới"
      >
      <div class="hero-shade" />

      <div
        v-if="false"
        ref="invitationIntro"
        class="invitation-intro"
        @click="openInvitationIntro"
      >
        <button
          class="invitation-card"
          type="button"
          :disabled="isIntroAnimating"
          aria-label="Mở thiệp cưới"
        >
          <span class="invitation-card__inside">
            <span class="invitation-card__ornament" aria-hidden="true" />
            <span class="invitation-card__script">Wedding invitation</span>
            <span class="invitation-card__names">Đình Dương<br>Thu Hà</span>
            <span class="invitation-card__date">24 - 25.10.2026</span>
            <span class="invitation-card__hint">Chạm để mở thiệp</span>
          </span>
          <span class="invitation-card__door invitation-card__left" aria-hidden="true" />
          <span class="invitation-card__door invitation-card__right" aria-hidden="true" />
          <span class="invitation-card__seal" aria-hidden="true">D<br>&amp;<br>H</span>
        </button>
      </div>

      <div class="hero-copy">
        <h1>
          <span class="hero-script">Wedding</span>
          <span class="hero-names">Đình Dương<br>Thu Hà</span>
        </h1>
        <p class="hero-date">Thứ bảy &amp; Chủ nhật, 24 - 25.10.2026</p>
        <a class="hero-action" href="#rsvp">Xác nhận tham dự</a>
      </div>
    </section>

    <section class="intro section reveal">
      <p class="script">Trân trọng kính mời</p>
      <h2 style="line-height: 1.2;">Gia đình và những người thương đến chung vui trong ngày thành hôn</h2>
      <p>
        Sự hiện diện của bạn là món quà dịu dàng nhất dành cho chúng tôi trong
        hành trình bắt đầu một chương mới.
      </p>
    </section>

    <section class="countdown-section reveal" aria-label="Đồng hồ đếm ngược">
      <div
        v-for="(item, index) in countdown"
        :key="item.label"
        class="countdown-box"
        :data-countdown-index="index"
      >
        <div class="countdown-digits" aria-live="polite" :aria-label="`${item.value} ${item.label}`">
          <span
            v-for="(digit, digitIndex) in item.value.split('')"
            :key="`${item.label}-${digitIndex}`"
            class="countdown-digit"
            :data-digit-index="digitIndex"
          >
            <strong class="countdown-digit__number">{{ digit }}</strong>
          </span>
        </div>
        <span class="countdown-label">{{ item.label }}</span>
      </div>
    </section>

    <section class="story section">
      <div class="story-media reveal">
        <img
          src="/photos/IMG_0142.JPG"
          alt="Đình Dương và Thu Hà cùng nhau trong ngày chụp cưới"
        >
      </div>
      <div class="story-copy reveal">
        <p class="eyebrow">Our story</p>
        <h2 style="line-height: 1.2;">Một lời hẹn, một mùa thương</h2>
        <p>
          Chúng tôi gặp nhau trong những ngày rất bình thường, rồi cùng nhau
          gom góp từng khoảnh khắc nhỏ thành một câu chuyện đủ đầy.
        </p>
        <p>
          Ngày cưới là nơi câu chuyện ấy được kể lại bằng nụ cười, ánh nến và
          lời chúc phúc của những người thân yêu.
        </p>
      </div>
    </section>

    <section class="timeline section reveal">
      <p class="script">Wedding day</p>
      <h2>Lịch trình buổi tiệc</h2>
      <div class="timeline-list">
        <article v-for="item in timeline" :key="item.time" class="timeline-item">
          <time>{{ item.time }}</time>
          <div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="gallery section">
      <div class="section-heading reveal">
        <p class="eyebrow">Gallery</p>
        <h2 style="line-height: 1.2;">Những khung hình thay cho lời kể</h2>
      </div>
      <div class="gallery-slider reveal">
        <div class="gallery-frame">
          <img
            class="gallery-frame__background"
            :src="activeGalleryImage"
            alt=""
            aria-hidden="true"
          >
          <img
            class="gallery-frame__photo"
            :key="activeGalleryImage"
            :src="activeGalleryImage"
            alt="Ảnh cưới của Đình Dương và Thu Hà"
          >
          <button
            class="gallery-nav gallery-nav--prev"
            type="button"
            aria-label="Xem ảnh trước"
            @click="showPreviousGalleryImage"
          >
            ‹
          </button>
          <button
            class="gallery-nav gallery-nav--next"
            type="button"
            aria-label="Xem ảnh tiếp theo"
            @click="showNextGalleryImage"
          >
            ›
          </button>
        </div>
        <div class="gallery-thumbs" aria-label="Danh sách ảnh cưới">
          <button
            v-for="(image, index) in galleryImages"
            :key="image"
            class="gallery-thumb"
            :class="{ 'is-active': index === activeGalleryIndex }"
            type="button"
            :aria-label="`Xem ảnh cưới ${index + 1}`"
            @click="showGalleryImage(index)"
          >
            <img :src="image" alt="">
          </button>
        </div>
      </div>
    </section>

    <section class="venue section reveal">
      <p class="script">Địa điểm</p>
      <h2 style="line-height: 1.2;">White Palace Phạm Văn Đồng</h2>
      <p>108 Phạm Văn Đồng, Thành phố Hồ Chí Minh</p>
      <a href="https://maps.google.com" target="_blank" rel="noreferrer">Xem bản đồ</a>
    </section>

    <section id="rsvp" class="rsvp section">
      <div class="rsvp-copy reveal">
        <p class="eyebrow">Xác nhận tham dự</p>
        <h2>Gửi lời chúc và xác nhận tham dự</h2>
        <p>
          Bạn giúp chúng tôi chuẩn bị chu đáo hơn bằng cách xác nhận số lượng
          người tham dự trước ngày cưới.
        </p>
      </div>

      <form class="rsvp-form reveal" @submit.prevent="submitRsvp">
        <label>
          Tên của bạn
          <input v-model="form.guestName" type="text" required placeholder="Ví dụ: Nguyễn Minh Anh">
        </label>

        <label>
          Lời chúc
          <textarea
            v-model="form.wishMessage"
            rows="4"
            placeholder="Gửi một lời chúc nhỏ đến cô dâu chú rể"
          />
        </label>

        <fieldset>
          <legend>Bạn có tham dự tiệc không?</legend>
          <label class="radio-row">
            <input v-model="form.attendanceStatus" type="radio" value="attending">
            Có, tôi sẽ tham dự
          </label>
          <label class="radio-row">
            <input v-model="form.attendanceStatus" type="radio" value="not_attending">
            Rất tiếc, tôi không tham dự được
          </label>
        </fieldset>

        <label v-if="form.attendanceStatus === 'attending'">
          Số lượng người tham dự
          <input v-model.number="form.guestCount" type="number" min="1" max="20">
        </label>

        <button type="submit" :disabled="isSubmittingRsvp">{{ submitLabel }}</button>
        <p
          v-if="rsvpStatusMessage"
          class="rsvp-form__status"
          :class="`is-${rsvpStatusTone}`"
        >
          {{ rsvpStatusMessage }}
        </p>
      </form>
    </section>

    <section class="wishes section reveal">
      <p class="script">Lời chúc</p>
      <h2>Thương gửi đến hai bạn</h2>
      <div class="wish-list">
        <article v-for="wish in wishes" :key="wish.id">
          <p>{{ wish.message }}</p>
          <strong>{{ wish.name }}</strong>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&family=Cormorant+Upright:wght@500;600;700&family=Great+Vibes&family=Playfair+Display:wght@500;600;700&display=swap&subset=vietnamese");

:global(*) {
  box-sizing: border-box;
}

:global(html) {
  overflow-x: hidden;
  scroll-behavior: smooth;
}

:global(body) {
  margin: 0;
  overflow-x: hidden;
  color: #332d29;
  background: #fbf8f3;
  font-family: "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif;
}

:global(html.invitation-locked),
:global(body.invitation-locked) {
  overflow: hidden;
  height: 100%;
  overscroll-behavior: none;
}

:global(body.invitation-locked) {
  touch-action: none;
}

:global(a) {
  color: inherit;
}

.wedding-page {
  --number-font: "Playfair Display", "Times New Roman", serif;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0) 0, #fbf8f3 760px),
    #fbf8f3;
}

.invitation-card__date,
.hero-date,
.countdown-digit__number,
.timeline-item time {
  font-variant-numeric: lining-nums tabular-nums;
  font-feature-settings: "lnum" 1, "tnum" 1;
}

.hero {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  min-height: 100dvh;
  min-height: var(--app-height, 100dvh);
  display: grid;
  align-items: end;
  isolation: isolate;
  padding: 28px;
  perspective: 1600px;
}

.hero-photo,
.hero-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero-photo {
  z-index: -2;
  object-fit: cover;
  object-position: center 44%;
}

.hero-shade {
  z-index: -1;
  background:
    linear-gradient(180deg, rgba(27, 21, 18, 0.1) 0%, rgba(27, 21, 18, 0.72) 100%),
    linear-gradient(90deg, rgba(27, 21, 18, 0.7), rgba(27, 21, 18, 0.12));
}

.invitation-intro {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  width: 100%;
  max-width: 100%;
  height: 100vh;
  height: 100svh;
  height: 100dvh;
  overflow: hidden;
  padding: 24px;
  background:
    radial-gradient(circle at 50% 36%, rgba(255, 249, 238, 0.34), transparent 32%),
    linear-gradient(135deg, rgba(45, 32, 28, 0.76), rgba(28, 23, 20, 0.88));
  perspective: 1800px;
}

.invitation-card {
  position: relative;
  width: min(86vw, 520px);
  max-width: 100%;
  aspect-ratio: 0.74;
  display: grid;
  place-items: center;
  overflow: visible;
  border: 0;
  background: transparent;
  color: #5a332b;
  cursor: pointer;
  transform-style: preserve-3d;
}

.invitation-card:disabled {
  cursor: default;
}

.invitation-card__inside,
.invitation-card__door {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(134, 94, 78, 0.28);
  box-shadow: 0 30px 90px rgba(29, 20, 16, 0.34);
}

.invitation-card__inside {
  display: grid;
  align-content: center;
  justify-items: center;
  padding: clamp(28px, 7vw, 56px);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0) 34%),
    #fff8ed;
  text-align: center;
}

.invitation-card__inside::before,
.invitation-card__inside::after {
  position: absolute;
  inset: 18px;
  content: "";
  border: 1px solid rgba(142, 90, 72, 0.24);
  pointer-events: none;
}

.invitation-card__inside::after {
  inset: 26px;
  border-color: rgba(142, 90, 72, 0.16);
}

.invitation-card__door {
  width: 50.4%;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.52), rgba(255, 255, 255, 0) 34%),
    repeating-linear-gradient(90deg, rgba(115, 74, 61, 0.05) 0 1px, transparent 1px 14px),
    #f4dfcf;
  backface-visibility: visible;
  transform-style: preserve-3d;
}

.invitation-card__door::after {
  position: absolute;
  inset: 16px;
  content: "";
  border: 1px solid rgba(116, 71, 56, 0.2);
}

.invitation-card__left {
  right: auto;
  border-right: 0;
}

.invitation-card__right {
  left: auto;
  border-left: 0;
}

.invitation-card__seal {
  position: relative;
  z-index: 3;
  display: grid;
  place-items: center;
  width: clamp(82px, 18vw, 118px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: #8f4f42;
  color: #fff8ed;
  font-family: "Cormorant Garamond", "Times New Roman", serif;
  font-size: clamp(1rem, 3.4vw, 1.45rem);
  font-weight: 700;
  line-height: 0.62;
  box-shadow: 0 18px 38px rgba(71, 40, 33, 0.28);
}

.invitation-card__ornament {
  width: min(58%, 230px);
  aspect-ratio: 3.8;
  margin-bottom: clamp(20px, 5vw, 34px);
  border-top: 1px solid rgba(131, 78, 61, 0.46);
  border-bottom: 1px solid rgba(131, 78, 61, 0.46);
}

.invitation-card__script,
.script {
  font-family: "Great Vibes", "Brush Script MT", cursive;
}

.invitation-card__script {
  margin-bottom: 12px;
  color: #9f5f50;
  font-size: clamp(2.4rem, 9vw, 4.6rem);
  line-height: 0.9;
}

.invitation-card__names {
  font-family: "Cormorant Garamond", "Times New Roman", serif;
  font-size: clamp(2.5rem, 9vw, 5.25rem);
  font-weight: 600;
  line-height: 0.88;
}

.invitation-card__date {
  margin-top: 22px;
  font-family: var(--number-font);
  font-size: clamp(0.9rem, 2.6vw, 1.08rem);
  font-weight: 700;
  letter-spacing: 0.16em;
}

.invitation-card__hint {
  margin-top: 34px;
  color: #8b756c;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
}

.hero-copy {
  width: min(100%, 980px);
  margin: 0 auto 46px;
  color: #fffaf1;
}

.eyebrow {
  margin: 0 0 clamp(16px, 2vw, 24px);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero h1 {
  display: grid;
  gap: clamp(18px, 2.2vw, 34px);
  margin: 0;
  letter-spacing: 0;
}

.hero-script {
  display: block;
  font-family: "Great Vibes", "Brush Script MT", cursive;
  font-size: clamp(5.4rem, 13vw, 10.4rem);
  font-weight: 400;
  line-height: 0.72;
  text-shadow: 0 8px 32px rgba(20, 15, 13, 0.34);
}

.hero-names {
  display: block;
  font-family: "Cormorant Upright", "Cormorant Garamond", "Times New Roman", serif;
  font-size: clamp(2.75rem, 6.4vw, 5.6rem);
  font-weight: 700;
  line-height: 1.02;
  text-shadow: 0 5px 24px rgba(20, 15, 13, 0.34);
}

.hero-date {
  margin: 34px 0 36px;
  font-family: var(--number-font);
  font-size: clamp(1rem, 3vw, 1.35rem);
  font-weight: 500;
}

.hero-action,
.venue a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 22px;
  border: 1px solid currentColor;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 700;
}

.section {
  width: min(100% - 36px, 1120px);
  margin: 0 auto;
  padding: 90px 0;
}

.intro {
  max-width: 780px;
  text-align: center;
}

.script {
  margin: 0 0 clamp(16px, 2.4vw, 26px);
  color: #9f5f50;
  font-size: clamp(3rem, 8vw, 5.5rem);
  line-height: 1.04;
}

h2 {
  margin: 0;
  font-family: "Playfair Display", "Times New Roman", serif;
  font-size: clamp(2.2rem, 6vw, 4.8rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0;
}

p {
  line-height: 1.8;
}

.intro p:last-child,
.story-copy p,
.rsvp-copy p,
.venue p {
  color: #756760;
}

.countdown-section {
  width: min(100% - 36px, 860px);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: clamp(10px, 2vw, 18px);
  margin: 0 auto;
  padding: 22px 0;
}

.countdown-box {
  display: grid;
  gap: 12px;
  min-height: 128px;
  place-items: center;
  padding: 0;
  background: transparent;
  perspective: 900px;
}

.countdown-digits {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 100%;
}

.countdown-digit {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(42px, 6.2vw, 62px);
  aspect-ratio: 0.76;
  overflow: hidden;
  border: 1.25px solid #746b62;
  border-radius: 8px;
  background: rgba(255, 254, 250, 0.92);
  box-shadow: none;
  color: #211a16;
  transform-style: preserve-3d;
}

.countdown-digit__number {
  position: relative;
  z-index: 2;
  display: block;
  font-family: var(--number-font);
  font-size: clamp(2.05rem, 5.2vw, 3.4rem);
  font-weight: 700;
  line-height: 1;
  transform: translateY(-0.03em);
  will-change: transform, opacity;
}

.countdown-label {
  color: #4f4139;
  font-family: var(--number-font);
  font-size: clamp(0.88rem, 2.8vw, 1.12rem);
  font-style: italic;
  font-weight: 600;
}

.story {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(300px, 0.95fr);
  gap: clamp(28px, 6vw, 78px);
  align-items: center;
}

.story-media img,
.gallery-thumb img {
  display: block;
  width: 100%;
  object-fit: cover;
}

.story-media img {
  aspect-ratio: 4 / 5;
}

.story-copy {
  max-width: 520px;
}

.timeline {
  text-align: center;
}

.timeline-list {
  display: grid;
  gap: 14px;
  margin-top: 34px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 22px;
  padding: 24px;
  border: 1px solid #e4d6cd;
  background: #fffdf9;
  text-align: left;
}

.timeline-item time {
  color: #9f5f50;
  font-family: var(--number-font);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  font-synthesis: none;
}

.timeline-item h3 {
  margin: 0 0 8px;
  font-size: 1.15rem;
}

.timeline-item p {
  margin: 0;
  color: #756760;
}

.section-heading {
  max-width: 720px;
  margin-bottom: 36px;
}

.gallery-slider {
  display: grid;
  gap: 16px;
}

.gallery-frame {
  position: relative;
  display: grid;
  place-items: center;
  min-height: clamp(480px, 68vw, 760px);
  overflow: hidden;
  background: #1f1916;
}

.gallery-frame__background,
.gallery-frame__photo {
  display: block;
  grid-area: 1 / 1;
  height: clamp(480px, 68vw, 760px);
}

.gallery-frame__background {
  position: absolute;
  inset: -36px;
  width: calc(100% + 72px);
  height: calc(100% + 72px);
  object-fit: cover;
  opacity: 0.74;
  filter: blur(26px);
  transform: scale(1.14);
}

.gallery-frame__photo {
  position: relative;
  z-index: 1;
  width: min(100%, 620px);
  height: clamp(480px, 68vw, 760px);
  object-fit: contain;
  box-shadow: 0 24px 70px rgba(36, 27, 22, 0.28);
}

.gallery-nav {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  min-height: 0;
  padding: 0;
  border: 1px solid rgba(255, 250, 241, 0.78);
  border-radius: 50%;
  background: rgba(31, 25, 22, 0.42);
  color: #fffaf1;
  font-family: "Cormorant Garamond", "Times New Roman", serif;
  font-size: 2.45rem;
  font-weight: 500;
  line-height: 0.78;
  transform: translateY(-50%);
  backdrop-filter: blur(10px);
}

.gallery-nav--prev {
  left: 18px;
  padding-right: 0;
  padding-bottom: 9px;
}

.gallery-nav--next {
  right: 18px;
  padding-left: 3px;
  padding-bottom: 9px;
}

.gallery-thumbs {
  display: grid;
  grid-auto-columns: minmax(82px, 110px);
  grid-auto-flow: column;
  gap: 10px;
  overflow-x: auto;
  padding: 2px 2px 10px;
  scrollbar-width: thin;
}

.gallery-thumb {
  min-height: auto;
  padding: 0;
  border: 2px solid transparent;
  background: transparent;
  opacity: 0.56;
}

.gallery-thumb.is-active {
  border-color: #8f4f42;
  opacity: 1;
}

.gallery-thumb img {
  aspect-ratio: 4 / 5;
  height: 100%;
}

.venue {
  max-width: 840px;
  border-top: 1px solid #dfd0c5;
  border-bottom: 1px solid #dfd0c5;
  text-align: center;
}

.venue a {
  margin-top: 12px;
  color: #9f5f50;
}

.rsvp {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(320px, 1fr);
  gap: clamp(28px, 7vw, 86px);
  align-items: start;
}

.rsvp-form {
  display: grid;
  gap: 18px;
  padding: clamp(22px, 4vw, 38px);
  border: 1px solid #e4d6cd;
  background: #fffdf9;
}

label,
fieldset {
  display: grid;
  gap: 9px;
  margin: 0;
  color: #544943;
  font-size: 0.92rem;
  font-weight: 700;
}

fieldset {
  padding: 0;
  border: 0;
}

legend {
  margin-bottom: 9px;
}

input,
textarea {
  width: 100%;
  border: 1px solid #ddcdc2;
  border-radius: 0;
  background: #fffaf4;
  color: #332d29;
  font: inherit;
  font-weight: 400;
}

input {
  min-height: 48px;
  padding: 0 14px;
}

textarea {
  resize: vertical;
  padding: 14px;
}

.radio-row {
  display: flex;
  grid-template-columns: none;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.radio-row input {
  width: 18px;
  min-height: 18px;
}

button {
  min-height: 52px;
  border: 0;
  background: #6f3d34;
  color: white;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.rsvp-form__status {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.6;
}

.rsvp-form__status.is-success {
  color: #52734d;
}

.rsvp-form__status.is-error {
  color: #9f3f34;
}

.music-toggle {
  position: fixed;
  right: max(18px, env(safe-area-inset-right));
  bottom: max(18px, env(safe-area-inset-bottom));
  z-index: 20;
  display: inline-grid;
  grid-template-columns: 30px auto;
  gap: 8px;
  align-items: center;
  min-height: 48px;
  padding: 0 14px 0 11px;
  border: 1px solid rgba(255, 250, 241, 0.78);
  border-radius: 999px;
  background: rgba(111, 61, 52, 0.9);
  box-shadow: 0 14px 36px rgba(45, 32, 26, 0.2);
  color: #fffaf1;
  backdrop-filter: blur(12px);
}

.music-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.music-toggle__icon {
  display: inline-flex;
  align-items: end;
  justify-content: center;
  width: 30px;
  height: 30px;
  gap: 3px;
  border-radius: 50%;
  background: rgba(255, 250, 241, 0.14);
  padding: 8px;
}

.music-toggle__icon span {
  width: 4px;
  height: 7px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.55;
}

.music-toggle__icon span:nth-child(2) {
  height: 13px;
}

.music-toggle__icon span:nth-child(3) {
  height: 10px;
}

.music-toggle.is-playing .music-toggle__icon span {
  opacity: 1;
  animation: music-bar 0.82s ease-in-out infinite;
}

.music-toggle.is-playing .music-toggle__icon span:nth-child(2) {
  animation-delay: 0.12s;
}

.music-toggle.is-playing .music-toggle__icon span:nth-child(3) {
  animation-delay: 0.24s;
}

.music-toggle__label {
  min-width: 24px;
  font-size: 0.78rem;
  line-height: 1;
  text-align: left;
}

@keyframes music-bar {
  0%,
  100% {
    transform: scaleY(0.58);
  }

  50% {
    transform: scaleY(1.22);
  }
}

.wishes {
  text-align: center;
}

.wish-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
  margin-top: 32px;
  padding: 2px 2px 14px;
  -webkit-overflow-scrolling: touch;
}

.wish-list article {
  flex: 0 0 clamp(280px, calc((100% - 24px) / 3), 372px);
  display: grid;
  align-content: space-between;
  min-height: 210px;
  padding: 24px;
  background: #efe4dc;
  scroll-snap-align: start;
  text-align: left;
}

.wish-list p {
  margin: 0 0 20px;
}

.wish-list strong {
  color: #9f5f50;
}

.reveal {
  opacity: 0;
  transform: translateY(36px);
}

@media (max-width: 820px) {
  .hero {
    min-height: 100vh;
    min-height: 100svh;
    min-height: 100dvh;
    min-height: var(--app-height, 100dvh);
    padding: 20px;
  }

  .invitation-intro {
    padding: 0;
  }

  .invitation-card {
    width: 100%;
    max-width: 100%;
    height: 100vh;
    height: 100svh;
    height: 100dvh;
    height: var(--app-height, 100dvh);
    aspect-ratio: auto;
    min-height: 100vh;
    min-height: 100svh;
    min-height: 100dvh;
    min-height: var(--app-height, 100dvh);
  }

  .invitation-card__inside,
  .invitation-card__door {
    border-top: 0;
    border-bottom: 0;
    box-shadow: none;
  }

  .invitation-card__inside {
    left: 0;
    right: 0;
    width: 100%;
  }

  .invitation-card__door {
    width: 50%;
  }

  .invitation-card__left {
    left: 0;
    right: auto;
  }

  .invitation-card__right {
    left: auto;
    right: 0;
  }

  .invitation-card__inside {
    padding: 32px 22px;
  }

  .invitation-card__inside::before {
    inset: 24px 18px;
  }

  .invitation-card__inside::after {
    inset: 34px 28px;
  }

  .invitation-card__door::after {
    inset: 24px 18px;
  }

  .hero-copy {
    margin-bottom: 28px;
  }

  .hero h1 {
    gap: 18px;
  }

  .hero-names {
    font-size: clamp(2.5rem, 13vw, 4.5rem);
    line-height: 1;
  }

  .hero-date {
    margin: 28px 0 32px;
  }

  .section {
    width: min(100% - 28px, 1120px);
    padding: 68px 0;
  }

  .countdown-section {
    grid-template-columns: repeat(2, 1fr);
    width: min(100% - 28px, 420px);
    gap: 18px 12px;
  }

  .story,
  .rsvp {
    grid-template-columns: 1fr;
  }

  .wish-list article {
    flex-basis: min(84vw, 340px);
  }

  .gallery-frame {
    min-height: min(72vh, 620px);
  }

  .gallery-frame__photo {
    width: 100%;
    height: min(72vh, 620px);
  }

  .gallery-frame__background {
    height: calc(100% + 72px);
  }

  .gallery-nav {
    width: 42px;
    height: 42px;
    font-size: 2rem;
  }

  .gallery-nav--prev {
    left: 10px;
  }

  .gallery-nav--next {
    right: 10px;
  }

  .gallery-thumbs {
    grid-auto-columns: 74px;
  }

  .timeline-item {
    grid-template-columns: 1fr;
  }

  .music-toggle {
    right: max(14px, env(safe-area-inset-right));
    bottom: max(14px, env(safe-area-inset-bottom));
  }
}
</style>
