import { describe, expect, it } from 'vitest';
import { isConfigured } from '@/features/connect-instance/model/types';

describe('connection settings', () => {
  it('разрешает подключение только при заполненном ID и токене', () => {
    expect(
      isConfigured({ apiUrl: 'https://api.green-api.com', idInstance: '', apiTokenInstance: '' }),
    ).toBe(false);
    expect(
      isConfigured({
        apiUrl: 'https://api.green-api.com',
        idInstance: '100',
        apiTokenInstance: 'token',
      }),
    ).toBe(true);
  });
});
