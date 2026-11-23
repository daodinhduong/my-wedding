<script setup lang="ts">
const props = withDefaults(defineProps<{
  guestName?: string
  invitationSide?: 'nha-trai' | 'nha-gai'
  inviterRole?: 'parents' | 'couple'
  deliveryType?: 'invitation' | 'announcement'
}>(), {
  guestName: '',
  invitationSide: 'nha-trai',
  inviterRole: 'couple',
  deliveryType: 'invitation'
})

const CARD_W = 1200
const CARD_H = 1750
const CX = CARD_W / 2

const isBride = computed(() => props.invitationSide === 'nha-gai')
const isAnnouncement = computed(() => props.deliveryType === 'announcement')
const displayGuestName = computed(() => props.guestName?.trim() || 'Quý Khách & Gia Đình')

const cardTitle = computed(() => {
  if (isAnnouncement.value) return 'THIỆP BÁO HỶ'
  return isBride.value ? 'THIỆP MỜI VU QUY' : 'THIỆP MỜI THÀNH HÔN'
})

const inviteLead = computed(() => isAnnouncement.value ? 'TRÂN TRỌNG BÁO TIN ĐẾN' : 'TRÂN TRỌNG KÍNH MỜI')
const inviteSubline1 = computed(() => isBride.value
  ? 'TỚI DỰ BỮA CƠM THÂN MẬT & LỄ VU QUY'
  : 'TỚI DỰ BỮA CƠM THÂN MẬT & LỄ THÀNH HÔN')
const inviteSubline2 = 'CHUNG VUI CÙNG GIA ĐÌNH CHÚNG TÔI'
const announcementSubline = 'CHÍNH THỨC NÊN DUYÊN VỢ CHỒNG'
const announcementMessage = computed(() => props.inviterRole === 'parents'
  ? 'Tình cảm và lời chúc phúc của Quý vị luôn là món quà quý giá nhất dành cho hai con và gia đình.'
  : 'Dù chưa thể chung vui trực tiếp, tình cảm và lời chúc phúc của bạn luôn là món quà quý giá nhất.')
const footerNote = computed(() => isAnnouncement.value
  ? 'Rất mong nhận được lời chúc phúc từ Quý vị & các bạn!'
  : 'Sự hiện diện của Quý khách là niềm vinh dự của gia đình chúng tôi!')
const footerCta = computed(() => isAnnouncement.value
  ? 'TRÂN TRỌNG CẢM ƠN!'
  : 'RẤT HÂN HẠNH ĐƯỢC ĐÓN TIẾP!')

const eventInfo = computed(() => isBride.value
  ? {
      dateLine: 'THỨ BẢY | 28.11.2026',
      lunarLine: '(Tức ngày 20 tháng 10 năm Bính Ngọ)',
      leftTime: '10:00',
      leftLabel: 'Bữa cơm thân mật',
      rightTime: '11:00',
      rightLabel: 'Lễ Vu Quy',
      venueName: 'KHÁCH SẠN SUNFLOWER',
      venueAddress: '35A phố Văn Cao, Gia Viên, Ngô Quyền, Hải Phòng'
    }
  : {
      dateLine: 'CHỦ NHẬT | 29.11.2026',
      lunarLine: '(Tức ngày 21 tháng 10 năm Bính Ngọ)',
      leftTime: '10:30',
      leftLabel: 'Bữa cơm thân mật',
      rightTime: '11:00',
      rightLabel: 'Lễ Thành Hôn',
      venueName: props.inviterRole === 'parents'
        ? 'TRUNG TÂM HỘI NGHỊ - TIỆC CƯỚI PHAN ANH'
        : 'PHAN ANH PALACE',
      venueAddress: 'Số 01 Nguyễn Hữu Cầu, P. Hải Dương, TP. Hải Phòng'
    })

function wrapTextWords(text: string, maxCharsPerLine: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ['Quý Khách & Gia Đình']
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxCharsPerLine || !current) {
      current = next
    }
    else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

const layoutMetrics = computed(() => {
  const name = displayGuestName.value
  const guestFontSize = name.length > 34 ? 44 : name.length > 26 ? 54 : 64
  const maxChars = name.length > 34 ? 32 : name.length > 26 ? 26 : 22
  const guestLines = wrapTextWords(name, maxChars)
  const guestLineHeight = guestFontSize + 14
  const guestStartY = 674
  const dottedY = guestStartY + 30 + (guestLines.length - 1) * guestLineHeight
  const bodyY = dottedY + 52
  const coupleY = bodyY + 138
  const boxY = Math.max(960, coupleY + 66)
  const boxH = 472
  const footerLineY = boxY + boxH + 74
  const venueFontSize = eventInfo.value.venueName.length > 32 ? 27 : 31

  const announcementLines = wrapTextWords(announcementMessage.value, 36)
  const announcementLineHeight = 50
  const announcementCoupleY = dottedY + 112
  const announcementSublineY = announcementCoupleY + 66
  const announcementBoxY = announcementSublineY + 56
  const announcementMsgStartY = announcementBoxY + 304
  const announcementBoxH = 304 + Math.max(0, announcementLines.length - 1) * announcementLineHeight + 56
  const announcementFooterLineY = Math.max(1480, announcementBoxY + announcementBoxH + 56)

  return {
    guestFontSize,
    guestLines,
    guestLineHeight,
    guestStartY,
    dottedY,
    bodyY,
    coupleY,
    boxY,
    boxH,
    footerLineY,
    venueFontSize,
    announcementLines,
    announcementLineHeight,
    announcementCoupleY,
    announcementSublineY,
    announcementBoxY,
    announcementMsgStartY,
    announcementBoxH,
    announcementFooterLineY
  }
})

function drawFloralSpray(ctx: CanvasRenderingContext2D, x: number, y: number, scaleX: number, scaleY: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scaleX, scaleY)
  ctx.strokeStyle = '#b4956b'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(4, 214)
  ctx.bezierCurveTo(22, 146, 86, 68, 250, 14)
  ctx.stroke()

  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(52, 108)
  ctx.bezierCurveTo(96, 54, 144, 24, 198, 6)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(92, 74)
  ctx.bezierCurveTo(132, 82, 166, 78, 196, 64)
  ctx.stroke()

  const drawLeaf = (lx: number, ly: number, angle: number, len: number, wid: number) => {
    ctx.save()
    ctx.translate(lx, ly)
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(len * 0.35, -wid, len * 0.78, -wid * 0.65, len, 0)
    ctx.bezierCurveTo(len * 0.78, wid * 0.65, len * 0.35, wid, 0, 0)
    ctx.fillStyle = '#f8f2e7'
    ctx.fill()
    ctx.lineWidth = 1.6
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(4, 0)
    ctx.lineTo(len * 0.82, 0)
    ctx.lineWidth = 1.1
    ctx.stroke()
    ctx.restore()
  }

  drawLeaf(114, 58, -0.82, 54, 15)
  drawLeaf(154, 34, -0.52, 56, 15)
  drawLeaf(198, 18, -0.22, 48, 13)
  drawLeaf(126, 78, 0.24, 48, 13)
  drawLeaf(166, 70, 0.14, 42, 12)
  drawLeaf(24, 134, -1.28, 44, 12)

  ctx.save()
  ctx.translate(202, 8)
  ctx.rotate(-0.2)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(10, -10, 26, -8, 32, 0)
  ctx.bezierCurveTo(26, 8, 10, 10, 0, 0)
  ctx.fillStyle = '#fbf6ee'
  ctx.fill()
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()

  const fx = 66
  const fy = 86
  for (let i = 0; i < 5; i++) {
    ctx.save()
    ctx.translate(fx, fy)
    ctx.rotate((i * Math.PI * 2) / 5 - 0.35)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(-18, -14, -22, -40, -6, -48)
    ctx.quadraticCurveTo(0, -42, 6, -48)
    ctx.bezierCurveTo(22, -40, 18, -14, 0, 0)
    ctx.fillStyle = '#fbf7ef'
    ctx.fill()
    ctx.lineWidth = 1.6
    ctx.stroke()
    ctx.restore()
  }

  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6
    ctx.beginPath()
    ctx.moveTo(fx, fy)
    ctx.lineTo(fx + Math.cos(a) * 12, fy + Math.sin(a) * 12)
    ctx.lineWidth = 1.1
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(fx + Math.cos(a) * 13, fy + Math.sin(a) * 13, 2, 0, Math.PI * 2)
    ctx.fillStyle = '#b4956b'
    ctx.fill()
  }

  ctx.beginPath()
  ctx.arc(fx, fy, 5.5, 0, Math.PI * 2)
  ctx.fillStyle = '#e7d7bf'
  ctx.fill()
  ctx.lineWidth = 1.4
  ctx.stroke()

  ctx.restore()
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawVectorHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / 24, size / 24)
  ctx.beginPath()
  ctx.moveTo(0, 6)
  ctx.bezierCurveTo(-12, -4, -14, -15, -6, -15)
  ctx.bezierCurveTo(-2, -15, 0, -11, 0, -9)
  ctx.bezierCurveTo(0, -11, 2, -15, 6, -15)
  ctx.bezierCurveTo(14, -15, 12, -4, 0, 6)
  ctx.closePath()
  ctx.fillStyle = '#9c754b'
  ctx.fill()
  ctx.restore()
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, spacing: string) {
  if ('letterSpacing' in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = spacing
  }
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

async function renderCardCanvas(): Promise<HTMLCanvasElement | null> {
  if (typeof document === 'undefined') return null
  await document.fonts?.ready
  const logoImg = await loadImage('/logo/dh-wedding-logo.png')

  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const m = layoutMetrics.value

  // Paper base gradient
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H)
  bg.addColorStop(0, '#faf5ed')
  bg.addColorStop(0.5, '#f5eee2')
  bg.addColorStop(1, '#efe4d3')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // Soft radial light
  const vignette = ctx.createRadialGradient(CX, CARD_H / 2, CARD_W * 0.22, CX, CARD_H / 2, CARD_H * 0.72)
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0.34)')
  vignette.addColorStop(1, 'rgba(186, 158, 120, 0.16)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // Subtle paper linen fiber lines
  ctx.strokeStyle = 'rgba(166, 140, 108, 0.045)'
  ctx.lineWidth = 1
  for (let y = 16; y < CARD_H; y += 20) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(CARD_W, y)
    ctx.stroke()
  }

  // Outer & inner borders
  ctx.strokeStyle = '#bfa37d'
  ctx.lineWidth = 2.6
  ctx.strokeRect(48, 48, CARD_W - 96, CARD_H - 96)
  ctx.strokeStyle = '#d7c3a8'
  ctx.lineWidth = 1.2
  ctx.strokeRect(62, 62, CARD_W - 124, CARD_H - 124)

  // Corner botanical florals
  drawFloralSpray(ctx, 84, 88, 1, 1)
  drawFloralSpray(ctx, CARD_W - 84, CARD_H - 88, -1, -1)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  // DH logo image (fallback to text monogram)
  setLetterSpacing(ctx, '0px')
  if (logoImg) {
    ctx.drawImage(logoImg, CX - 110, 40, 220, 220)
  }
  else {
    ctx.fillStyle = '#7a552f'
    ctx.font = 'italic 600 110px "Playfair Display", "Cormorant Garamond", Georgia, serif'
    ctx.fillText('DH', CX, 200)
  }

  // Subtitle
  ctx.fillStyle = '#8d755c'
  ctx.font = '500 22px "Be Vietnam Pro", sans-serif'
  setLetterSpacing(ctx, '6px')
  ctx.fillText(cardTitle.value, CX, 246)
  setLetterSpacing(ctx, '0px')

  // Family borders
  ctx.strokeStyle = '#dfd0bc'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(104, 300)
  ctx.lineTo(CARD_W - 104, 300)
  ctx.moveTo(104, 506)
  ctx.lineTo(CARD_W - 104, 506)
  ctx.stroke()

  // Two-column parents
  const leftX = 325
  const rightX = 875

  ctx.fillStyle = '#8b7359'
  ctx.font = '600 22px "Be Vietnam Pro", sans-serif'
  setLetterSpacing(ctx, '3px')
  ctx.fillText('NHÀ TRAI', leftX, 350)
  ctx.fillText('NHÀ GÁI', rightX, 350)
  setLetterSpacing(ctx, '0px')

  ctx.fillStyle = '#3b2b1f'
  ctx.font = '700 27px "Cormorant Garamond", "Playfair Display", Georgia, serif'
  ctx.fillText('ÔNG: ĐÀO ĐÌNH THƯỜNG', leftX, 396)
  ctx.fillText('BÀ: NGUYỄN THỊ THU HƯƠNG', leftX, 434)
  ctx.fillText('ÔNG: TRẦN VĂN DŨNG', rightX, 396)
  ctx.fillText('BÀ: PHẠM THỊ THANH NHÀN', rightX, 434)

  ctx.fillStyle = '#705b49'
  ctx.font = 'italic 500 25px "Cormorant Garamond", Georgia, serif'
  ctx.fillText('P. Tân Hưng, TP. Hải Phòng', leftX, 474)
  ctx.fillText('P. Hải An, TP. Hải Phòng', rightX, 474)

  const boxX = 104
  const boxW = CARD_W - 208
  let activeFooterLineY = m.footerLineY

  if (isAnnouncement.value) {
    activeFooterLineY = m.announcementFooterLineY

    // Announcement lead
    ctx.fillStyle = '#7b634b'
    ctx.font = '500 26px "Be Vietnam Pro", sans-serif'
    setLetterSpacing(ctx, '4px')
    ctx.fillText(inviteLead.value, CX, 594)
    setLetterSpacing(ctx, '0px')

    // Guest name lines
    ctx.fillStyle = '#3d2c1e'
    ctx.font = `italic 600 ${m.guestFontSize}px "Playfair Display", "Cormorant Garamond", Georgia, serif`
    m.guestLines.forEach((line, idx) => {
      ctx.fillText(line, CX, m.guestStartY + idx * m.guestLineHeight)
    })

    // Dotted divider under guest name
    ctx.save()
    ctx.strokeStyle = '#b99f7d'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 6])
    ctx.beginPath()
    ctx.moveTo(270, m.dottedY)
    ctx.lineTo(CARD_W - 270, m.dottedY)
    ctx.stroke()
    ctx.restore()

    // Couple names + heart centered as a single unit
    ctx.fillStyle = '#79542e'
    ctx.font = 'italic 700 84px "Playfair Display", "Cormorant Garamond", Georgia, serif'
    const groomWidth = ctx.measureText('Đình Dương').width
    const brideWidth = ctx.measureText('Thu Hà').width
    const gap = 56
    const startCoupleX = CX - (groomWidth + gap + brideWidth) / 2

    ctx.textAlign = 'left'
    ctx.fillText('Đình Dương', startCoupleX, m.announcementCoupleY)
    ctx.fillText('Thu Hà', startCoupleX + groomWidth + gap, m.announcementCoupleY)
    drawVectorHeart(ctx, startCoupleX + groomWidth + gap / 2, m.announcementCoupleY - 14, 28)

    ctx.textAlign = 'center'

    // Announcement subline
    ctx.fillStyle = '#5c4a3c'
    ctx.font = '500 25px "Be Vietnam Pro", sans-serif'
    setLetterSpacing(ctx, '1.5px')
    ctx.fillText(announcementSubline, CX, m.announcementSublineY)
    setLetterSpacing(ctx, '0px')

    // Announcement event box
    ctx.save()
    ctx.shadowColor = 'rgba(92, 68, 44, 0.08)'
    ctx.shadowBlur = 22
    ctx.shadowOffsetY = 8
    drawRoundedRect(ctx, boxX, m.announcementBoxY, boxW, m.announcementBoxH, 16)
    ctx.fillStyle = '#fbf8f2'
    ctx.fill()
    ctx.restore()

    drawRoundedRect(ctx, boxX, m.announcementBoxY, boxW, m.announcementBoxH, 16)
    ctx.strokeStyle = '#dfd0bc'
    ctx.lineWidth = 1.6
    ctx.stroke()

    ctx.fillStyle = '#8b7359'
    ctx.font = '500 22px "Be Vietnam Pro", sans-serif'
    setLetterSpacing(ctx, '3.5px')
    ctx.fillText('HÔN LỄ ĐƯỢC TỔ CHỨC', CX, m.announcementBoxY + 78)
    setLetterSpacing(ctx, '0px')

    ctx.fillStyle = '#3b2b1f'
    ctx.font = '600 40px "Be Vietnam Pro", sans-serif'
    setLetterSpacing(ctx, '2px')
    ctx.fillText(eventInfo.value.dateLine, CX, m.announcementBoxY + 146)
    setLetterSpacing(ctx, '0px')

    ctx.fillStyle = '#755f4d'
    ctx.font = 'italic 500 28px "Cormorant Garamond", Georgia, serif'
    ctx.fillText(eventInfo.value.lunarLine, CX, m.announcementBoxY + 194)

    ctx.strokeStyle = '#e5d8c6'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(boxX + 76, m.announcementBoxY + 242)
    ctx.lineTo(boxX + boxW - 76, m.announcementBoxY + 242)
    ctx.stroke()

    ctx.fillStyle = '#4c3a2b'
    ctx.font = 'italic 600 33px "Cormorant Garamond", Georgia, serif'
    m.announcementLines.forEach((line, idx) => {
      ctx.fillText(line, CX, m.announcementMsgStartY + idx * m.announcementLineHeight)
    })
  }
  else {
    // Invitation lead
    ctx.fillStyle = '#7b634b'
    ctx.font = '500 26px "Be Vietnam Pro", sans-serif'
    setLetterSpacing(ctx, '4px')
    ctx.fillText(inviteLead.value, CX, 594)
    setLetterSpacing(ctx, '0px')

    // Guest name lines
    ctx.fillStyle = '#3d2c1e'
    ctx.font = `italic 600 ${m.guestFontSize}px "Playfair Display", "Cormorant Garamond", Georgia, serif`
    m.guestLines.forEach((line, idx) => {
      ctx.fillText(line, CX, m.guestStartY + idx * m.guestLineHeight)
    })

    // Dotted divider under guest name
    ctx.save()
    ctx.strokeStyle = '#b99f7d'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 6])
    ctx.beginPath()
    ctx.moveTo(270, m.dottedY)
    ctx.lineTo(CARD_W - 270, m.dottedY)
    ctx.stroke()
    ctx.restore()

    // Sublines
    ctx.fillStyle = '#5c4a3c'
    ctx.font = '500 25px "Be Vietnam Pro", sans-serif'
    setLetterSpacing(ctx, '1px')
    ctx.fillText(inviteSubline1.value, CX, m.bodyY)
    ctx.fillText(inviteSubline2, CX, m.bodyY + 40)
    setLetterSpacing(ctx, '0px')

    // Couple names + heart centered as a single unit
    ctx.fillStyle = '#79542e'
    ctx.font = 'italic 700 84px "Playfair Display", "Cormorant Garamond", Georgia, serif'
    const groomWidth = ctx.measureText('Đình Dương').width
    const brideWidth = ctx.measureText('Thu Hà').width
    const gap = 56
    const startCoupleX = CX - (groomWidth + gap + brideWidth) / 2

    ctx.textAlign = 'left'
    ctx.fillText('Đình Dương', startCoupleX, m.coupleY)
    ctx.fillText('Thu Hà', startCoupleX + groomWidth + gap, m.coupleY)
    drawVectorHeart(ctx, startCoupleX + groomWidth + gap / 2, m.coupleY - 14, 28)

    ctx.textAlign = 'center'

    // Event box with soft elevation
    ctx.save()
    ctx.shadowColor = 'rgba(92, 68, 44, 0.08)'
    ctx.shadowBlur = 22
    ctx.shadowOffsetY = 8
    drawRoundedRect(ctx, boxX, m.boxY, boxW, m.boxH, 16)
    ctx.fillStyle = '#fbf8f2'
    ctx.fill()
    ctx.restore()

    drawRoundedRect(ctx, boxX, m.boxY, boxW, m.boxH, 16)
    ctx.strokeStyle = '#dfd0bc'
    ctx.lineWidth = 1.6
    ctx.stroke()

    // Event date & lunar date
    ctx.fillStyle = '#3b2b1f'
    ctx.font = '600 40px "Be Vietnam Pro", sans-serif'
    setLetterSpacing(ctx, '2px')
    ctx.fillText(eventInfo.value.dateLine, CX, m.boxY + 72)
    setLetterSpacing(ctx, '0px')

    ctx.fillStyle = '#755f4d'
    ctx.font = 'italic 500 28px "Cormorant Garamond", Georgia, serif'
    ctx.fillText(eventInfo.value.lunarLine, CX, m.boxY + 116)

    // Inner box lines
    ctx.strokeStyle = '#e5d8c6'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(boxX + 42, m.boxY + 144)
    ctx.lineTo(boxX + boxW - 42, m.boxY + 144)
    ctx.moveTo(boxX + 42, m.boxY + 284)
    ctx.lineTo(boxX + boxW - 42, m.boxY + 284)
    ctx.moveTo(CX, m.boxY + 162)
    ctx.lineTo(CX, m.boxY + 266)
    ctx.stroke()

    const timeLeftX = boxX + boxW * 0.27
    const timeRightX = boxX + boxW * 0.73

    ctx.fillStyle = '#755331'
    ctx.font = '600 36px "Cormorant Garamond", Georgia, serif'
    ctx.fillText(eventInfo.value.leftTime, timeLeftX, m.boxY + 202)
    ctx.fillText(eventInfo.value.rightTime, timeRightX, m.boxY + 202)

    ctx.fillStyle = '#3b2b1f'
    ctx.font = '700 32px "Cormorant Garamond", Georgia, serif'
    ctx.fillText(eventInfo.value.leftLabel, timeLeftX, m.boxY + 248)
    ctx.fillText(eventInfo.value.rightLabel, timeRightX, m.boxY + 248)

    // Venue
    ctx.fillStyle = '#8b7359'
    ctx.font = '500 22px "Be Vietnam Pro", sans-serif'
    setLetterSpacing(ctx, '3.5px')
    ctx.fillText('ĐỊA ĐIỂM TỔ CHỨC', CX, m.boxY + 330)
    setLetterSpacing(ctx, '0px')

    ctx.fillStyle = '#3b2b1f'
    ctx.font = `700 ${m.venueFontSize}px "Be Vietnam Pro", sans-serif`
    ctx.fillText(eventInfo.value.venueName, CX, m.boxY + 378)

    ctx.fillStyle = '#6f5a49'
    ctx.font = '400 26px "Be Vietnam Pro", sans-serif'
    ctx.fillText(eventInfo.value.venueAddress, CX, m.boxY + 424)
  }

  // Footer ornament
  ctx.strokeStyle = '#d3bea3'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(260, activeFooterLineY)
  ctx.lineTo(CX - 28, activeFooterLineY)
  ctx.moveTo(CX + 28, activeFooterLineY)
  ctx.lineTo(CARD_W - 260, activeFooterLineY)
  ctx.stroke()

  ctx.fillStyle = '#b4956b'
  ctx.beginPath()
  ctx.arc(CX - 16, activeFooterLineY, 2.2, 0, Math.PI * 2)
  ctx.arc(CX + 16, activeFooterLineY, 2.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.translate(CX, activeFooterLineY)
  ctx.rotate(Math.PI / 4)
  ctx.strokeStyle = '#b4956b'
  ctx.strokeRect(-5.5, -5.5, 11, 11)
  ctx.restore()

  ctx.fillStyle = '#5c4a3c'
  ctx.font = 'italic 500 31px "Cormorant Garamond", Georgia, serif'
  ctx.fillText(footerNote.value, CX, activeFooterLineY + (isAnnouncement.value ? 60 : 56))

  ctx.fillStyle = '#8b7359'
  ctx.font = '500 21px "Be Vietnam Pro", sans-serif'
  setLetterSpacing(ctx, '3px')
  ctx.fillText(footerCta.value, CX, activeFooterLineY + (isAnnouncement.value ? 108 : 102))
  setLetterSpacing(ctx, '0px')

  return canvas
}

function getFilename() {
  const slug = displayGuestName.value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'khach-moi'

  const filePrefix = isAnnouncement.value ? 'thiep-bao-hy' : 'thiep-moi'
  return `${filePrefix}-${slug}.jpg`
}

async function exportJpgBlob(): Promise<Blob | null> {
  const canvas = await renderCardCanvas()
  if (!canvas) return null

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.95)
  })
}

async function downloadJpg() {
  const canvas = await renderCardCanvas()
  if (!canvas) return

  const link = document.createElement('a')
  link.download = getFilename()
  link.href = canvas.toDataURL('image/jpeg', 0.95)
  link.click()
}

defineExpose({ downloadJpg, exportJpgBlob, getFilename })
</script>

<template>
  <article class="print-card-shell" :aria-label="`${isAnnouncement ? 'Thiệp báo hỷ' : 'Thiệp mời'} của ${displayGuestName}`">
    <svg
      class="print-card-svg"
      viewBox="0 0 1200 1750"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      :aria-label="`Mẫu thiệp cứng cho ${displayGuestName}`"
    >
      <defs>
        <linearGradient id="cardPaperBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#faf5ed" />
          <stop offset="50%" stop-color="#f5eee2" />
          <stop offset="100%" stop-color="#efe4d3" />
        </linearGradient>
        <radialGradient id="cardVignette" cx="50%" cy="50%" r="72%">
          <stop offset="28%" stop-color="#ffffff" stop-opacity="0.32" />
          <stop offset="100%" stop-color="#ba9e78" stop-opacity="0.16" />
        </radialGradient>
        <pattern id="linenPattern" width="20" height="20" patternUnits="userSpaceOnUse">
          <line x1="0" y1="16" x2="20" y2="16" stroke="#a68c6c" stroke-opacity="0.05" stroke-width="1" />
        </pattern>
        <filter id="eventBoxShadow" x="-8%" y="-10%" width="116%" height="124%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#5c442c" flood-opacity="0.08" />
        </filter>
        <g id="floralSpray">
          <path d="M4 214 C22 146 86 68 250 14" fill="none" stroke="#b4956b" stroke-width="2" stroke-linecap="round" />
          <path d="M52 108 C96 54 144 24 198 6" fill="none" stroke="#b4956b" stroke-width="1.6" stroke-linecap="round" />
          <path d="M92 74 C132 82 166 78 196 64" fill="none" stroke="#b4956b" stroke-width="1.6" stroke-linecap="round" />
          <g transform="translate(114,58) rotate(-47)">
            <path d="M0 0 C19 -15 42 -10 54 0 C42 10 19 15 0 0 Z" fill="#f8f2e7" stroke="#b4956b" stroke-width="1.6" />
            <line x1="4" y1="0" x2="44" y2="0" stroke="#b4956b" stroke-width="1.1" />
          </g>
          <g transform="translate(154,34) rotate(-30)">
            <path d="M0 0 C20 -15 44 -10 56 0 C44 10 20 15 0 0 Z" fill="#f8f2e7" stroke="#b4956b" stroke-width="1.6" />
            <line x1="4" y1="0" x2="46" y2="0" stroke="#b4956b" stroke-width="1.1" />
          </g>
          <g transform="translate(198,18) rotate(-12)">
            <path d="M0 0 C17 -13 37 -9 48 0 C37 9 17 13 0 0 Z" fill="#f8f2e7" stroke="#b4956b" stroke-width="1.6" />
            <line x1="4" y1="0" x2="39" y2="0" stroke="#b4956b" stroke-width="1.1" />
          </g>
          <g transform="translate(126,78) rotate(14)">
            <path d="M0 0 C17 -13 37 -9 48 0 C37 9 17 13 0 0 Z" fill="#f8f2e7" stroke="#b4956b" stroke-width="1.6" />
            <line x1="4" y1="0" x2="39" y2="0" stroke="#b4956b" stroke-width="1.1" />
          </g>
          <g transform="translate(166,70) rotate(8)">
            <path d="M0 0 C15 -12 33 -8 42 0 C33 8 15 12 0 0 Z" fill="#f8f2e7" stroke="#b4956b" stroke-width="1.6" />
            <line x1="4" y1="0" x2="34" y2="0" stroke="#b4956b" stroke-width="1.1" />
          </g>
          <g transform="translate(24,134) rotate(-73)">
            <path d="M0 0 C15 -12 34 -8 44 0 C34 8 15 12 0 0 Z" fill="#f8f2e7" stroke="#b4956b" stroke-width="1.6" />
            <line x1="4" y1="0" x2="36" y2="0" stroke="#b4956b" stroke-width="1.1" />
          </g>
          <path d="M202 8 C210 -4 226 -5 233 2 C228 11 213 14 202 8 Z" fill="#fbf6ee" stroke="#b4956b" stroke-width="1.5" />
          <g transform="translate(66,86)">
            <g transform="rotate(-20)"><path d="M0 0 C-18 -14 -22 -40 -6 -48 Q0 -42 6 -48 C22 -40 18 -14 0 0 Z" fill="#fbf7ef" stroke="#b4956b" stroke-width="1.6" /></g>
            <g transform="rotate(52)"><path d="M0 0 C-18 -14 -22 -40 -6 -48 Q0 -42 6 -48 C22 -40 18 -14 0 0 Z" fill="#fbf7ef" stroke="#b4956b" stroke-width="1.6" /></g>
            <g transform="rotate(124)"><path d="M0 0 C-18 -14 -22 -40 -6 -48 Q0 -42 6 -48 C22 -40 18 -14 0 0 Z" fill="#fbf7ef" stroke="#b4956b" stroke-width="1.6" /></g>
            <g transform="rotate(196)"><path d="M0 0 C-18 -14 -22 -40 -6 -48 Q0 -42 6 -48 C22 -40 18 -14 0 0 Z" fill="#fbf7ef" stroke="#b4956b" stroke-width="1.6" /></g>
            <g transform="rotate(268)"><path d="M0 0 C-18 -14 -22 -40 -6 -48 Q0 -42 6 -48 C22 -40 18 -14 0 0 Z" fill="#fbf7ef" stroke="#b4956b" stroke-width="1.6" /></g>
            <g stroke="#b4956b" stroke-width="1.1" fill="#b4956b">
              <line x1="0" y1="0" x2="12" y2="0" /><circle cx="13" cy="0" r="2" />
              <line x1="0" y1="0" x2="6" y2="10.4" /><circle cx="6.5" cy="11.2" r="2" />
              <line x1="0" y1="0" x2="-6" y2="10.4" /><circle cx="-6.5" cy="11.2" r="2" />
              <line x1="0" y1="0" x2="-12" y2="0" /><circle cx="-13" cy="0" r="2" />
              <line x1="0" y1="0" x2="-6" y2="-10.4" /><circle cx="-6.5" cy="-11.2" r="2" />
              <line x1="0" y1="0" x2="6" y2="-10.4" /><circle cx="6.5" cy="-11.2" r="2" />
            </g>
            <circle cx="0" cy="0" r="5.5" fill="#e7d7bf" stroke="#b4956b" stroke-width="1.4" />
          </g>
        </g>
      </defs>

      <!-- Paper background -->
      <rect width="1200" height="1750" fill="url(#cardPaperBg)" />
      <rect width="1200" height="1750" fill="url(#cardVignette)" />
      <rect width="1200" height="1750" fill="url(#linenPattern)" />

      <!-- Double border -->
      <rect x="48" y="48" width="1104" height="1654" fill="none" stroke="#bfa37d" stroke-width="2.6" />
      <rect x="62" y="62" width="1076" height="1626" fill="none" stroke="#d7c3a8" stroke-width="1.2" />

      <!-- Corner botanical sprays -->
      <use href="#floralSpray" x="84" y="88" />
      <use href="#floralSpray" transform="translate(1116,1662) scale(-1,-1)" />

      <!-- Header logo -->
      <image
        href="/logo/dh-wedding-logo.png"
        x="490"
        y="40"
        width="220"
        height="220"
        preserveAspectRatio="xMidYMid meet"
      />
      <text x="600" y="246" text-anchor="middle" class="svg-subtitle">{{ cardTitle }}</text>

      <!-- Family block -->
      <line x1="104" y1="300" x2="1096" y2="300" stroke="#dfd0bc" stroke-width="1.2" />
      <line x1="104" y1="506" x2="1096" y2="506" stroke="#dfd0bc" stroke-width="1.2" />

      <g text-anchor="middle">
        <text x="325" y="350" class="svg-family-label">NHÀ TRAI</text>
        <text x="325" y="396" class="svg-parent-name">ÔNG: ĐÀO ĐÌNH THƯỜNG</text>
        <text x="325" y="434" class="svg-parent-name">BÀ: NGUYỄN THỊ THU HƯƠNG</text>
        <text x="325" y="474" class="svg-family-addr">P. Tân Hưng, TP. Hải Phòng</text>

        <text x="875" y="350" class="svg-family-label">NHÀ GÁI</text>
        <text x="875" y="396" class="svg-parent-name">ÔNG: TRẦN VĂN DŨNG</text>
        <text x="875" y="434" class="svg-parent-name">BÀ: PHẠM THỊ THANH NHÀN</text>
        <text x="875" y="474" class="svg-family-addr">P. Hải An, TP. Hải Phòng</text>
      </g>

      <!-- Announcement body & card -->
      <template v-if="isAnnouncement">
        <text x="600" y="594" text-anchor="middle" class="svg-lead">{{ inviteLead }}</text>

        <text
          v-for="(line, idx) in layoutMetrics.guestLines"
          :key="`ann-guest-${idx}`"
          x="600"
          :y="layoutMetrics.guestStartY + idx * layoutMetrics.guestLineHeight"
          text-anchor="middle"
          class="svg-guest-name"
          :style="{ fontSize: `${layoutMetrics.guestFontSize}px` }"
        >
          {{ line }}
        </text>

        <line
          x1="270"
          :y1="layoutMetrics.dottedY"
          x2="930"
          :y2="layoutMetrics.dottedY"
          stroke="#b99f7d"
          stroke-width="2"
          stroke-dasharray="4 6"
        />

        <text
          x="600"
          :y="layoutMetrics.announcementCoupleY"
          text-anchor="middle"
          class="svg-couple"
        >Đình Dương <tspan class="svg-couple-heart" dy="-14">♥</tspan><tspan dy="14"> Thu Hà</tspan></text>

        <text x="600" :y="layoutMetrics.announcementSublineY" text-anchor="middle" class="svg-subline svg-announcement-subline">{{ announcementSubline }}</text>

        <g>
          <rect
            x="104"
            :y="layoutMetrics.announcementBoxY"
            width="992"
            :height="layoutMetrics.announcementBoxH"
            rx="16"
            fill="#fbf8f2"
            stroke="#dfd0bc"
            stroke-width="1.6"
            filter="url(#eventBoxShadow)"
          />

          <text x="600" :y="layoutMetrics.announcementBoxY + 78" text-anchor="middle" class="svg-venue-label">HÔN LỄ ĐƯỢC TỔ CHỨC</text>
          <text x="600" :y="layoutMetrics.announcementBoxY + 146" text-anchor="middle" class="svg-event-date">{{ eventInfo.dateLine }}</text>
          <text x="600" :y="layoutMetrics.announcementBoxY + 194" text-anchor="middle" class="svg-event-lunar">{{ eventInfo.lunarLine }}</text>

          <line x1="180" :y1="layoutMetrics.announcementBoxY + 242" x2="1020" :y2="layoutMetrics.announcementBoxY + 242" stroke="#e5d8c6" stroke-width="1.2" />

          <text
            v-for="(line, idx) in layoutMetrics.announcementLines"
            :key="idx"
            x="600"
            :y="layoutMetrics.announcementMsgStartY + idx * layoutMetrics.announcementLineHeight"
            text-anchor="middle"
            class="svg-announcement-msg"
          >
            {{ line }}
          </text>
        </g>

        <!-- Footer -->
        <g>
          <line x1="260" :y1="layoutMetrics.announcementFooterLineY" x2="572" :y2="layoutMetrics.announcementFooterLineY" stroke="#d3bea3" stroke-width="1.2" />
          <line x1="628" :y1="layoutMetrics.announcementFooterLineY" x2="940" :y2="layoutMetrics.announcementFooterLineY" stroke="#d3bea3" stroke-width="1.2" />
          <circle cx="584" :cy="layoutMetrics.announcementFooterLineY" r="2.2" fill="#b4956b" />
          <circle cx="616" :cy="layoutMetrics.announcementFooterLineY" r="2.2" fill="#b4956b" />
          <rect
            x="-5.5"
            y="-5.5"
            width="11"
            height="11"
            fill="none"
            stroke="#b4956b"
            stroke-width="1.2"
            :transform="`translate(600, ${layoutMetrics.announcementFooterLineY}) rotate(45)`"
          />

          <text x="600" :y="layoutMetrics.announcementFooterLineY + 60" text-anchor="middle" class="svg-footer-note">
            {{ footerNote }}
          </text>
          <text x="600" :y="layoutMetrics.announcementFooterLineY + 108" text-anchor="middle" class="svg-footer-cta">
            {{ footerCta }}
          </text>
        </g>
      </template>

      <!-- Guest & invitation body -->
      <template v-else>
        <text x="600" y="594" text-anchor="middle" class="svg-lead">{{ inviteLead }}</text>

        <text
          v-for="(line, idx) in layoutMetrics.guestLines"
          :key="idx"
          x="600"
          :y="layoutMetrics.guestStartY + idx * layoutMetrics.guestLineHeight"
          text-anchor="middle"
          class="svg-guest-name"
          :style="{ fontSize: `${layoutMetrics.guestFontSize}px` }"
        >
          {{ line }}
        </text>

        <line
          x1="270"
          :y1="layoutMetrics.dottedY"
          x2="930"
          :y2="layoutMetrics.dottedY"
          stroke="#b99f7d"
          stroke-width="2"
          stroke-dasharray="4 6"
        />

        <text x="600" :y="layoutMetrics.bodyY" text-anchor="middle" class="svg-subline">{{ inviteSubline1 }}</text>
        <text x="600" :y="layoutMetrics.bodyY + 40" text-anchor="middle" class="svg-subline">{{ inviteSubline2 }}</text>

        <!-- Couple names centered as one unit -->
        <text
          x="600"
          :y="layoutMetrics.coupleY"
          text-anchor="middle"
          class="svg-couple"
        >Đình Dương <tspan class="svg-couple-heart" dy="-14">♥</tspan><tspan dy="14"> Thu Hà</tspan></text>

        <!-- Event details card -->
        <g>
          <rect
            x="104"
            :y="layoutMetrics.boxY"
            width="992"
            :height="layoutMetrics.boxH"
            rx="16"
            fill="#fbf8f2"
            stroke="#dfd0bc"
            stroke-width="1.6"
            filter="url(#eventBoxShadow)"
          />

          <text x="600" :y="layoutMetrics.boxY + 72" text-anchor="middle" class="svg-event-date">{{ eventInfo.dateLine }}</text>
          <text x="600" :y="layoutMetrics.boxY + 116" text-anchor="middle" class="svg-event-lunar">{{ eventInfo.lunarLine }}</text>

          <line x1="146" :y1="layoutMetrics.boxY + 144" x2="1054" :y2="layoutMetrics.boxY + 144" stroke="#e5d8c6" stroke-width="1.2" />
          <line x1="146" :y1="layoutMetrics.boxY + 284" x2="1054" :y2="layoutMetrics.boxY + 284" stroke="#e5d8c6" stroke-width="1.2" />
          <line x1="600" :y1="layoutMetrics.boxY + 162" x2="600" :y2="layoutMetrics.boxY + 266" stroke="#e5d8c6" stroke-width="1.2" />

          <text x="372" :y="layoutMetrics.boxY + 202" text-anchor="middle" class="svg-time-val">{{ eventInfo.leftTime }}</text>
          <text x="372" :y="layoutMetrics.boxY + 248" text-anchor="middle" class="svg-time-lbl">{{ eventInfo.leftLabel }}</text>

          <text x="828" :y="layoutMetrics.boxY + 202" text-anchor="middle" class="svg-time-val">{{ eventInfo.rightTime }}</text>
          <text x="828" :y="layoutMetrics.boxY + 248" text-anchor="middle" class="svg-time-lbl">{{ eventInfo.rightLabel }}</text>

          <text x="600" :y="layoutMetrics.boxY + 330" text-anchor="middle" class="svg-venue-label">ĐỊA ĐIỂM TỔ CHỨC</text>
          <text
            x="600"
            :y="layoutMetrics.boxY + 378"
            text-anchor="middle"
            class="svg-venue-name"
            :style="{ fontSize: `${layoutMetrics.venueFontSize}px` }"
          >
            {{ eventInfo.venueName }}
          </text>
          <text x="600" :y="layoutMetrics.boxY + 424" text-anchor="middle" class="svg-venue-addr">{{ eventInfo.venueAddress }}</text>
        </g>

        <!-- Footer -->
        <g>
          <line x1="260" :y1="layoutMetrics.footerLineY" x2="572" :y2="layoutMetrics.footerLineY" stroke="#d3bea3" stroke-width="1.2" />
          <line x1="628" :y1="layoutMetrics.footerLineY" x2="940" :y2="layoutMetrics.footerLineY" stroke="#d3bea3" stroke-width="1.2" />
          <circle cx="584" :cy="layoutMetrics.footerLineY" r="2.2" fill="#b4956b" />
          <circle cx="616" :cy="layoutMetrics.footerLineY" r="2.2" fill="#b4956b" />
          <rect
            x="-5.5"
            y="-5.5"
            width="11"
            height="11"
            fill="none"
            stroke="#b4956b"
            stroke-width="1.2"
            :transform="`translate(600, ${layoutMetrics.footerLineY}) rotate(45)`"
          />

          <text x="600" :y="layoutMetrics.footerLineY + 56" text-anchor="middle" class="svg-footer-note">
            {{ footerNote }}
          </text>
          <text x="600" :y="layoutMetrics.footerLineY + 102" text-anchor="middle" class="svg-footer-cta">
            {{ footerCta }}
          </text>
        </g>
      </template>
    </svg>
  </article>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&display=swap&subset=vietnamese");

.print-card-shell {
  width: 100%;
  max-width: 540px;
  margin: 0 auto;
  box-shadow: 0 18px 44px rgb(45 30 18 / 0.16), 0 2px 8px rgb(45 30 18 / 0.08);
  border-radius: 4px;
  overflow: hidden;
  background: #f5eee2;
}

.print-card-svg {
  display: block;
  width: 100%;
  height: auto;
}

.svg-monogram {
  fill: #7a552f;
  font-family: "Playfair Display", "Cormorant Garamond", Georgia, serif;
  font-style: italic;
  font-weight: 600;
  font-size: 110px;
}

.svg-subtitle {
  fill: #8d755c;
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 500;
  font-size: 22px;
  letter-spacing: 6px;
}

.svg-family-label {
  fill: #8b7359;
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 600;
  font-size: 22px;
  letter-spacing: 3px;
}

.svg-parent-name {
  fill: #3b2b1f;
  font-family: "Cormorant Garamond", "Playfair Display", Georgia, serif;
  font-weight: 700;
  font-size: 27px;
}

.svg-family-addr {
  fill: #705b49;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-style: italic;
  font-weight: 500;
  font-size: 25px;
}

.svg-lead {
  fill: #7b634b;
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 500;
  font-size: 26px;
  letter-spacing: 4px;
}

.svg-guest-name {
  fill: #3d2c1e;
  font-family: "Playfair Display", "Cormorant Garamond", Georgia, serif;
  font-style: italic;
  font-weight: 600;
}

.svg-subline {
  fill: #5c4a3c;
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 500;
  font-size: 25px;
  letter-spacing: 1px;
}

.svg-announcement-subline {
  letter-spacing: 1.5px;
}

.svg-announcement-msg {
  fill: #4c3a2b;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-style: italic;
  font-weight: 600;
  font-size: 33px;
}

.svg-couple {
  fill: #79542e;
  font-family: "Playfair Display", "Cormorant Garamond", Georgia, serif;
  font-style: italic;
  font-weight: 700;
  font-size: 84px;
}

.svg-couple-heart {
  fill: #9c754b;
  font-style: normal;
  font-size: 38px;
}

.svg-event-date {
  fill: #3b2b1f;
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 600;
  font-size: 40px;
  letter-spacing: 2px;
}

.svg-event-lunar {
  fill: #755f4d;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-style: italic;
  font-weight: 500;
  font-size: 28px;
}

.svg-time-val {
  fill: #755331;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-weight: 600;
  font-size: 36px;
}

.svg-time-lbl {
  fill: #3b2b1f;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-weight: 700;
  font-size: 32px;
}

.svg-venue-label {
  fill: #8b7359;
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 500;
  font-size: 22px;
  letter-spacing: 3.5px;
}

.svg-venue-name {
  fill: #3b2b1f;
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 700;
}

.svg-venue-addr {
  fill: #6f5a49;
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 400;
  font-size: 26px;
}

.svg-footer-note {
  fill: #5c4a3c;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-style: italic;
  font-weight: 500;
  font-size: 31px;
}

.svg-footer-cta {
  fill: #8b7359;
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 500;
  font-size: 21px;
  letter-spacing: 3px;
}
</style>
