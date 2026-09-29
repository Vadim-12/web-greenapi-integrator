import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { CreateChatModalProps } from '@/features/create-chat/ui/types'
import { useModalFocus } from '@/shared/lib/dom/useModalFocus'

export function CreateChatModal({ onCreate, onClose, messenger }: CreateChatModalProps) {
  const [name, setName] = useState('')
  const [chatId, setChatId] = useState('')
  const modalRef = useRef<HTMLElement>(null)
  useModalFocus(modalRef)
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const id = chatId.trim(); if (id) onCreate(id, name) }
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="create-chat-modal-title" onMouseDown={(event) => event.stopPropagation()}><form onSubmit={submit}>
    <div className="modal-title"><h2 id="create-chat-modal-title">Новый чат</h2><button type="button" data-autofocus onClick={onClose} aria-label="Закрыть">×</button></div>
    <label>Имя контакта<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Иван Петров" /></label>
    <label>Идентификатор чата<input required value={chatId} onChange={(event) => setChatId(event.target.value)} placeholder={messenger.chatIdPlaceholder} /></label>
    {messenger.id === 'telegram' && <p>Для Telegram одного ID недостаточно: сначала начните обычный диалог с получателем из аккаунта, подключённого к GREEN-API, либо выберите чат из списка API.</p>}
    <button className="primary" type="submit">Создать чат</button>
  </form></section></div>
}
