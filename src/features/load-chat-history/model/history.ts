import type { ChatPreview, IncomingMessage } from '@/entities/chat/model/types'
import type { Message, MessageStatus } from '@/entities/message/model/types'
import type { GreenApiHistoryMessage, GreenApiJournalMessage } from '@/shared/api/green-api/types'

function formatHistoryTime(timestamp?: number): string {
  return timestamp ? new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp * 1000)) : ''
}

function getStatus(message: GreenApiHistoryMessage): MessageStatus | undefined {
  if (message.type !== 'outgoing') return undefined
  if (message.statusMessage === 'read') return 'read'
  if (message.statusMessage === 'delivered') return 'delivered'
  if (message.statusMessage === 'failed') return 'error'
  return 'sent'
}

function getText(message: GreenApiHistoryMessage): string {
  return message.textMessage || message.extendedTextMessage?.text || message.messageData?.textMessageData?.textMessage || message.caption || 'Вложение'
}

export function toMessages(history: GreenApiHistoryMessage[]): Message[] {
  return history.slice().reverse().map((item, index) => ({ id: item.idMessage || `history-${index}`, mine: item.type === 'outgoing', text: getText(item), time: formatHistoryTime(item.timestamp), status: getStatus(item) }))
}

export function toChatPreviews(journal: GreenApiJournalMessage[]): ChatPreview[] {
  const latestByChatId = new Map<string, GreenApiJournalMessage>()
  journal.forEach((message) => {
    if (!message.chatId) return
    const current = latestByChatId.get(message.chatId)
    if (!current || (message.timestamp || 0) > (current.timestamp || 0)) latestByChatId.set(message.chatId, message)
  })
  return [...latestByChatId.entries()].map(([chatId, message]) => ({ chatId, text: getText(message), time: formatHistoryTime(message.timestamp), timestamp: message.timestamp || 0, mine: message.type === 'outgoing', status: getStatus(message), externalId: message.idMessage }))
}

export function toIncomingJournalMessages(journal: GreenApiJournalMessage[]): IncomingMessage[] {
  return journal
    .filter((message) => message.type === 'incoming' && Boolean(message.chatId) && Boolean(message.idMessage))
    .map((message) => ({ id: message.idMessage, chatId: message.chatId as string, name: message.chatId as string, text: getText(message), time: formatHistoryTime(message.timestamp) }))
}
