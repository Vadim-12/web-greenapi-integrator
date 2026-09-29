import type { IncomingMessage } from '@/entities/chat/model/types'
import type { GreenApiNotification } from '@/shared/api/green-api/types'
import type { OutgoingMessageStatus } from '@/features/receive-notifications/model/types'

export function toIncomingMessage(notification: GreenApiNotification, time: string): IncomingMessage | null {
  const body = notification.body
  const data = body?.messageData
  const text = data?.textMessageData?.textMessage || data?.extendedTextMessageData?.text || data?.fileMessageData?.caption
  const chatId = body?.senderData?.chatId || body?.senderData?.sender
  return text && chatId ? { id: body?.idMessage, chatId, text, name: body?.senderData?.senderName || chatId, time } : null
}

export function toOutgoingMessageStatus(notification: GreenApiNotification): OutgoingMessageStatus | null {
  const body = notification.body
  if (body?.typeWebhook !== 'outgoingMessageStatus' || !body.chatId || !body.idMessage) return null
  const status = body.status === 'read' ? 'read' : body.status === 'delivered' ? 'delivered' : body.status === 'failed' || body.status === 'noAccount' ? 'error' : 'sent'
  return { chatId: body.chatId, messageId: body.idMessage, status, description: body.description }
}
