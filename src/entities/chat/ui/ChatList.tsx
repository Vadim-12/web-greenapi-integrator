import { Avatar } from '@/entities/chat/ui/Avatar'
import type { ChatListProps } from '@/entities/chat/ui/types'

export function ChatList({ chats, activeChatId, onSelect }: ChatListProps) {
  return <section className="chat-list" aria-label="Список чатов">
    {!chats.length && <p className="empty-chat-list">Чатов пока нет</p>}
    {chats.map((chat) => <button className={`chat-row ${chat.id === activeChatId ? 'active' : ''}`} onClick={() => onSelect(chat.id)} key={chat.id}>
      <Avatar {...chat} /><span className="chat-info"><b>{chat.name}</b><small>{chat.last}</small></span>
      <span className="chat-meta"><small>{chat.time}</small>{chat.unread > 0 && <span className="unread-badge" aria-label={`Непрочитанных сообщений: ${chat.unread}`}>{chat.unread > 99 ? '99+' : chat.unread}</span>}</span>
    </button>)}
  </section>
}
