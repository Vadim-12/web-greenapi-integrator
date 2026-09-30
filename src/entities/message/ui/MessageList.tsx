import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Avatar } from '@/entities/chat/ui/Avatar';
import { MessageAttachment } from '@/entities/message/ui/MessageAttachment';
import type { MessageListProps } from '@/entities/message/ui/types';
import '@/entities/message/ui/MessageList.scss';

export function MessageList({
  chat,
  messages,
  hasOlderMessages = false,
  onLoadOlder,
  onRetry,
  onRefreshAttachment,
}: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const previousLastMessageId = useRef<string | undefined>(undefined);
  const isLoadingOlder = useRef(false);

  const loadOlder = useCallback(() => {
    const list = listRef.current;
    if (!list || !hasOlderMessages || !onLoadOlder || isLoadingOlder.current) return;
    isLoadingOlder.current = true;
    const previousHeight = list.scrollHeight;
    const previousTop = list.scrollTop;
    const didLoad = onLoadOlder();
    requestAnimationFrame(() => {
      const nextList = listRef.current;
      if (didLoad && nextList)
        nextList.scrollTop = previousTop + nextList.scrollHeight - previousHeight;
      isLoadingOlder.current = false;
    });
  }, [hasOlderMessages, onLoadOlder]);

  const handleScroll = useCallback(() => {
    if ((listRef.current?.scrollTop || 0) < 80) loadOlder();
  }, [loadOlder]);

  useLayoutEffect(() => {
    const list = listRef.current;
    const lastMessage = messages.at(-1);
    const isInitialRender = previousLastMessageId.current === undefined;
    const isNewOwnMessage = lastMessage?.mine && lastMessage.id !== previousLastMessageId.current;

    if (list && (isInitialRender || isNewOwnMessage)) list.scrollTop = list.scrollHeight;
    previousLastMessageId.current = lastMessage?.id;
  }, [messages]);

  useEffect(() => {
    if ((listRef.current?.scrollTop || 0) < 80) loadOlder();
  }, [hasOlderMessages, loadOlder]);

  return (
    <div className="messages" ref={listRef} onScroll={handleScroll}>
      {messages.map((message, index) => {
        const previous = messages[index - 1];
        const isNewDay = !previous || previous.dateKey !== message.dateKey;
        const sender = {
          ...chat,
          name: message.senderName || chat.name,
          avatarUrl: message.senderAvatarUrl || chat.avatarUrl,
        };

        return (
          <div className="message-entry" key={message.id}>
            {isNewDay && (
              <time className="message-date" dateTime={message.dateKey}>
                {message.dateLabel || 'Сегодня'}
              </time>
            )}
            <div className={`message-row ${message.mine ? 'mine' : ''}`}>
              {!message.mine && (
                <span className="message-sender-avatar">
                  <Avatar {...sender} />
                </span>
              )}
              <article
                className={`message ${message.mine ? 'mine' : ''} ${message.senderName ? 'with-sender' : ''}`}
              >
                {!message.mine && message.senderName && chat.type !== 'user' && (
                  <b className="message-sender-name">{message.senderName}</b>
                )}
                {message.attachment && (
                  <MessageAttachment
                    attachment={message.attachment}
                    onRefresh={() => onRefreshAttachment?.(message.id) || Promise.resolve(false)}
                  />
                )}
                {message.text && <span>{message.text}</span>}
                <small>
                  {message.time}{' '}
                  {message.mine && (
                    <em
                      className={
                        message.status === 'error'
                          ? 'error'
                          : message.status === 'delivered'
                            ? 'delivered'
                            : ''
                      }
                      title={
                        message.status === 'error'
                          ? 'Не удалось отправить'
                          : message.status === 'sending'
                            ? 'Отправляем…'
                            : message.status === 'read'
                              ? 'Прочитано'
                              : message.status === 'delivered'
                                ? 'Доставлено'
                                : 'Принято API в очередь'
                      }
                    >
                      {message.status === 'error'
                        ? '!'
                        : message.status === 'sending'
                          ? '◷'
                          : message.status === 'read'
                            ? '✓✓'
                            : '✓'}
                    </em>
                  )}
                </small>
                {message.status === 'error' && !message.attachment && onRetry && (
                  <button
                    className="retry-message"
                    type="button"
                    onClick={() => onRetry(message.id)}
                  >
                    Повторить
                  </button>
                )}
              </article>
            </div>
          </div>
        );
      })}
    </div>
  );
}
