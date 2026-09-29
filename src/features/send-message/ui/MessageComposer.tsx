import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { MessageComposerProps } from '@/features/send-message/model/types'

export function MessageComposer({ chatId, disabled, isLoading, messengerName, onSend, onAttach, onTyping }: MessageComposerProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
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
  async function attach(file: File | undefined) {
    if (!file || !onAttach || disabled || uploading) return
    setUploading(true)
    try { await onAttach(file) } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }
  return <form className="composer" onSubmit={submit}><input ref={fileInputRef} className="file-input" type="file" aria-label="Выбрать вложение" onChange={(event) => { void attach(event.target.files?.[0]) }} /><button type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled || uploading} title="Прикрепить файл" aria-label="Прикрепить файл">{uploading ? '…' : '＋'}</button><input ref={inputRef} aria-label="Текст сообщения" disabled={disabled} value={text} onChange={(event) => { setText(event.target.value); onTyping?.() }} placeholder={isLoading ? 'Загружаем историю…' : disabled ? `Подключите ${messengerName} API для отправки` : 'Напишите сообщение…'} /><button className="send" type="submit" disabled={!text.trim() || sending || disabled} aria-label="Отправить">{sending ? '…' : '➤'}</button></form>
}
