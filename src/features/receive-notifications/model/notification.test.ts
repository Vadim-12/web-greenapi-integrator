import { describe, expect, it } from 'vitest'
import { toIncomingMessage, toOutgoingMessageStatus } from '@/features/receive-notifications/model/notification'

describe('notification mapper', () => {
  it('преобразует текстовое уведомление GREEN-API в сообщение чата', () => {
    const message = toIncomingMessage({ body: { idMessage: 'green-id', senderData: { chatId: '42', senderName: 'Иван' }, messageData: { textMessageData: { textMessage: 'Привет' } } } }, '12:30')
    expect(message).toMatchObject({ id: 'green-id', chatId: '42', name: 'Иван', senderName: 'Иван', text: 'Привет', time: '12:30', dateLabel: 'Сегодня' })
    expect(message?.dateKey).toMatch(/^\d{4}-\d{1,2}-\d{1,2}$/)
  })

  it('игнорирует уведомление без текста или chatId', () => {
    expect(toIncomingMessage({ body: { messageData: { textMessageData: { textMessage: 'Привет' } } } }, '12:30')).toBeNull()
  })

  it('преобразует входящее аудио во вложение без текстовой подписи', () => {
    const message = toIncomingMessage({ body: {
      idMessage: 'audio-1',
      senderData: { chatId: '42', senderName: 'Иван' },
      messageData: { typeMessage: 'audioMessage', fileMessageData: { downloadUrl: 'https://media.example/audio.ogg', fileName: 'voice.ogg', mimeType: 'audio/ogg' } },
    } }, '12:30')

    expect(message).toMatchObject({ text: '', attachment: { kind: 'audio', url: 'https://media.example/audio.ogg' } })
  })

  it('преобразует ошибку отправки в статус локального сообщения', () => {
    const status = toOutgoingMessageStatus({ body: { typeWebhook: 'outgoingMessageStatus', chatId: '42', idMessage: 'green-id', status: 'failed', description: 'chatId unresolvable on this session' } })
    expect(status).toEqual({ chatId: '42', messageId: 'green-id', status: 'error', description: 'chatId unresolvable on this session' })
  })
})
