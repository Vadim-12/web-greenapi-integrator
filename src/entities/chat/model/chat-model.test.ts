import { describe, expect, it } from 'vitest'
import { applyChatPreviews, applyIncomingMessage, markChatRead } from '@/entities/chat/model/chat-model'
import type { Chat } from '@/entities/chat/model/types'

const chats: Chat[] = [{ id: '1', name: 'Иван', initials: 'И', color: '#fff', last: 'Старое', time: '10:00', unread: 2 }]

describe('chat model', () => {
  it('поднимает чат с входящим сообщением наверх и увеличивает счётчик', () => {
    const result = applyIncomingMessage(chats, { chatId: '1', name: 'Иван', text: 'Новое', time: '11:00' }, 'other')
    expect(result[0]).toMatchObject({ last: 'Новое', time: '11:00', unread: 3 })
  })

  it('сбрасывает непрочитанные при открытии чата', () => {
    expect(markChatRead(chats, '1')[0].unread).toBe(0)
  })

  it('обновляет превью последнего сообщения только для чатов из журнала', () => {
    const result = applyChatPreviews(chats, [{ chatId: '1', text: 'Новое превью', time: '11:00', timestamp: 1 }])
    expect(result[0]).toMatchObject({ last: 'Новое превью', time: '11:00' })
  })

  it('не откатывает статус прочтения устаревшим статусом из журнала', () => {
    const readChat: Chat[] = [{ ...chats[0], lastMine: true, lastStatus: 'read', lastExternalId: 'message-1' }]

    const result = applyChatPreviews(readChat, [{ chatId: '1', text: 'Старый статус', time: '11:00', timestamp: 1, mine: true, status: 'delivered', externalId: 'message-1' }])

    expect(result[0].lastStatus).toBe('read')
  })

  it('может обновить старое превью, не меняя порядок списка', () => {
    const multipleChats: Chat[] = [chats[0], { ...chats[0], id: '2', name: 'Мария' }]

    const result = applyChatPreviews(multipleChats, [{ chatId: '2', text: 'Старое сообщение', time: '10:00', timestamp: 1 }], false)

    expect(result.map((chat) => chat.id)).toEqual(['1', '2'])
    expect(result[1].last).toBe('Старое сообщение')
  })
})
