import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessageList } from '@/entities/message/ui/MessageList';

describe('MessageList', () => {
  const chat = {
    id: 'chat-1',
    name: 'Иван',
    initials: 'ИВ',
    color: '#4a91f2',
    last: '',
    time: '',
    unread: 0,
  };

  it('не выдаёт принятие сообщения API за доставку адресату', () => {
    render(
      <MessageList
        chat={chat}
        messages={[{ id: '1', mine: true, text: 'Привет', time: '12:00', status: 'sent' }]}
      />,
    );

    expect(screen.getByTitle('Принято API в очередь')).toHaveTextContent('✓');
  });

  it('показывает двойную галочку для прочитанного сообщения', () => {
    render(
      <MessageList
        chat={chat}
        messages={[{ id: '1', mine: true, text: 'Привет', time: '12:00', status: 'read' }]}
      />,
    );

    expect(screen.getByTitle('Прочитано')).toHaveTextContent('✓✓');
  });

  it('показывает одну галочку для доставленного, но не прочитанного сообщения', () => {
    render(
      <MessageList
        chat={chat}
        messages={[{ id: '1', mine: true, text: 'Привет', time: '12:00', status: 'delivered' }]}
      />,
    );

    expect(screen.getByTitle('Доставлено')).toHaveTextContent('✓');
  });

  it('прокручивает загруженную историю к последнему сообщению', () => {
    const originalScrollHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollHeight',
    );
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get: () => 640,
    });

    try {
      render(
        <MessageList
          chat={chat}
          messages={[
            { id: '1', mine: false, text: 'Первое', time: '12:00' },
            { id: '2', mine: false, text: 'Последнее', time: '12:01' },
          ]}
        />,
      );

      expect(screen.getByText('Последнее').closest('.messages')).toHaveProperty('scrollTop', 640);
    } finally {
      if (originalScrollHeight)
        Object.defineProperty(HTMLElement.prototype, 'scrollHeight', originalScrollHeight);
      else delete (HTMLElement.prototype as Partial<HTMLElement>).scrollHeight;
    }
  });

  it('показывает дату и аватар у входящего сообщения', () => {
    const { container } = render(
      <MessageList
        chat={{ ...chat, avatarUrl: 'https://example.test/avatar.jpg' }}
        messages={[
          {
            id: '1',
            mine: false,
            text: 'Привет',
            time: '12:00',
            dateKey: '2026-09-30',
            dateLabel: 'Сегодня',
          },
        ]}
      />,
    );

    expect(screen.getByText('Сегодня')).toBeInTheDocument();
    expect(container.querySelector('.message-sender-avatar img')).toHaveAttribute(
      'src',
      'https://example.test/avatar.jpg',
    );
  });

  it('отображает изображение, аудио, видео и видеосообщение', () => {
    const { container } = render(
      <MessageList
        chat={chat}
        messages={[
          {
            id: 'image',
            mine: false,
            text: '',
            time: '12:00',
            attachment: {
              kind: 'image',
              name: 'photo.jpg',
              type: 'image/jpeg',
              url: 'https://example.test/photo.jpg',
            },
          },
          {
            id: 'audio',
            mine: false,
            text: '',
            time: '12:01',
            attachment: {
              kind: 'audio',
              name: 'voice.ogg',
              type: 'audio/ogg',
              url: 'https://example.test/voice.ogg',
            },
          },
          {
            id: 'video',
            mine: false,
            text: '',
            time: '12:02',
            attachment: {
              kind: 'video',
              name: 'clip.mp4',
              type: 'video/mp4',
              url: 'https://example.test/clip.mp4',
            },
          },
          {
            id: 'note',
            mine: false,
            text: '',
            time: '12:03',
            attachment: {
              kind: 'video-note',
              name: 'note.mp4',
              type: 'video/mp4',
              url: 'https://example.test/note.mp4',
            },
          },
        ]}
      />,
    );

    expect(container.querySelector('.message-image img')).toHaveAttribute(
      'src',
      'https://example.test/photo.jpg',
    );
    expect(container.querySelector('audio')).toBeInTheDocument();
    expect(container.querySelectorAll('video')).toHaveLength(2);
    expect(container.querySelector('.message-video-note')).toBeInTheDocument();
  });
});
