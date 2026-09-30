import { describe, expect, it } from 'vitest';
import { messengers } from '@/shared/config/messengers';

describe('messengers configuration', () => {
  it('содержит три независимые платформы с документацией и подсказкой chatId', () => {
    expect(messengers.map((messenger) => messenger.id)).toEqual(['telegram', 'whatsapp', 'max']);
    messengers.forEach((messenger) => {
      expect(messenger.documentationUrl).toMatch(/^https:/);
      expect(messenger.chatIdPlaceholder).not.toBe('');
    });
  });
});
