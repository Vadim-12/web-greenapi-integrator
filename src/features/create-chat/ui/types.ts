import type { MessengerMeta } from '@/shared/types/messenger';

export type CreateChatModalProps = {
  onCreate: (chatId: string, name: string) => void;
  onClose: () => void;
  messenger: MessengerMeta;
};
