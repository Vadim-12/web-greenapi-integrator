import type { Chat, ChatPreview, IncomingMessage } from '@/entities/chat/model/types'

const palette = ['#4a91f2', '#9277ed', '#e9819b', '#f3b34c']

export function createChat(id: string, name: string): Chat {
  const title = name.trim() || id
  return { id, name: title, initials: title.slice(0, 2).toUpperCase(), color: palette[id.length % palette.length], last: 'Начните диалог', time: '', unread: 0 }
}

export function markChatRead(chats: Chat[], chatId: string): Chat[] {
  return chats.map((chat) => chat.id === chatId ? { ...chat, unread: 0 } : chat)
}

export function applyIncomingMessage(chats: Chat[], message: IncomingMessage, activeChatId: string): Chat[] {
  const current = chats.find((chat) => chat.id === message.chatId)
  const update = (chat: Chat): Chat => ({ ...chat, last: message.text, time: message.time, unread: chat.id === activeChatId ? 0 : chat.unread + 1 })
  if (current) return [update(current), ...chats.filter((chat) => chat.id !== message.chatId)]
  return [{ ...createChat(message.chatId, message.name), last: message.text, time: message.time, unread: 1 }, ...chats]
}

export function applyChatPreviews(chats: Chat[], previews: ChatPreview[]): Chat[] {
  const previewsByChatId = new Map(previews.map((preview) => [preview.chatId, preview]))
  return chats.map((chat) => {
    const preview = previewsByChatId.get(chat.id)
    return preview ? { ...chat, last: preview.text, time: preview.time } : chat
  })
}
