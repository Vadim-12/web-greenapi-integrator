import type { MessageListProps } from '@/entities/message/ui/types'

export function MessageList({ messages }: MessageListProps) {
  return <div className="messages">{messages.map((message) => <article className={`message ${message.mine ? 'mine' : ''}`} key={message.id}>
    <span>{message.text}</span><small>{message.time} {message.mine && <em className={message.status === 'error' ? 'error' : message.status === 'delivered' ? 'delivered' : ''} title={message.status === 'error' ? 'Не удалось отправить' : message.status === 'sending' ? 'Отправляем…' : message.status === 'read' ? 'Прочитано' : message.status === 'delivered' ? 'Доставлено' : 'Принято API в очередь'}>{message.status === 'error' ? '!' : message.status === 'sending' ? '◷' : message.status === 'read' || message.status === 'delivered' ? '✓✓' : '✓'}</em>}</small>
  </article>)}</div>
}
