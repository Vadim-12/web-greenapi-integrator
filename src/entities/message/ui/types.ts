import type { Chat } from '@/entities/chat/model/types';
import type { Message } from '@/entities/message/model/types';

export type MessageListProps = {
  chat: Chat;
  messages: Message[];
  hasOlderMessages?: boolean;
  onLoadOlder?: () => boolean;
  onRetry?: (messageId: string) => void;
  onRefreshAttachment?: (messageId: string) => Promise<boolean>;
};
