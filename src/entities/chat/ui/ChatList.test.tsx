import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatList } from '@/entities/chat/ui/ChatList'

describe('ChatList', () => {
  it('показывает количество непрочитанных сообщений бейджем', () => {
    render(<ChatList activeChatId="" onSelect={vi.fn()} chats={[{ id: 'chat-1', name: 'Иван', initials: 'И', color: '#fff', last: 'Привет', time: '12:00', unread: 3 }]} />)

    expect(screen.getByLabelText('Непрочитанных сообщений: 3')).toHaveTextContent('3')
  })

  it('передаёт идентификатор выбранного чата', () => {
    const onSelect = vi.fn()
    render(<ChatList activeChatId="" onSelect={onSelect} chats={[{ id: 'chat-1', name: 'Иван', initials: 'И', color: '#fff', last: 'Привет', time: '12:00', unread: 0 }]} />)

    fireEvent.click(screen.getByRole('button', { name: /Иван/ }))
    expect(onSelect).toHaveBeenCalledWith('chat-1')
  })

  it('не показывает доставленное последнее сообщение как прочитанное', () => {
    render(<ChatList activeChatId="" onSelect={vi.fn()} chats={[{ id: 'chat-1', name: 'Иван', initials: 'И', color: '#fff', last: 'Привет', time: '12:00', unread: 0, lastMine: true, lastStatus: 'delivered' }]} />)

    expect(screen.getByTitle('Доставлено')).toHaveTextContent('✓')
  })
})
