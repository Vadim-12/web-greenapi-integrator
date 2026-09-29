import { describe, expect, it } from 'vitest'
import { toIncomingMessage, toOutgoingMessageStatus } from '@/features/receive-notifications/model/notification'

describe('notification mapper', () => {
  it('преобразует текстовое уведомление GREEN-API в сообщение чата', () => {
    const message = toIncomingMessage({ body: { idMessage: 'green-id', senderData: { chatId: '42', senderName: 'Иван' }, messageData: { textMessageData: { textMessage: 'Привет' } } } }, '12:30')
    expect(message).toEqual({ id: 'green-id', chatId: '42', name: 'Иван', text: 'Привет', time: '12:30' })
  })

  it('игнорирует уведомление без текста или chatId', () => {
    expect(toIncomingMessage({ body: { messageData: { textMessageData: { textMessage: 'Привет' } } } }, '12:30')).toBeNull()
  })

  it('преобразует ошибку отправки в статус локального сообщения', () => {
    const status = toOutgoingMessageStatus({ body: { typeWebhook: 'outgoingMessageStatus', chatId: '42', idMessage: 'green-id', status: 'failed', description: 'chatId unresolvable on this session' } })
    expect(status).toEqual({ chatId: '42', messageId: 'green-id', status: 'error', description: 'chatId unresolvable on this session' })
  })
})
