import { describe, expect, it } from 'vitest'
import { createDemoChatId, isDemoChatId } from '@/shared/lib/messenger/demoChatId'

describe('demo chat id utilities', () => {
  it('изолирует demo-чат внутри выбранного мессенджера', () => {
    const chatId = createDemoChatId('telegram', 'demo-alex')
    expect(chatId).toBe('telegram-demo-alex')
    expect(isDemoChatId('telegram', chatId)).toBe(true)
    expect(isDemoChatId('whatsapp', chatId)).toBe(false)
  })
})
