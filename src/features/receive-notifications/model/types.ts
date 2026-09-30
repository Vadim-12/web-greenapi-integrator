import type { IncomingMessage } from '@/entities/chat/model/types';
import type { MessageStatus } from '@/entities/message/model/types';
import type { GreenApiClient } from '@/shared/api/green-api/client';

export type NotificationPollingOptions = {
  client: GreenApiClient | null;
  onMessage: (message: IncomingMessage) => void;
  onOutgoingStatus: (status: OutgoingMessageStatus) => void;
  onError: (message: string) => void;
};

export type OutgoingMessageStatus = {
  chatId: string;
  messageId: string;
  status: MessageStatus;
  description?: string;
};
