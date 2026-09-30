import type { ChatPreview, IncomingMessage } from '@/entities/chat/model/types'
import type { Message, MessageAttachment, MessageAttachmentKind, MessageStatus } from '@/entities/message/model/types'
import type { GreenApiHistoryMessage, GreenApiJournalMessage } from '@/shared/api/green-api/types'
import { formatMessageDateFromTimestamp } from '@/shared/lib/time/formatMessageDate'

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
  return message.textMessage || message.extendedTextMessage?.text || message.messageData?.textMessageData?.textMessage || message.caption || ''
}

function getAttachmentKind(typeMessage?: string, mimeType?: string, videoNote?: boolean): MessageAttachmentKind | null {
  if (typeMessage === 'imageMessage' || typeMessage === 'stickerMessage' || mimeType?.startsWith('image/')) return 'image'
  if (typeMessage === 'videoMessage' || mimeType?.startsWith('video/')) return videoNote ? 'video-note' : 'video'
  if (typeMessage === 'audioMessage' || mimeType?.startsWith('audio/')) return 'audio'
  if (typeMessage === 'documentMessage' || mimeType) return 'file'
  return null
}

function asThumbnailUrl(thumbnail?: string): string | undefined {
  if (!thumbnail) return undefined
  return thumbnail.startsWith('data:') ? thumbnail : `data:image/jpeg;base64,${thumbnail}`
}

export function toAttachment(message: Pick<GreenApiHistoryMessage, 'typeMessage' | 'downloadUrl' | 'fileName' | 'mimeType' | 'jpegThumbnail' | 'videoNote'>): MessageAttachment | undefined {
  const kind = getAttachmentKind(message.typeMessage, message.mimeType, message.videoNote)
  const thumbnailUrl = asThumbnailUrl(message.jpegThumbnail)
  const canRenderPreview = kind === 'image' || message.typeMessage === 'extendedTextMessage'
  if ((!kind && !canRenderPreview) || (!message.downloadUrl && !thumbnailUrl)) return undefined
  const extension = message.mimeType?.split('/')[1] || 'bin'
  return {
    kind: kind || 'image',
    url: message.downloadUrl || thumbnailUrl as string,
    name: message.fileName || `Вложение.${extension}`,
    type: message.mimeType || 'application/octet-stream',
    thumbnailUrl,
  }
}

export function toMessages(history: GreenApiHistoryMessage[]): Message[] {
  return history.slice().reverse().map((item, index) => ({
    id: item.idMessage || `history-${index}`,
    externalId: item.idMessage,
    mine: item.type === 'outgoing',
    text: getText(item) || (toAttachment(item) ? '' : 'Вложение'),
    time: formatHistoryTime(item.timestamp),
    ...formatMessageDateFromTimestamp(item.timestamp),
    senderName: item.senderName,
    senderAvatarUrl: item.urlAvatar,
    attachment: toAttachment(item),
    status: getStatus(item),
  }))
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
