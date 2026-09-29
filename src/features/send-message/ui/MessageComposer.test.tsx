import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MessageComposer } from '@/features/send-message/ui/MessageComposer'

describe('MessageComposer', () => {
  it('передаёт очищенный текст обработчику отправки', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined)
    render(<MessageComposer chatId="chat-1" messengerName="Telegram" onSend={onSend} />)

    fireEvent.change(screen.getByLabelText('Текст сообщения'), { target: { value: '  Привет  ' } })
    fireEvent.click(screen.getByLabelText('Отправить'))

    expect(onSend).toHaveBeenCalledWith('Привет')
  })

  it('не даёт отправить сообщение без подключения', () => {
    render(<MessageComposer chatId="chat-1" disabled messengerName="Telegram" onSend={vi.fn()} />)
    expect(screen.getByLabelText('Текст сообщения')).toBeDisabled()
    expect(screen.getByLabelText('Отправить')).toBeDisabled()
  })

  it('объясняет блокировку во время загрузки истории', () => {
    render(<MessageComposer chatId="chat-1" disabled isLoading messengerName="Telegram" onSend={vi.fn()} />)

    expect(screen.getByLabelText('Текст сообщения')).toHaveAttribute('placeholder', 'Загружаем историю…')
  })

  it('сообщает о наборе текста', () => {
    const onTyping = vi.fn()
    render(<MessageComposer chatId="chat-1" messengerName="Telegram" onSend={vi.fn()} onTyping={onTyping} />)

    fireEvent.change(screen.getByLabelText('Текст сообщения'), { target: { value: 'П' } })

    expect(onTyping).toHaveBeenCalledOnce()
  })

  it('переводит фокус в поле ввода при открытии чата', () => {
    render(<MessageComposer chatId="chat-1" messengerName="Telegram" onSend={vi.fn()} />)

    expect(screen.getByLabelText('Текст сообщения')).toHaveFocus()
  })
})
