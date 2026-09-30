import type { Chat } from '@/entities/chat/model/types'
import type { Message } from '@/entities/message/model/types'

export type MessengerDialogProps = {
  chat: Chat | null
  messages: Message[]
  hasOlderMessages: boolean
  connected: boolean
  isChatsLoading: boolean
  isHistoryLoading: boolean
  notice: string
  canSend: boolean
  messengerName: string
  onSend: (text: string) => Promise<void>
  onAttach: (file: File) => Promise<void>
  onRetry: (messageId: string) => void
  onRefreshAttachment: (messageId: string) => Promise<boolean>
  onLoadOlder: () => boolean
  onTyping: () => void
}
