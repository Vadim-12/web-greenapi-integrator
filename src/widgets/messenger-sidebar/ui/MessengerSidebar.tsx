import { ChatList } from '@/entities/chat/ui/ChatList';
import { messengers } from '@/shared/config/messengers';
import type { MessengerSidebarProps } from '@/widgets/messenger-sidebar/model/types';
import '@/widgets/messenger-sidebar/ui/MessengerSidebar.scss';

export function MessengerSidebar({
  chats,
  activeChatId,
  connected,
  isChatsLoading,
  search,
  onSearchChange,
  onSelectChat,
  onOpenSettings,
  onOpenCreateChat,
  messenger,
  onSelectMessenger,
}: MessengerSidebarProps) {
  const mark = messenger.id === 'telegram' ? '➤' : messenger.shortName;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="messenger-brand">
          <span className="messenger-mark" aria-hidden="true">
            {mark}
          </span>
          <span>{messenger.name}</span>
        </div>
        <button className="icon" onClick={onOpenSettings} aria-label="Настройки">
          ⚙
        </button>
      </div>
      <div className="messenger-switcher" aria-label="Выбор мессенджера">
        {messengers.map((item) => (
          <button
            className={item.id === messenger.id ? 'selected' : ''}
            onClick={() => onSelectMessenger(item.id)}
            key={item.id}
          >
            {item.shortName}
          </button>
        ))}
      </div>
      <button className="new-chat" onClick={onOpenCreateChat}>
        ✎ Новый чат
      </button>
      <label className="search">
        ⌕
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Поиск"
        />
      </label>
      {isChatsLoading ? (
        <div className="chat-skeletons" aria-label="Загрузка чатов">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="chat-skeleton" key={index}>
              <i />
              <span>
                <b />
                <b />
              </span>
            </div>
          ))}
        </div>
      ) : (
        <ChatList chats={chats} activeChatId={activeChatId} onSelect={onSelectChat} />
      )}
      <div className="connection">
        <i className={connected ? 'online' : ''}></i>
        {connected ? `${messenger.name} API подключён` : 'Демо-режим'}
      </div>
    </aside>
  );
}
