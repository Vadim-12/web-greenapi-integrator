import { describe, expect, it } from 'vitest';
import {
  loadConnectionSettings,
  saveConnectionSettings,
} from '@/features/connect-instance/model/storage';

describe('connection storage', () => {
  it('сохраняет настройки каждой платформы и восстанавливает их после перезагрузки', () => {
    saveConnectionSettings({
      telegram: { apiUrl: 'https://tg.example', idInstance: '1', apiTokenInstance: 'tg-token' },
      whatsapp: { apiUrl: 'https://wa.example', idInstance: '2', apiTokenInstance: 'wa-token' },
      max: { apiUrl: 'https://max.example', idInstance: '3', apiTokenInstance: 'max-token' },
    });

    expect(loadConnectionSettings().whatsapp).toEqual({
      apiUrl: 'https://wa.example',
      idInstance: '2',
      apiTokenInstance: 'wa-token',
    });
  });

  it('игнорирует повреждённые данные браузерного хранилища', () => {
    window.localStorage.setItem(
      'green-api-test:connection-settings:v1',
      JSON.stringify({ telegram: { idInstance: 1 } }),
    );

    expect(loadConnectionSettings()).toEqual({});
  });
});
