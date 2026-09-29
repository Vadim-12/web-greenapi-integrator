import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { MessageComposerProps } from '@/features/send-message/model/types'

export function MessageComposer({ chatId, disabled, isLoading, messengerName, onSend, onTyping }: MessageComposerProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [chatId, disabled])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = text.trim()
    if (!value || sending || disabled) return
    setSending(true)
    try { await onSend(value); setText('') } finally { setSending(false) }
  }
  return <form className="composer" onSubmit={submit}><button type="button" disabled title="Вложения не входят в это тестовое задание" aria-label="Прикрепить файл">＋</button><input ref={inputRef} aria-label="Текст сообщения" disabled={disabled} value={text} onChange={(event) => { setText(event.target.value); onTyping?.() }} placeholder={isLoading ? 'Загружаем историю…' : disabled ? `Подключите ${messengerName} API для отправки` : 'Напишите сообщение…'} /><button className="send" type="submit" disabled={!text.trim() || sending || disabled} aria-label="Отправить">{sending ? '…' : '➤'}</button></form>
}
