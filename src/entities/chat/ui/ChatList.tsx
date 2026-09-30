import { Avatar } from '@/entities/chat/ui/Avatar';
import type { ChatListProps } from '@/entities/chat/ui/types';
import '@/entities/chat/ui/ChatList.scss';

export function ChatList({ chats, activeChatId, onSelect }: ChatListProps) {
  return (
    <section className="chat-list" aria-label="Список чатов">
      {!chats.length && <p className="empty-chat-list">Чатов пока нет</p>}
      {chats.map((chat) => (
        <button
          className={`chat-row ${chat.id === activeChatId ? 'active' : ''} ${chat.unread > 0 ? 'unread' : ''}`}
          onClick={() => onSelect(chat.id)}
          key={chat.id}
        >
          <Avatar {...chat} />
          <span className="chat-info">
            <b>{chat.name}</b>
            <small>
              {chat.lastMine && (
                <em
                  className={`chat-last-status ${chat.lastStatus || 'sent'}`}
                  title={
                    chat.lastStatus === 'read'
                      ? 'Прочитано'
                      : chat.lastStatus === 'delivered'
                        ? 'Доставлено'
                        : chat.lastStatus === 'error'
                          ? 'Не отправлено'
                          : 'Отправлено'
                  }
                >
                  {chat.lastStatus === 'error' ? '!' : chat.lastStatus === 'read' ? '✓✓' : '✓'}
                </em>
              )}
              {chat.last}
            </small>
          </span>
          <span className="chat-meta">
            <small>{chat.time}</small>
            {chat.unread > 0 && (
              <span className="unread-badge" aria-label={`Непрочитанных сообщений: ${chat.unread}`}>
                {chat.unread > 99 ? '99+' : chat.unread}
              </span>
            )}
          </span>
        </button>
      ))}
    </section>
  );
}
