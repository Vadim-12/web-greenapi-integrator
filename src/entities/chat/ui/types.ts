import type { Chat } from '@/entities/chat/model/types'

export type AvatarProps = Pick<Chat, 'name' | 'initials' | 'color'>
export type ChatListProps = { chats: Chat[]; activeChatId: string; onSelect: (id: string) => void }
