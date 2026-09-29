import type { Chat } from '@/entities/chat/model/types'
import type { Message } from '@/entities/message/model/types'

export type MessengerDialogProps = {
  chat: Chat | null
  messages: Message[]
  connected: boolean
  isChatsLoading: boolean
  isHistoryLoading: boolean
  notice: string
  canSend: boolean
  messengerName: string
  onSend: (text: string) => Promise<void>
  onTyping: () => void
}
