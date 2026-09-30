import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConnectionModal } from '@/features/connect-instance/ui/ConnectionModal';
import { messengerById } from '@/shared/config/messengers';

describe('ConnectionModal', () => {
  it('передаёт настройки подключения и закрывает модальное окно', () => {
    const onConnect = vi.fn();
    const onClose = vi.fn();
    render(
      <ConnectionModal
        initialSettings={{
          apiUrl: 'https://api.green-api.com',
          idInstance: '',
          apiTokenInstance: '',
        }}
        messenger={messengerById.telegram}
        onConnect={onConnect}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('button', { name: 'Закрыть' })).toHaveFocus();

    fireEvent.change(screen.getByLabelText('ID инстанса'), { target: { value: '1100000001' } });
    fireEvent.change(screen.getByLabelText('API-токен'), { target: { value: 'token' } });
    fireEvent.click(screen.getByRole('button', { name: 'Подключить' }));

    expect(onConnect).toHaveBeenCalledWith({
      apiUrl: 'https://api.green-api.com',
      idInstance: '1100000001',
      apiTokenInstance: 'token',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
