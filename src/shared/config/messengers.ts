import type { MessengerId, MessengerMeta } from '@/shared/types/messenger';

export const messengers: MessengerMeta[] = [
  {
    id: 'telegram',
    name: 'Telegram',
    shortName: 'TG',
    documentationUrl: 'https://green-api.com/telegram/docs/before-start/',
    chatIdPlaceholder: 'Telegram chatId, например 12345678',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    shortName: 'WA',
    documentationUrl: 'https://green-api.com/docs/before-start/',
    chatIdPlaceholder: 'Номер, например 79991234567@c.us',
  },
  {
    id: 'max',
    name: 'MAX',
    shortName: 'MAX',
    documentationUrl: 'https://green-api.com/max/',
    chatIdPlaceholder: 'MAX chatId, например 12345678',
  },
];

export const messengerById: Record<MessengerId, MessengerMeta> = {
  telegram: messengers[0],
  whatsapp: messengers[1],
  max: messengers[2],
};
