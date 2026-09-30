export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error'
export type MessageAttachmentKind = 'image' | 'video' | 'video-note' | 'audio' | 'file'

export type MessageAttachment = {
  name: string
  type: string
  url: string
  kind: MessageAttachmentKind
  thumbnailUrl?: string
}
export type Message = { id: string; externalId?: string; mine: boolean; text: string; time: string; dateKey?: string; dateLabel?: string; senderName?: string; senderAvatarUrl?: string; status?: MessageStatus; attachment?: MessageAttachment }
