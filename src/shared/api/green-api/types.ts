export type GreenApiConfig = {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
};

export type GreenApiChat = {
  chatId?: string;
  id?: string;
  newChatId?: string;
  name?: string;
  type?: 'user' | 'group' | 'supergroup' | 'channel';
  unreadCount?: number;
};

export type GreenApiAvatar = { urlAvatar?: string };

export type GreenApiHistoryMessage = {
  idMessage?: string;
  type?: 'incoming' | 'outgoing';
  timestamp?: number;
  textMessage?: string;
  caption?: string;
  statusMessage?: string;
  senderName?: string;
  urlAvatar?: string;
  typeMessage?: string;
  downloadUrl?: string;
  fileName?: string;
  mimeType?: string;
  jpegThumbnail?: string;
  videoNote?: boolean;
  extendedTextMessage?: { text?: string };
  messageData?: { textMessageData?: { textMessage?: string } };
};

export type GreenApiJournalMessage = GreenApiHistoryMessage & {
  chatId?: string;
};

export type GreenApiSendMessageResponse = { idMessage?: string };
export type GreenApiDownloadFileResponse = { downloadUrl?: string };

export type GreenApiSenderData = { chatId?: string; sender?: string; senderName?: string };
export type GreenApiTextMessageData = { textMessage?: string };
export type GreenApiExtendedTextMessageData = { text?: string };
export type GreenApiFileMessageData = {
  caption?: string;
  downloadUrl?: string;
  fileName?: string;
  mimeType?: string;
  jpegThumbnail?: string;
  videoNote?: boolean;
};

export type GreenApiMessageData = {
  typeMessage?: string;
  textMessageData?: GreenApiTextMessageData;
  extendedTextMessageData?: GreenApiExtendedTextMessageData;
  fileMessageData?: GreenApiFileMessageData;
};

export type GreenApiNotificationBody = {
  typeWebhook?: string;
  chatId?: string;
  idMessage?: string;
  status?: string;
  description?: string;
  senderData?: GreenApiSenderData;
  messageData?: GreenApiMessageData;
};
export type GreenApiNotification = { receiptId?: number; body?: GreenApiNotificationBody };
