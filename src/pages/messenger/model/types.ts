import type { Chat } from '@/entities/chat/model/types'
import type { Message } from '@/entities/message/model/types'
import type { ConnectionSettings } from '@/features/connect-instance/model/types'
import type { MessengerId } from '@/shared/types/messenger'

export type MessengerWorkspace = {
  settings: ConnectionSettings
  connected: boolean
  isChatsLoading: boolean
  isHistoryLoading: boolean
  chats: Chat[]
  messages: Record<string, Message[]>
  hasOlderMessages: Record<string, boolean>
  activeChatId: string
  search: string
  notice: string
}

export type MessengerWorkspaces = Record<MessengerId, MessengerWorkspace>
