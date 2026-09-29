export type Chat = {
  id: string
  name: string
  initials: string
  color: string
  last: string
  time: string
  unread: number
}

export type IncomingMessage = { id?: string; chatId: string; name: string; text: string; time: string }
export type ChatPreview = { chatId: string; text: string; time: string; timestamp: number }
