export type GreenApiConfig = {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type GreenApiChat = {
  chatId?: string
  id?: string
  name?: string
  unreadCount?: number
}

export type GreenApiHistoryMessage = {
  idMessage?: string
  type?: 'incoming' | 'outgoing'
  timestamp?: number
  textMessage?: string
  caption?: string
  statusMessage?: string
  extendedTextMessage?: { text?: string }
  messageData?: { textMessageData?: { textMessage?: string } }
}

export type GreenApiJournalMessage = GreenApiHistoryMessage & {
  chatId?: string
}

export type GreenApiSendMessageResponse = { idMessage?: string }

export type GreenApiSenderData = { chatId?: string; sender?: string; senderName?: string }
export type GreenApiTextMessageData = { textMessage?: string }
export type GreenApiExtendedTextMessageData = { text?: string }
export type GreenApiFileMessageData = { caption?: string }

export type GreenApiMessageData = {
  textMessageData?: GreenApiTextMessageData
  extendedTextMessageData?: GreenApiExtendedTextMessageData
  fileMessageData?: GreenApiFileMessageData
}

export type GreenApiNotificationBody = { typeWebhook?: string; chatId?: string; idMessage?: string; status?: string; description?: string; senderData?: GreenApiSenderData; messageData?: GreenApiMessageData }
export type GreenApiNotification = { receiptId?: number; body?: GreenApiNotificationBody }
