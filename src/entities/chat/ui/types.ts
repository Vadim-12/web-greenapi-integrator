import type { Chat } from '@/entities/chat/model/types'

export type AvatarProps = Pick<Chat, 'name' | 'initials' | 'color' | 'avatarUrl'>
export type ChatListProps = { chats: Chat[]; activeChatId: string; onSelect: (id: string) => void }
