import { afterEach, describe, expect, it, vi } from 'vitest'
import { GreenApiClient } from '@/shared/api/green-api/client'

const client = new GreenApiClient({ apiUrl: 'https://1100.api.green-api.com/', idInstance: '1100', apiTokenInstance: 'secret' })

describe('GreenApiClient', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('отправляет текст в корректный endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ idMessage: 'id' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(client.sendMessage('123', 'Привет')).resolves.toBe('id')

    expect(fetchMock).toHaveBeenCalledWith('https://1100.api.green-api.com/waInstance1100/sendMessage/secret', expect.objectContaining({ method: 'POST', body: JSON.stringify({ chatId: '123', message: 'Привет' }) }))
  })

  it('получает список чатов аккаунта', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ chatId: '123', name: 'Иван' }]), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(client.getChats()).resolves.toEqual([{ chatId: '123', name: 'Иван' }])
    expect(fetchMock).toHaveBeenCalledWith('https://1100.api.green-api.com/waInstance1100/getChats/secret', expect.objectContaining({ method: 'GET' }))
  })

  it('один раз повторяет запрос списка чатов после HTTP 429', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ chatId: '123', name: 'Иван' }]), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(client.getChats()).resolves.toEqual([{ chatId: '123', name: 'Иван' }])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('запрашивает историю выбранного чата', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await client.getChatHistory('123', 50)

    expect(fetchMock).toHaveBeenCalledWith('https://1100.api.green-api.com/waInstance1100/getChatHistory/secret', expect.objectContaining({ method: 'POST', body: JSON.stringify({ chatId: '123', count: 50 }) }))
  })

  it('объединяет последние входящие и исходящие сообщения для превью чатов', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ chatId: '1', textMessage: 'Входящее' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ chatId: '2', textMessage: 'Исходящее' }]), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(client.getRecentMessages()).resolves.toEqual([{ chatId: '1', textMessage: 'Входящее' }, { chatId: '2', textMessage: 'Исходящее' }])
  })

  it('подтверждает обработанное уведомление', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await client.deleteNotification(42)

    expect(fetchMock).toHaveBeenCalledWith('https://1100.api.green-api.com/waInstance1100/deleteNotification/secret/42', expect.objectContaining({ method: 'DELETE' }))
  })

  it('отправляет индикатор набора текста', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await client.sendTyping('123')

    expect(fetchMock).toHaveBeenCalledWith('https://1100.api.green-api.com/waInstance1100/sendTyping/secret', expect.objectContaining({ method: 'POST', body: JSON.stringify({ chatId: '123', typingTime: 2000 }) }))
  })

  it('считает пустой ответ long polling нормальным тайм-аутом', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('null', { status: 200 })))

    await expect(client.receiveNotification()).resolves.toEqual({})
  })

  it('не считает HTTP 408 ошибкой long polling', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 408 })))

    await expect(client.receiveNotification()).resolves.toEqual({})
  })
})
