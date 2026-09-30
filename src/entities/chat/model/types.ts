import type { MessageAttachment, MessageStatus } from '@/entities/message/model/types'

export type Chat = {
  id: string
  name: string
  initials: string
  color: string
  last: string
  time: string
  unread: number
  lastMine?: boolean
  lastStatus?: MessageStatus
  lastExternalId?: string
  type?: 'user' | 'group' | 'supergroup' | 'channel'
  avatarUrl?: string | null
}

export type IncomingMessage = { id?: string; chatId: string; name: string; text: string; time: string; dateKey?: string; dateLabel?: string; senderName?: string; senderAvatarUrl?: string; attachment?: MessageAttachment }
export type ChatPreview = { chatId: string; text: string; time: string; timestamp: number; mine: boolean; status?: MessageStatus; externalId?: string }
