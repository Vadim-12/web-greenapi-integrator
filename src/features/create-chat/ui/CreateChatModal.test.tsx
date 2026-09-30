import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreateChatModal } from '@/features/create-chat/ui/CreateChatModal';
import { messengerById } from '@/shared/config/messengers';

describe('CreateChatModal', () => {
  it('создаёт чат с очищенным идентификатором', () => {
    const onCreate = vi.fn();
    render(
      <CreateChatModal messenger={messengerById.telegram} onCreate={onCreate} onClose={vi.fn()} />,
    );

    fireEvent.change(screen.getByLabelText('Имя контакта'), { target: { value: 'Иван' } });
    fireEvent.change(screen.getByLabelText('Идентификатор чата'), {
      target: { value: '  12345678  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Создать чат' }));

    expect(onCreate).toHaveBeenCalledWith('12345678', 'Иван');
  });
});
