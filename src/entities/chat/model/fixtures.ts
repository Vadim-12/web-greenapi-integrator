import type { Chat } from '@/entities/chat/model/types';

export const demoChats: Chat[] = [
  {
    id: 'demo-alex',
    name: 'Алексей Смирнов',
    initials: 'АС',
    color: '#f3b34c',
    last: 'Отлично, спасибо!',
    time: '11:42',
    unread: 2,
  },
  {
    id: 'demo-team',
    name: 'Рабочий чат',
    initials: 'РЧ',
    color: '#9277ed',
    last: 'Марина: прикрепила макет',
    time: '10:18',
    unread: 0,
  },
  {
    id: 'demo-maria',
    name: 'Мария Орлова',
    initials: 'МО',
    color: '#e9819b',
    last: 'До связи 👋',
    time: 'вчера',
    unread: 0,
  },
];
