<script setup lang="ts">
import { CalendarDays, Clock3, Hourglass, Heart } from 'lucide-vue-next'

const props = defineProps<{ side: 'nha-trai' | 'nha-gai', announcement?: boolean, guestName?: string, senderName?: string, invitationId?: string }>()
const route = useRoute()
const isParentsInvitation = computed(() => route.query.inviter === 'parents')
const guestAddress = computed(() => props.guestName || (isParentsInvitation.value ? 'quý vị' : 'bạn'))
const introTitle = computed(() => isParentsInvitation.value
  ? (props.announcement ? 'Trân trọng báo tin thành hôn của hai con' : 'Kính mời quý vị đến chung vui cùng gia đình')
  : (props.announcement ? 'Chúng tôi sắp về chung một nhà' : 'Có bạn, niềm vui thêm trọn vẹn'))
const venue = computed(() => props.side === 'nha-gai'
  ? {
      name: 'Khách sạn Sunflower',
      address: '35A phố Văn Cao, Gia Viên, Ngô Quyền, Hải Phòng',
      mapUrl: 'https://maps.app.goo.gl/Bs94Nto5M7RSk3Co9'
    }
  : {
      name: 'Phan Anh Palace',
      address: 'Số 1 Nguyễn Hữu Cầu, phường Hải Dương, TP.Hải Phòng',
      mapUrl: 'https://maps.app.goo.gl/hwKzwyvfCyopvHvS6'
    })

const countdownIcons = [CalendarDays, Clock3, Hourglass, Heart]
const siteUrl = 'https://duonghawedding.io.vn/'
const pageUrl = computed(() => `${siteUrl}${props.announcement ? 'bao-hy' : props.side}${props.guestName && route.params.id ? `/${encodeURIComponent(String(route.params.id))}` : ''}${isParentsInvitation.value ? '?inviter=parents' : ''}`)
const socialImageUrl = `${siteUrl}photos/og-wedding.png?v=3`
const pageTitle = computed(() => props.announcement ? 'Báo hỷ Đình Dương & Thu Hà' : 'Thiệp cưới Đình Dương & Thu Hà')
const weddingDate = computed(() => new Date(props.side === 'nha-gai'
  ? '2026-11-28T10:00:00+07:00'
  : '2026-11-29T10:00:00+07:00'))
const weddingDateText = computed(() => props.side === 'nha-gai' ? '28.11.2026' : '29.11.2026')
const weddingDateTimeText = computed(() => props.side === 'nha-gai'
  ? '10:00, Thứ Bảy, 28.11.2026'
  : '10:00, Chủ nhật, 29.11.2026')
const pageDescription = computed(() => isParentsInvitation.value
  ? (props.announcement
      ? `Gia đình chúng tôi trân trọng báo tin lễ thành hôn của hai con Đình Dương và Thu Hà sẽ được tổ chức vào ngày ${weddingDateText.value}. Kính gửi tin vui đến quý vị cùng lời cảm ơn chân thành.`
      : `Gia đình chúng tôi trân trọng kính mời quý vị đến chung vui trong lễ thành hôn của hai con Đình Dương và Thu Hà, vào ${weddingDateTimeText.value}.`)
  : props.announcement
  ? `Đình Dương và Thu Hà trân trọng báo hỷ. Lễ thành hôn của chúng tôi sẽ được tổ chức vào ngày ${weddingDateText.value}. Xin chia sẻ niềm vui này cùng gia đình, người thân và bạn bè gần xa.`
  : `Trân trọng kính mời bạn đến chung vui trong ngày thành hôn của Đình Dương và Thu Hà, ngày ${weddingDateTimeText.value}.`)

useSeoMeta({
  title: pageTitle,
  description: () => pageDescription.value,
  ogTitle: pageTitle,
  ogDescription: () => pageDescription.value,
  ogType: 'website',
  ogUrl: () => pageUrl.value,
  ogSiteName: 'Đình Dương & Thu Hà',
  ogLocale: 'vi_VN',
  ogImage: socialImageUrl,
  ogImageAlt: 'Ảnh cưới của Đình Dương và Thu Hà',
  ogImageType: 'image/png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image',
  twitterTitle: pageTitle,
  twitterDescription: () => pageDescription.value,
  twitterImage: socialImageUrl,
  twitterImageAlt: 'Ảnh cưới của Đình Dương và Thu Hà'
})

useHead({
  link: [
    { rel: 'canonical', href: pageUrl },
    { rel: 'icon', type: 'image/svg+xml', href: '/logo/dh-wedding-logo.svg?v=2' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/logo/favicon-32.png?v=2' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/logo/favicon-16.png?v=2' },
    { rel: 'shortcut icon', type: 'image/x-icon', href: '/favicon.ico?v=2' },
    { rel: 'apple-touch-icon', sizes: '512x512', href: '/logo/favicon-512.png?v=2' }
  ]
})

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

const now = ref(new Date())
const backgroundMusic = ref<HTMLAudioElement | null>(null)
const invitationIntro = ref<HTMLElement | null>(null)
const isMusicPlaying = ref(false)
const hasAudioError = ref(false)
const hasPrimedBackgroundMusic = ref(false)
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
  guestName: props.guestName || '',
  wishMessage: '',
  attendanceStatus: props.announcement ? 'not_attending' : 'attending',
  guestCount: props.announcement ? 0 : 2
})

const hasSavedResponse = ref(false)
if (props.invitationId) {
  const { data: saved, error } = await useFetch<{ response: RsvpForm | null }>(`/api/invitations/${encodeURIComponent(props.invitationId)}/response`)
  if (error.value) {
    throw createError({ statusCode: error.value.statusCode || 500, statusMessage: 'Không thể tải lời chúc đã gửi. Vui lòng thử lại.' })
  }
  if (saved.value?.response) {
    const previous = saved.value.response
    form.guestName = previous.guestName
    form.wishMessage = previous.wishMessage || ''
    form.attendanceStatus = previous.attendanceStatus === 'attending' ? 'attending' : 'not_attending'
    form.guestCount = previous.guestCount
    hasSavedResponse.value = true
  }
}

const { data: galleryImages, status: galleryStatus, error: galleryError, refresh: refreshGallery } = await useFetch<string[]>('/api/gallery', {
  lazy: true,
  default: () => []
})
const activeGalleryIndex = ref(0)
const activeGalleryImage = computed(() => galleryImages.value[activeGalleryIndex.value])
const gallerySlideDirection = ref(1)
const galleryAspectRatio = ref(2 / 3)
let galleryTouch: { x: number, y: number, vertical: boolean } | undefined

function startGallerySwipe(event: TouchEvent) {
  galleryTouch = undefined
  if (event.touches.length !== 1 || (event.target as HTMLElement).closest('button')) return
  const touch = event.touches[0]!
  galleryTouch = { x: touch.clientX, y: touch.clientY, vertical: false }
}

function moveGallerySwipe(event: TouchEvent) {
  if (event.touches.length !== 1) {
    galleryTouch = undefined
    return
  }
  if (!galleryTouch) return
  const touch = event.touches[0]!
  const dx = Math.abs(touch.clientX - galleryTouch.x)
  const dy = Math.abs(touch.clientY - galleryTouch.y)
  if (dy > 12 && dy > dx) galleryTouch.vertical = true
}

function endGallerySwipe(event: TouchEvent) {
  const start = galleryTouch
  galleryTouch = undefined
  if (!start || start.vertical || event.touches.length || !event.changedTouches.length) return
  const touch = event.changedTouches[0]!
  const dx = touch.clientX - start.x
  const dy = touch.clientY - start.y
  if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.5) return
  if (dx < 0) showNextGalleryImage()
  else showPreviousGalleryImage()
}

function updateGalleryAspectRatio(event: Event) {
  const image = event.target as HTMLImageElement
  if (image.getAttribute('src') !== activeGalleryImage.value || !image.naturalHeight) return
  galleryAspectRatio.value = image.naturalWidth / image.naturalHeight
}

const { data: wishes, refresh: refreshWishes } = await useFetch<Wish[]>('/api/wishes', {
  default: () => []
})

const wishList = ref<HTMLElement | null>(null)
const wishesPerView = ref(3)
const wishAutoplay = ref(true)
const wishHovered = ref(false)
let wishTimer: ReturnType<typeof window.setInterval> | undefined
let wishInteractedAt = 0
let wishViewportWidth = 0

function wishStride() {
  return wishList.value ? (wishList.value.clientWidth + 12) / wishesPerView.value : 0
}

function moveWish(direction: number, manual = true) {
  if (!wishList.value) return
  if (manual) wishInteractedAt = Date.now()
  const last = Math.max(0, wishes.value.length - wishesPerView.value)
  const current = Math.round(wishList.value.scrollLeft / wishStride())
  const next = current + direction > last ? 0 : current + direction < 0 ? last : current + direction
  wishList.value.scrollTo({ left: next * wishStride(), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}

function resizeWishes() {
  const perView = isMobileViewport() ? 1 : 3
  const width = wishList.value?.clientWidth || 0
  if (perView === wishesPerView.value && width === wishViewportWidth) return
  wishesPerView.value = perView
  wishViewportWidth = width
  wishList.value?.scrollTo({ left: 0, behavior: 'instant' })
}

onMounted(() => {
  resizeWishes()
  wishAutoplay.value = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.addEventListener('resize', resizeWishes)
  wishTimer = window.setInterval(() => {
    const list = wishList.value
    if (!list || !isIntroOpen.value || !wishAutoplay.value || wishHovered.value || document.hidden
      || Date.now() - wishInteractedAt < 6000 || list.parentElement?.contains(document.activeElement)
      || wishes.value.length <= wishesPerView.value) return
    const bounds = list.getBoundingClientRect()
    if (bounds.top < window.innerHeight && bounds.bottom > 0) moveWish(1, false)
  }, 4500)
})

onBeforeUnmount(() => {
  if (wishTimer) window.clearInterval(wishTimer)
  window.removeEventListener('resize', resizeWishes)
})

const timeline = [
  {
    time: '10:00',
    title: 'Đón khách',
    text: 'Cùng lưu lại những khung hình đầu tiên tại khu vực welcome.'
  },
  {
    time: '11:00',
    title: 'Lễ thành hôn',
    text: 'Khoảnh khắc trao nhẫn và lời hẹn ước trước gia đình, bạn bè.'
  },
  {
    time: '11:30',
    title: 'Tiệc cưới trưa',
    text: 'Dùng bữa, nâng ly và chia sẻ niềm vui trong không gian ấm cúng.'
  }
]

const countdown = computed<CountdownItem[]>(() => {
  const diff = Math.max(weddingDate.value.getTime() - now.value.getTime(), 0)
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
    return hasSavedResponse.value ? 'Đang lưu...' : 'Đang gửi...'
  }

  if (hasSavedResponse.value) return 'Sửa lời chúc'

  return !props.announcement && form.attendanceStatus === 'attending' ? 'Gửi xác nhận tham dự' : 'Gửi lời chúc'
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
        attendanceStatus: props.announcement ? 'not_attending' : form.attendanceStatus,
        guestCount: !props.announcement && form.attendanceStatus === 'attending' ? form.guestCount : 0,
        invitationSide: props.side,
        invitationId: props.invitationId
      }
    })

    if (props.invitationId) {
      hasSavedResponse.value = true
    }
    else {
      form.guestName = ''
      form.wishMessage = ''
      form.attendanceStatus = props.announcement ? 'not_attending' : 'attending'
      form.guestCount = props.announcement ? 0 : 2
    }
    rsvpStatusTone.value = 'success'
    rsvpStatusMessage.value = `Cảm ơn ${guestAddress.value}!`
    await refreshWishes()
  }
  catch (error) {
    rsvpStatusTone.value = 'error'
    rsvpStatusMessage.value = error instanceof Error ? error.message : (props.announcement ? 'Không thể gửi lời chúc lúc này.' : 'Không thể gửi xác nhận lúc này.')
  }
  finally {
    isSubmittingRsvp.value = false
  }
}

function showPreviousGalleryImage() {
  gallerySlideDirection.value = -1
  if (!galleryImages.value.length) return
  activeGalleryIndex.value = (activeGalleryIndex.value - 1 + galleryImages.value.length) % galleryImages.value.length
}

function showNextGalleryImage() {
  gallerySlideDirection.value = 1
  if (!galleryImages.value.length) return
  activeGalleryIndex.value = (activeGalleryIndex.value + 1) % galleryImages.value.length
}

function showGalleryImage(index: number) {
  if (index === activeGalleryIndex.value) {
    return
  }

  gallerySlideDirection.value = index > activeGalleryIndex.value ? 1 : -1
  activeGalleryIndex.value = index
}

async function playBackgroundMusic() {
  const audio = backgroundMusic.value

  if (!audio || hasAudioError.value) {
    return
  }

  try {
    audio.volume = 0.36
    audio.muted = false

    if (!audio.paused) {
      isMusicPlaying.value = true
      return
    }

    await audio.play()
    isMusicPlaying.value = true
  }
  catch {
    isMusicPlaying.value = false
  }
}

async function primeBackgroundMusic() {
  const audio = backgroundMusic.value

  if (!audio || hasAudioError.value || hasPrimedBackgroundMusic.value) {
    return
  }

  try {
    audio.volume = 0.36
    audio.muted = true
    await audio.play()
    hasPrimedBackgroundMusic.value = true
    isMusicPlaying.value = false
  }
  catch {
    hasPrimedBackgroundMusic.value = false
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

function handleAudioPlay() {
  isMusicPlaying.value = !(backgroundMusic.value?.muted ?? false)
}

function handleAudioPause() {
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
  void primeBackgroundMusic()

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
    const photo = frame?.querySelector<HTMLElement>('.gallery-frame__photo')
    const activeThumb = document.querySelector<HTMLElement>('.gallery-thumb.is-active')

    const thumbStrip = activeThumb?.closest<HTMLElement>('.gallery-thumbs')
    if (activeThumb && thumbStrip) {
      const stripBounds = thumbStrip.getBoundingClientRect()
      const thumbBounds = activeThumb.getBoundingClientRect()
      const centeredLeft = thumbStrip.scrollLeft + thumbBounds.left - stripBounds.left
        - thumbStrip.clientLeft + (thumbBounds.width - thumbStrip.clientWidth) / 2
      thumbStrip.scrollTo({
        left: Math.max(0, Math.min(centeredLeft, thumbStrip.scrollWidth - thumbStrip.clientWidth)),
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
      })
    }

    if (!frame || !photo) {
      return
    }

    $gsap.killTweensOf(activeThumb ? [photo, activeThumb] : [photo])
    $gsap.timeline({ defaults: { ease: 'power3.out' } })
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
      @play="handleAudioPlay"
      @pause="handleAudioPause"
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
        :aria-label="announcement ? 'Mở thiệp báo hỷ' : 'Mở thiệp cưới'"
      >
        <span class="invitation-card__inside">
          <span class="invitation-card__ornament" aria-hidden="true" />
          <span class="invitation-card__script">{{ announcement ? 'Trân trọng báo hỷ' : 'Wedding invitation' }}</span>
          <span class="invitation-card__names">Đình Dương<br>Thu Hà</span>
          <span class="invitation-card__date">{{ weddingDateText }}</span>
          <span class="invitation-card__hint">Chạm để mở thiệp</span>
        </span>
        <span class="invitation-card__door invitation-card__left" aria-hidden="true" />
        <span class="invitation-card__door invitation-card__right" aria-hidden="true" />
        <span class="invitation-card__seal" aria-hidden="true">D<br>&amp;<br>H</span>
      </button>
    </div>

    <section class="hero">
      <picture>
        <source
          media="(min-width: 821px)"
          srcset="https://pub-3395f4cf2cdf4d4f8c9fe93858d7da4a.r2.dev/FTW09171.jpg.webp"
        >
      <img
        class="hero-photo"
        src="https://pub-3395f4cf2cdf4d4f8c9fe93858d7da4a.r2.dev/FTW08989.jpg.webp"
        alt="Đình Dương và Thu Hà trong trang phục cưới"
      >
      </picture>
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
            <span class="invitation-card__date">{{ weddingDateText }}</span>
            <span class="invitation-card__hint">Chạm để mở thiệp</span>
          </span>
          <span class="invitation-card__door invitation-card__left" aria-hidden="true" />
          <span class="invitation-card__door invitation-card__right" aria-hidden="true" />
          <span class="invitation-card__seal" aria-hidden="true">D<br>&amp;<br>H</span>
        </button>
      </div>

      <div class="hero-copy" :class="{ 'hero-copy--personal': guestName }">
        <h1>
          <span class="hero-script">{{ announcement ? 'Báo hỷ' : 'Wedding' }}</span>
          <span class="hero-names">Đình Dương<br>Thu Hà</span>
        </h1>
        <p class="hero-date">{{ announcement ? weddingDateText : weddingDateTimeText }}</p>
        <div v-if="guestName" class="recipient-invitation">
          <div class="recipient-divider" aria-hidden="true"><span /><div class="recipient-hearts"><Heart /><Heart /></div><span /></div>
          <div class="recipient-plaque">
            <svg class="recipient-frame" viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden="true">
              <path d="M38 1 H362 Q377 1 379 17 C405 24 405 66 379 73 Q377 89 362 89 H38 Q23 89 21 73 C-5 66 -5 24 21 17 Q23 1 38 1 Z" />
            </svg>
            <p class="recipient-label">Trân trọng kính mời</p>
            <p class="recipient-name">{{ guestName }}</p>
          </div>
        </div>
      </div>
    </section>

    <section :id="announcement ? 'announcement' : undefined" class="intro section reveal">
      <p class="script">{{ guestName ? 'Ngày chung đôi' : announcement ? (isParentsInvitation ? 'Trân trọng báo hỷ' : 'Thương gửi tin vui') : 'Trân trọng kính mời' }}</p>
      <h2 style="line-height: 1.2;">{{ introTitle }}</h2>
      <template v-if="isParentsInvitation">
        <p>Gia đình chúng tôi {{ announcement ? 'trân trọng báo tin lễ thành hôn của hai con' : 'trân trọng kính mời quý vị đến dự lễ thành hôn của hai con' }}<br><strong>Đình Dương &amp; Thu Hà</strong><br>{{ announcement ? 'sẽ được tổ chức vào ngày' : 'được tổ chức vào' }} {{ announcement ? weddingDateText : weddingDateTimeText }}.</p>
        <p v-if="announcement">Gia đình chúng tôi xin được chia sẻ niềm vui này cùng quý vị. Dù cách trở đường xa, tình cảm và những lời chúc phúc của quý vị luôn là món quà quý giá dành cho hai con và gia đình.</p>
        <p v-else>Sự hiện diện và lời chúc phúc của quý vị là niềm vinh hạnh của gia đình chúng tôi, đồng thời là món quà ý nghĩa dành cho hai con trong ngày thành hôn.</p>
      </template>
      <template v-else-if="announcement">
        <p>Đình Dương và Thu Hà trân trọng báo hỷ.<br>Lễ thành hôn của chúng tôi sẽ được tổ chức vào ngày {{ weddingDateText }}.</p>
        <p>Chúng tôi xin gửi tin vui này đến gia đình, người thân và bạn bè gần xa. Dù chưa thể gặp nhau trong ngày cưới, chúng tôi luôn trân quý tình cảm và những lời chúc phúc của bạn.</p>
      </template>
      <p v-else>
        Chúng mình sắp bắt đầu một chặng đường mới, cùng nhau xây dựng một mái ấm nhỏ.
        Mong được gặp bạn trong ngày cưới, cùng trò chuyện, nâng ly và lưu lại những kỷ niệm thật đẹp.
      </p>
    </section>

    <section v-if="!announcement" class="countdown-section reveal" aria-label="Đồng hồ đếm ngược">
      <div
        v-for="(item, index) in countdown"
        :key="item.label"
        class="countdown-box"
        :data-countdown-index="index"
      >
        <component :is="countdownIcons[index]" class="countdown-icon" :size="21" :stroke-width="1.25" aria-hidden="true" />
        <div class="countdown-digits" :aria-label="`${item.value} ${item.label}`">
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
          src="https://pub-3395f4cf2cdf4d4f8c9fe93858d7da4a.r2.dev/FTW09694.jpg.webp"
          alt="Đình Dương và Thu Hà cùng nhau trong ngày chụp cưới"
        >
      </div>
      <div class="story-copy reveal">
        <p class="eyebrow">{{ isParentsInvitation ? 'Câu chuyện của hai con' : 'Our story' }}</p>
        <h2 style="line-height: 1.2;">Một lời hẹn, một mùa thương</h2>
        <p v-if="isParentsInvitation">Từ những ngày đầu gặp gỡ đến khi quyết định cùng nhau xây dựng tổ ấm, Đình Dương và Thu Hà đã có một hành trình đầy yêu thương. Gia đình chúng tôi hạnh phúc khi được chứng kiến hai con bước sang một chặng đường mới.</p>
        <p v-else>
          Chúng tôi gặp nhau trong những ngày rất bình thường, rồi cùng nhau
          gom góp từng khoảnh khắc nhỏ thành một câu chuyện đủ đầy.
        </p>
        <p>
          Ngày cưới là nơi câu chuyện ấy được kể lại bằng nụ cười, ánh nến và
          lời chúc phúc của những người thân yêu.
        </p>
      </div>
    </section>

    <section v-if="!announcement" class="timeline section reveal">
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
      <p v-if="galleryStatus === 'pending'" role="status">Đang tải ảnh...</p>
      <div v-else-if="galleryError" role="alert">
        <p>Chưa tải được album ảnh.</p>
        <button type="button" @click="refreshGallery()">Thử lại</button>
      </div>
      <p v-else-if="!galleryImages.length">Album chưa có ảnh.</p>
      <div v-show="galleryImages.length" class="gallery-slider reveal">
        <div
          v-if="activeGalleryImage"
          class="gallery-frame"
          :class="{ 'is-portrait': galleryAspectRatio < 1 }"
          :style="{ '--gallery-ratio': galleryAspectRatio }"
          @touchstart.passive="startGallerySwipe"
          @touchmove.passive="moveGallerySwipe"
          @touchend.passive="endGallerySwipe"
          @touchcancel="galleryTouch = undefined"
        >
          <img
            class="gallery-frame__backdrop"
            :src="activeGalleryImage"
            alt=""
            aria-hidden="true"
          >
          <img
            class="gallery-frame__photo"
            draggable="false"
            :key="activeGalleryImage"
            :src="activeGalleryImage"
            @load="updateGalleryAspectRatio"
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
            <img :src="image" alt="" loading="lazy" decoding="async">
          </button>
        </div>
      </div>
    </section>

    <section v-if="!announcement" class="venue section reveal">
      <p class="script">Địa điểm</p>
      <h2 style="line-height: 1.2;">{{ venue.name }}</h2>
      <p>{{ venue.address }}</p>
      <a :href="venue.mapUrl" target="_blank" rel="noreferrer">Xem bản đồ</a>
    </section>

    <section id="rsvp" class="rsvp section">
      <div class="rsvp-copy reveal">
        <p class="eyebrow">{{ announcement ? 'Lời chúc phúc' : 'Xác nhận tham dự' }}</p>
        <h2>{{ announcement ? 'Gửi lời chúc đến cô dâu và chú rể' : 'Gửi lời chúc và xác nhận tham dự' }}</h2>
        <p v-if="isParentsInvitation && announcement">Gia đình chúng tôi trân trọng đón nhận những lời chúc phúc của quý vị dành cho hai con. Kính mời quý vị để lại lời chúc và cùng chia sẻ niềm vui với gia đình.</p>
        <p v-else-if="isParentsInvitation">Để gia đình chuẩn bị đón tiếp chu đáo, kính mong quý vị xác nhận số lượng người tham dự. Quý vị cũng có thể gửi lời chúc phúc đến hai con tại đây.</p>
        <p v-else-if="announcement">Những lời chúc từ bạn là món quà ý nghĩa đối với chúng tôi trong ngày thành hôn. Bạn có thể gửi lời chúc tại đây để cùng chia sẻ niềm vui với chúng tôi.</p>
        <p v-else>
          Bạn giúp chúng tôi chuẩn bị chu đáo hơn bằng cách xác nhận số lượng
          người tham dự trước ngày cưới.
        </p>
      </div>

      <form class="rsvp-form reveal" @submit.prevent="submitRsvp">
        <label>
          {{ isParentsInvitation ? 'Họ và tên quý vị' : 'Tên của bạn' }}
          <input v-model="form.guestName" type="text" maxlength="50" required placeholder="">
        </label>

        <label>
          Lời chúc
          <textarea
            v-model="form.wishMessage"
            :required="announcement"
            maxlength="200"
            rows="4"
            placeholder="Gửi một lời chúc nhỏ đến cô dâu chú rể"
          />
        </label>

        <fieldset v-if="!announcement">
          <legend>{{ isParentsInvitation ? 'Quý vị có thể tham dự tiệc cưới không?' : 'Bạn có tham dự tiệc không?' }}</legend>
          <label class="radio-row">
            <input v-model="form.attendanceStatus" type="radio" value="attending">
            Có, tôi sẽ tham dự
          </label>
          <label class="radio-row">
            <input v-model="form.attendanceStatus" type="radio" value="not_attending">
            Rất tiếc, tôi không tham dự được
          </label>
        </fieldset>

        <label v-if="!announcement && form.attendanceStatus === 'attending'">
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
      <h2>{{ isParentsInvitation ? 'Lời chúc dành cho hai con' : 'Thương gửi đến hai bạn' }}</h2>
      <div
        ref="wishList"
        class="wish-list"
        role="region"
        aria-roledescription="carousel"
        aria-label="Lời chúc của khách mời"
        tabindex="0"
        @pointerenter="wishHovered = $event.pointerType === 'mouse'"
        @pointerleave="wishHovered = false"
        @pointerdown="wishInteractedAt = Date.now()"
        @touchend="wishInteractedAt = Date.now()"
        @wheel.passive="wishInteractedAt = Date.now()"
        @keydown.left.prevent="moveWish(-1)"
        @keydown.right.prevent="moveWish(1)"
      >
        <article v-for="(wish, index) in wishes" :key="wish.id" role="group" aria-roledescription="slide" :aria-label="`${index + 1} / ${wishes.length}`">
          <div class="wish-quote" aria-hidden="true"><span />“<span /></div>
          <p>{{ wish.message }}</p>
          <strong>{{ wish.name }}</strong>
        </article>
      </div>
    </section>
    <footer v-if="announcement" class="intro section reveal">
      <p class="script">Lời cảm ơn</p>
      <h2 style="line-height: 1.2;">Trân quý từng lời chúc phúc</h2>
      <template v-if="isParentsInvitation">
        <p>Gia đình chúng tôi chân thành cảm ơn quý vị đã dành tình cảm và gửi lời chúc phúc đến hai con. Sự quan tâm của quý vị là niềm động viên quý báu đối với hai con và gia đình trong ngày thành hôn.</p>
        <p>Kính chúc quý vị cùng gia đình luôn mạnh khỏe, bình an và hạnh phúc.</p>
        <p>Trân trọng,<br>{{ side === 'nha-gai' ? 'Gia đình nhà gái' : 'Gia đình nhà trai' }}</p>
      </template>
      <template v-else>
        <p>Chân thành cảm ơn bạn đã dành tình cảm và gửi lời chúc phúc đến chúng tôi. Dù ở gần hay xa, sự quan tâm của bạn luôn góp phần làm nên niềm vui trọn vẹn trong ngày thành hôn.</p>
        <p>Hẹn gặp bạn trong một dịp gần nhất để cùng chia sẻ những kỷ niệm của ngày vui.</p>
        <p>Trân trọng,<br>Đình Dương &amp; Thu Hà</p>
      </template>
    </footer>
  </main>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&family=Cormorant+Upright:wght@500;600;700&family=Great+Vibes&family=Playfair+Display:wght@500;600;700&display=swap&subset=vietnamese");

.recipient-invitation {
  --recipient-gold: #e8d5b6;
  width: min(100%, 470px);
  margin: 0;
  padding-inline: 10px;
  box-sizing: border-box;
  text-align: center;
}
.recipient-divider { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 14px; color: #f4e5c9; }
.recipient-divider > span { width: 52px; height: 1px; background: currentColor; }
.recipient-hearts { position: relative; width: 34px; height: 26px; }
.recipient-hearts svg { position: absolute; top: 2px; width: 23px; height: 23px; stroke-width: 1.4; fill: none; }
.recipient-hearts svg:first-child { left: 0; transform: rotate(-14deg); }
.recipient-hearts svg:last-child { right: 0; transform: rotate(14deg); }
.recipient-plaque { position: relative; display: grid; align-content: center; gap: 8px; min-height: 90px; padding: 16px 26px; isolation: isolate; }
.recipient-frame { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1; overflow: visible; fill: rgb(26 20 15 / .28); stroke: var(--recipient-gold); stroke-width: 1.4; pointer-events: none; }
.recipient-frame path { vector-effect: non-scaling-stroke; }
.recipient-label { margin: 0; font-family: "Be Vietnam Pro", sans-serif; font-size: clamp(.56rem, 1.3vw, .68rem); font-weight: 600; line-height: 1.6; letter-spacing: .32em; text-transform: uppercase; color: #fff4e1; }
.recipient-name { margin: 0; font-family: "Cormorant Garamond", "Times New Roman", serif; font-size: clamp(1.45rem, 3vw, 2rem); font-style: italic; font-weight: 600; line-height: 1.18; color: #fffaf0; overflow-wrap: anywhere; text-shadow: 0 2px 8px rgb(0 0 0 / .35); }
@media (max-width: 600px) {
  .recipient-invitation { width: min(100%, 470px); padding-inline: 10px; }
  .recipient-plaque { min-height: 80px; padding: 14px 18px; }
  .recipient-label { letter-spacing: .25em; }
}

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

.hero-copy--personal h1,
.hero-copy--personal .hero-date {
  width: min(100%, 470px);
  text-align: center;
}

.hero-copy--personal .hero-date {
  margin: 28px 0 24px;
}

.hero-copy--personal .recipient-divider {
  margin-bottom: 18px;
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
  line-height: 1.2;
  letter-spacing: 0;
}

p {
  line-height: 1.8;
}

.rsvp-copy,
.story-copy,
.section-heading {
  min-width: 0;
}

.rsvp-copy h2,
.story-copy h2,
.section-heading h2,
.wishes h2 {
  line-height: 1.25;
  text-wrap: pretty;
}

.rsvp-copy > h2 + p,
.story-copy > h2 + p {
  margin-top: 24px;
}

.rsvp-form > button[type="submit"] {
  padding: 14px 24px;
  line-height: 1.5;
}

.intro p:last-child,
.story-copy p,
.rsvp-copy p,
.venue p {
  color: #756760;
}

.countdown-section {
  width: min(100% - 24px, 480px);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 0 auto;
  padding: 12px 0 24px;
}

.countdown-box {
  display: grid;
  grid-template-rows: 22px 42px 1px 20px;
  gap: 6px;
  min-width: 0;
  height: 128px;
  place-items: center;
  padding: 12px 4px;
  border: 1px solid #edcb98;
  border-radius: 8px;
  background: #fffdf8;
  box-shadow: 0 5px 12px rgb(157 116 54 / 10%);
  perspective: 900px;
}

.countdown-icon {
  color: #dcb474;
}

.countdown-digits::after {
  content: none;
}

.countdown-label::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 1px;
  background: #e5bb7e;
  top: -7px;
  left: calc(50% - 8px);
}

.countdown-digits {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  min-width: 100%;
}

.countdown-digit {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.58em;
  height: 42px;
  font-size: 36px;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: #211a16;
  transform-style: preserve-3d;
}

.countdown-digit__number {
  position: relative;
  z-index: 2;
  display: block;
  font-family: var(--number-font);
  font-size: inherit;
  font-weight: 700;
  line-height: 1;
  transform: translateY(-0.03em);
  will-change: transform, opacity;
}

.countdown-label {
  position: relative;
  grid-row: 4;
  color: #92795e;
  font-family: var(--number-font);
  font-size: 14px;
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
  touch-action: pan-y pinch-zoom;
  position: relative;
  display: grid;
  place-items: center;
  height: min(72vh, 760px);
  height: min(72svh, 760px);
  min-height: 0;
  overflow: hidden;
  background: transparent;
}

.gallery-frame__photo {
  display: block;
  grid-area: 1 / 1;
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: contain;
}

.gallery-frame__backdrop {
  display: block;
  position: absolute;
  inset: -32px;
  width: calc(100% + 64px);
  height: calc(100% + 64px);
  object-fit: cover;
  filter: blur(24px) brightness(0.72);
  pointer-events: none;
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
  scrollbar-width: none;
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
  padding: 0;
  -webkit-overflow-scrolling: touch;
}

.wish-list article {
  flex: 0 0 calc((100% - 24px) / 3);
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 240px;
  padding: 24px 26px 28px;
  border: 1px solid #d5b39e;
  border-radius: 24px;
  background: linear-gradient(135deg, #fcf7f2, #f4e9e0);
  box-shadow: inset 0 0 0 2px rgb(255 255 255 / .8);
  scroll-snap-align: start;
  text-align: left;
  overflow-wrap: anywhere;
}

.wish-list::-webkit-scrollbar { display: none; }
.wish-list:focus-visible { outline: 2px solid #9f5f50; outline-offset: 4px; }

.wish-list p {
  margin: 0 0 24px;
  color: #392e25;
  font-family: "Cormorant Garamond", "Times New Roman", serif;
  font-size: 1.4rem;
  font-style: italic;
  font-weight: 500;
  line-height: 1.6;
  white-space: pre-line;
}

.wish-list strong {
  display: block;
  color: #a55d47;
  font-family: "Cormorant Garamond", "Times New Roman", serif;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.25;
}

.wish-list strong::before {
  display: block;
  width: 44%;
  height: 1px;
  margin-bottom: 16px;
  background: #d5b39e;
  content: "";
}

.wish-quote {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 40px;
  margin-bottom: 20px;
  color: #b88e74;
  font-family: "Cormorant Garamond", "Times New Roman", serif;
  font-size: 5rem;
  line-height: 1;
  padding-top: 24px;
}

.wish-quote span {
  width: 22%;
  height: 1px;
  margin-top: -24px;
  background: currentColor;
}

.reveal {
  opacity: 0;
  transform: translateY(36px);
}

@media (min-width: 821px) {
  .gallery-frame:not(.is-portrait) .gallery-frame__backdrop {
    display: none;
  }

  .gallery-frame.is-portrait {
    --portrait-width: min(100%, calc(min(72vh, 760px) * var(--gallery-ratio)));
    --portrait-width: min(100%, calc(min(72svh, 760px) * var(--gallery-ratio)));
    background: #282421;
  }

  .gallery-frame.is-portrait .gallery-frame__photo {
    width: var(--portrait-width);
  }

  .gallery-frame.is-portrait .gallery-nav--prev {
    left: max(12px, calc((100% - var(--portrait-width)) / 2 - 60px));
  }

  .gallery-frame.is-portrait .gallery-nav--next {
    right: max(12px, calc((100% - var(--portrait-width)) / 2 - 60px));
  }

  .section {
    padding-block: 48px;
  }

  .intro {
    padding-top: 72px;
    padding-bottom: 32px;
  }

  .intro > p:last-child,
  .story-copy > p:last-child,
  .rsvp-copy > p:last-child {
    margin-bottom: 0;
  }

  .section > .script,
  .section-heading > .script {
    margin-bottom: 20px;
  }

  .section-heading {
    margin-bottom: 28px;
  }

  .timeline-list,
  .wish-list {
    margin-top: 28px;
  }

  .gallery {
    padding-bottom: 64px;
  }

  .venue {
    padding-block: 56px;
  }

  .rsvp {
    padding-top: 64px;
  }

  .wishes {
    padding-bottom: 72px;
  }

  .countdown-section {
    width: min(100% - 48px, 720px);
    gap: 16px;
    padding: 8px 0 12px;
  }

  .countdown-box {
    height: 170px;
    grid-template-rows: 28px 58px 1px 24px;
    gap: 7px;
    padding: 18px 12px;
  }

  .countdown-icon {
    width: 26px;
    height: 26px;
  }

  .countdown-digit {
    height: 58px;
    font-size: 50px;
  }

  .countdown-label {
    font-size: 18px;
    line-height: 24px;
  }

  .countdown-label::before {
    width: 22px;
    left: calc(50% - 11px);
    top: -8px;
  }
}

@media (max-width: 820px) {
  .hero {
    min-height: 100vh;
    min-height: 100svh;
    min-height: 100dvh;
    min-height: var(--app-height, 100dvh);
    padding: 32px 24px calc(92px + env(safe-area-inset-bottom, 0px));
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
    margin-bottom: 0;
  }

  .hero-copy--personal h1,
  .hero-copy--personal .hero-date {
    width: min(100%, 420px);
  }

  .hero h1 {
    gap: 16px;
  }

  .hero-script {
    font-size: clamp(4.2rem, 17vw, 5rem);
    line-height: .9;
  }

  .hero-names {
    font-size: clamp(2.5rem, 11vw, 3.25rem);
    line-height: 1.04;
  }

  .hero-date {
    margin: 22px 0 24px;
    font-size: clamp(.9rem, 3.5vw, 1.05rem);
    line-height: 1.5;
  }

  .hero-copy--personal .hero-date {
    margin: 24px 0 20px;
  }

  .recipient-invitation {
    width: min(100%, 420px);
    margin: 0;
    padding-inline: 0;
  }

  .recipient-divider {
    margin-bottom: 16px;
  }

  .recipient-plaque {
    min-height: 84px;
    padding: 14px 18px;
  }

  .recipient-name {
    font-size: clamp(1.4rem, 5.8vw, 1.75rem);
    line-height: 1.25;
  }

  .section {
    width: min(100% - 48px, 1120px);
    padding: 40px 0;
  }

  .timeline {
    padding-block: 16px;
  }

  .timeline + .gallery {
    padding-top: 24px;
  }

  .intro {
    padding-top: 48px;
    padding-bottom: 24px;
  }

  .intro > p:last-child,
  .story-copy > p:last-child,
  .rsvp-copy > p:last-child {
    margin-bottom: 0;
  }

  .section > .script,
  .section-heading > .script {
    margin-bottom: 18px;
  }

  .section-heading {
    margin-bottom: 24px;
  }

  .timeline-list,
  .wish-list {
    margin-top: 24px;
  }

  .gallery {
    padding-bottom: 40px;
  }

  .venue {
    padding-block: 36px;
  }

  .rsvp {
    padding-top: 40px;
    padding-bottom: 16px;
  }

  .wishes {
    padding-top: 16px;
    padding-bottom: 56px;
  }


  .countdown-section {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    width: min(100% - 24px, 480px);
    gap: 8px;
    padding-block: 8px 12px;
  }

  .story,
  .rsvp {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .rsvp-form {
    min-width: 0;
    padding: 24px 20px;
    gap: 22px;
  }

  .rsvp-copy > h2 + p,
  .story-copy > h2 + p {
    margin-top: 20px;
  }

  .wish-list article {
    flex-basis: 100%;
  }

  .gallery-frame {
    height: min(70vh, 560px);
    height: min(70svh, 560px);
    min-height: 0;
    width: 100%;
    aspect-ratio: auto;
    background: transparent;
  }

  .gallery-frame__photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    box-shadow: none;
  }

  .gallery-frame {
    background: #282421;
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
    gap: 10px;
    padding: 20px;
  }

  .music-toggle {
    right: max(14px, env(safe-area-inset-right));
    bottom: max(14px, env(safe-area-inset-bottom));
  }
}
</style>
