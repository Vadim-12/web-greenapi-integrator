export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error'
export type Message = { id: string; externalId?: string; mine: boolean; text: string; time: string; status?: MessageStatus }
