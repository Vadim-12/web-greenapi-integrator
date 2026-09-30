import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessengerPage } from '@/pages/messenger/ui/MessengerPage';

describe('MessengerPage integration', () => {
  it('изолирует созданные чаты между вкладками мессенджеров', () => {
    render(<MessengerPage />);

    fireEvent.click(screen.getByRole('button', { name: 'WA' }));
    fireEvent.click(screen.getByRole('button', { name: /Новый чат/ }));
    fireEvent.change(screen.getByLabelText('Имя контакта'), { target: { value: 'QA WhatsApp' } });
    fireEvent.change(screen.getByLabelText('Идентификатор чата'), {
      target: { value: 'qa-whatsapp-chat' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Создать чат' }));
    expect(screen.getAllByText('QA WhatsApp')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'TG' }));
    expect(screen.queryByText('QA WhatsApp')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'WA' }));
    expect(screen.getAllByText('QA WhatsApp')).toHaveLength(2);
  });
});
