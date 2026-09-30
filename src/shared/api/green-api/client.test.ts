import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GreenApiClient } from '@/shared/api/green-api/client';

const client = new GreenApiClient({
  apiUrl: 'https://1100.api.green-api.com/',
  idInstance: '1100',
  apiTokenInstance: 'secret',
});
const requestMock = vi.spyOn(axios, 'request');

describe('GreenApiClient', () => {
  afterEach(() => requestMock.mockReset());

  it('отправляет текст через Axios в корректный endpoint', async () => {
    requestMock.mockResolvedValue({ data: { idMessage: 'id' } });
    await expect(client.sendMessage('123', 'Привет')).resolves.toBe('id');
    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://1100.api.green-api.com/waInstance1100/sendMessage/secret',
        method: 'POST',
        data: JSON.stringify({ chatId: '123', message: 'Привет' }),
      }),
    );
  });

  it('получает список чатов', async () => {
    requestMock.mockResolvedValue({ data: [{ chatId: '123', name: 'Иван' }] });
    await expect(client.getChats()).resolves.toEqual([{ chatId: '123', name: 'Иван' }]);
    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://1100.api.green-api.com/waInstance1100/getChats/secret?count=1000',
      }),
    );
  });

  it('запрашивает расширенную историю чата по умолчанию', async () => {
    requestMock.mockResolvedValue({ data: [] });

    await client.getChatHistory('123');

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://1100.api.green-api.com/waInstance1100/getChatHistory/secret',
        method: 'POST',
        data: JSON.stringify({ chatId: '123', count: 10_000 }),
      }),
    );
  });

  it('получает ссылку на аватар чата', async () => {
    requestMock.mockResolvedValue({ data: { urlAvatar: 'https://example.test/avatar.jpg' } });

    await expect(client.getAvatar('123')).resolves.toBe('https://example.test/avatar.jpg');
    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://1100.api.green-api.com/waInstance1100/getAvatar/secret',
        method: 'POST',
        data: JSON.stringify({ chatId: '123' }),
      }),
    );
  });

  it('объединяет журналы для превью', async () => {
    requestMock
      .mockResolvedValueOnce({ data: [{ chatId: '1', textMessage: 'Входящее' }] })
      .mockResolvedValueOnce({ data: [{ chatId: '2', textMessage: 'Исходящее' }] });
    await expect(client.getRecentMessages(43_200)).resolves.toEqual([
      { chatId: '1', textMessage: 'Входящее' },
      { chatId: '2', textMessage: 'Исходящее' },
    ]);
    expect(requestMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        url: 'https://1100.api.green-api.com/waInstance1100/lastIncomingMessages/secret?minutes=43200',
      }),
    );
    expect(requestMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        url: 'https://1100.api.green-api.com/waInstance1100/lastOutgoingMessages/secret?minutes=43200',
      }),
    );
  });

  it('загружает файл в form-data', async () => {
    requestMock.mockResolvedValue({ data: { idMessage: 'file-id' } });
    await expect(
      client.sendFile('123', new File(['file'], 'note.txt', { type: 'text/plain' })),
    ).resolves.toEqual({ idMessage: 'file-id' });
    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://1100.api.green-api.com/waInstance1100/sendFileByUpload/secret',
        method: 'POST',
        data: expect.any(FormData),
      }),
    );
  });

  it('считает пустой ответ long polling нормальным', async () => {
    requestMock.mockResolvedValue({ data: null });
    await expect(client.receiveNotification()).resolves.toEqual({});
  });
});
