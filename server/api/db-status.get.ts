import { defineEventHandler } from 'h3'
import { useDb } from '../utils/db'

export default defineEventHandler(async () => {
  try {
    const db = useDb()
    const result = await db.query<{ now: Date }>('select now() as now')

    return {
      ok: true,
      message: `PostgreSQL phản hồi lúc ${result.rows[0]?.now ?? 'không rõ thời gian'}.`
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Không thể kết nối PostgreSQL.'
    }
  }
})
