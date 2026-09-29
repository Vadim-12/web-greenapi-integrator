import type { Chat } from '@/entities/chat/model/types'
import type { MessengerId, MessengerMeta } from '@/shared/types/messenger'

export type MessengerSidebarProps = {
  chats: Chat[]
  activeChatId: string
  connected: boolean
  isChatsLoading: boolean
  search: string
  onSearchChange: (value: string) => void
  onSelectChat: (chatId: string) => void
  onOpenSettings: () => void
  onOpenCreateChat: () => void
  messenger: MessengerMeta
  onSelectMessenger: (messengerId: MessengerId) => void
}
