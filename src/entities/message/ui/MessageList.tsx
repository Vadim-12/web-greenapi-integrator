import { useLayoutEffect, useRef } from 'react'
import type { MessageListProps } from '@/entities/message/ui/types'

export function MessageList({ messages, onRetry }: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const previousLastMessageId = useRef<string | undefined>(undefined)

  useLayoutEffect(() => {
    const list = listRef.current
    const lastMessage = messages.at(-1)
    const isInitialRender = previousLastMessageId.current === undefined
    const isNewOwnMessage = lastMessage?.mine && lastMessage.id !== previousLastMessageId.current

    if (list && (isInitialRender || isNewOwnMessage)) list.scrollTop = list.scrollHeight
    previousLastMessageId.current = lastMessage?.id
  }, [messages])

  return <div className="messages" ref={listRef}>{messages.map((message) => <article className={`message ${message.mine ? 'mine' : ''}`} key={message.id}>
    {message.attachment && (message.attachment.type.startsWith('image/') ? <a className="message-image" href={message.attachment.url} target="_blank" rel="noreferrer"><img src={message.attachment.url} alt={message.attachment.name} /></a> : <a className="message-file" href={message.attachment.url} target="_blank" rel="noreferrer">📎 {message.attachment.name}</a>)}
    {message.text && <span>{message.text}</span>}<small>{message.time} {message.mine && <em className={message.status === 'error' ? 'error' : message.status === 'delivered' ? 'delivered' : ''} title={message.status === 'error' ? 'Не удалось отправить' : message.status === 'sending' ? 'Отправляем…' : message.status === 'read' ? 'Прочитано' : message.status === 'delivered' ? 'Доставлено' : 'Принято API в очередь'}>{message.status === 'error' ? '!' : message.status === 'sending' ? '◷' : message.status === 'read' ? '✓✓' : '✓'}</em>}</small>
    {message.status === 'error' && !message.attachment && onRetry && <button className="retry-message" type="button" onClick={() => onRetry(message.id)}>Повторить</button>}
  </article>)}</div>
}
