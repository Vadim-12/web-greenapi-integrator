import { describe, expect, it } from 'vitest'
import { toChatPreviews, toIncomingJournalMessages, toMessages } from '@/features/load-chat-history/model/history'

describe('chat history mapper', () => {
  it('переворачивает ответ API в хронологический порядок и сохраняет статусы', () => {
    const messages = toMessages([
      { idMessage: 'new', type: 'outgoing', timestamp: 1735725660, textMessage: 'Ответ', statusMessage: 'read' },
      { idMessage: 'old', type: 'incoming', timestamp: 1735725600, textMessage: 'Привет' },
    ])

    expect(messages.map((message) => message.id)).toEqual(['old', 'new'])
    expect(messages[1].status).toBe('read')
  })

  it('отличает доставленное сообщение от прочитанного', () => {
    const [message] = toMessages([{ idMessage: '1', type: 'outgoing', textMessage: 'Привет', statusMessage: 'delivered' }])

    expect(message.status).toBe('delivered')
  })

  it('выбирает последнее сообщение каждого чата для списка диалогов', () => {
    const previews = toChatPreviews([
      { chatId: 'chat-1', timestamp: 10, textMessage: 'Старое' },
      { chatId: 'chat-1', timestamp: 20, textMessage: 'Новое' },
      { chatId: 'chat-2', timestamp: 15, textMessage: 'Другой чат' },
    ])
    expect(previews.map(({ chatId, text }) => ({ chatId, text }))).toEqual([{ chatId: 'chat-1', text: 'Новое' }, { chatId: 'chat-2', text: 'Другой чат' }])
  })

  it('берёт из журнала только входящие сообщения для синхронизации', () => {
    const messages = toIncomingJournalMessages([
      { idMessage: 'in-1', type: 'incoming', chatId: 'chat-1', textMessage: 'Входящее' },
      { idMessage: 'out-1', type: 'outgoing', chatId: 'chat-1', textMessage: 'Исходящее' },
    ])
    expect(messages).toEqual([{ id: 'in-1', chatId: 'chat-1', name: 'chat-1', text: 'Входящее', time: '' }])
  })
})
