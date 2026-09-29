export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error'
export type MessageAttachment = { name: string; type: string; url: string }
export type Message = { id: string; externalId?: string; mine: boolean; text: string; time: string; status?: MessageStatus; attachment?: MessageAttachment }
