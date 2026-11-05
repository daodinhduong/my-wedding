import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const url = new URL(process.env.DATABASE_URL || '')
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
  throw new Error('Chỉ thêm lời chúc mẫu vào database local.')
}

const prisma = new PrismaClient()
const marker = 'demo-wishes-local-v1'
const wishes = [
  ['Minh Anh', 'Chúc Dương và Hà trăm năm hạnh phúc! Mong hai bạn luôn nắm tay nhau, cùng đi qua thật nhiều mùa yêu thương.'],
  ['Tuấn & Linh', 'Mừng ngày chung đôi của hai bạn! Chúc tổ ấm nhỏ lúc nào cũng đầy ắp tiếng cười và những bữa cơm ngon.'],
  ['Hoàng Nam', 'Cuối cùng cũng được ăn cỗ của Dương rồi! Chúc hai vợ chồng mãi yêu nhau như những ngày đầu nhé.'],
  ['Thu Trang', 'Cô dâu xinh quá! Chúc Hà và anh Dương có một đám cưới thật đáng nhớ, một cuộc hôn nhân thật bình yên.'],
  ['Gia đình anh Quân', 'Chúc mừng hạnh phúc hai em. Mong hai em luôn biết lắng nghe, nhường nhịn và cùng vun vén cho gia đình.'],
  ['Ngọc Mai', 'Từ hôm nay có thêm một người để chia sẻ mọi chuyện rồi. Chúc hai bạn luôn là chỗ dựa ấm áp của nhau!'],
  ['Đức Anh', 'Chúc đôi bạn trẻ hạnh phúc dài lâu, công việc thuận lợi, cùng nhau thực hiện hết những dự định còn dang dở.'],
  ['Phương Thảo', 'Mong sau này dù bận rộn đến đâu, hai bạn vẫn dành cho nhau những cuộc hẹn và những điều dễ thương như bây giờ. Happy wedding!'],
  ['Anh chị Hùng', 'Chúc Dương và Hà thật nhiều sức khỏe và niềm vui trong chặng đường mới. Cả nhà luôn thương và chúc phúc cho hai em.'],
  ['Hội bạn thân', 'Chúc mừng cặp đôi của năm! Hẹn gặp trong ngày cưới, tụi mình sẽ đến thật sớm để chụp ảnh cùng cô dâu chú rể nhé.']
]

try {
  const existing = await prisma.weddingResponse.findMany({ where: { note: marker }, select: { guestName: true } })
  const names = new Set(existing.map(item => item.guestName))
  const result = await prisma.weddingResponse.createMany({
    data: wishes.filter(([name]) => !names.has(name)).map(([guestName, wishMessage], index) => ({
      guestName,
      wishMessage,
      isApproved: true,
      responseSource: 'admin',
      attendanceStatus: 'pending',
      guestCount: 0,
      invitationSide: index % 2 ? 'nha-gai' : 'nha-trai',
      note: marker,
      createdAt: new Date(Date.now() - index * 45 * 60 * 1000)
    }))
  })
  console.log(`Đã thêm ${result.count} lời chúc mẫu, duyệt sẵn để hiển thị trên thiệp.`)
}
finally {
  await prisma.$disconnect()
}
