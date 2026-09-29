import { describe, expect, it } from 'vitest'
import { addMessage, updateMessageExternalId, updateMessageStatus, updateMessageStatusByExternalId } from '@/entities/message/model/message-model'

describe('message model', () => {
  it('добавляет сообщение в историю нужного чата', () => {
    const result = addMessage({}, 'chat-1', { id: '1', mine: true, text: 'Привет', time: '12:00' })
    expect(result['chat-1']).toHaveLength(1)
    expect(result['chat-1'][0].text).toBe('Привет')
  })

  it('обновляет статус только указанного сообщения', () => {
    const result = updateMessageStatus({ 'chat-1': [{ id: '1', mine: true, text: 'Привет', time: '12:00', status: 'sending' }] }, 'chat-1', '1', 'read')
    expect(result['chat-1'][0].status).toBe('read')
  })

  it('сопоставляет внешний id GREEN-API со статусом сообщения', () => {
    const withExternalId = updateMessageExternalId({ 'chat-1': [{ id: '1', mine: true, text: 'Привет', time: '12:00', status: 'sending' }] }, 'chat-1', '1', 'green-id')
    const result = updateMessageStatusByExternalId(withExternalId, 'chat-1', 'green-id', 'error')
    expect(result['chat-1'][0]).toMatchObject({ externalId: 'green-id', status: 'error' })
  })
})
