import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MessageList } from '@/entities/message/ui/MessageList'

describe('MessageList', () => {
  it('не выдаёт принятие сообщения API за доставку адресату', () => {
    render(<MessageList messages={[{ id: '1', mine: true, text: 'Привет', time: '12:00', status: 'sent' }]} />)

    expect(screen.getByTitle('Принято API в очередь')).toHaveTextContent('✓')
  })

  it('показывает двойную галочку для прочитанного сообщения', () => {
    render(<MessageList messages={[{ id: '1', mine: true, text: 'Привет', time: '12:00', status: 'read' }]} />)

    expect(screen.getByTitle('Прочитано')).toHaveTextContent('✓✓')
  })

  it('показывает одну галочку для доставленного, но не прочитанного сообщения', () => {
    render(<MessageList messages={[{ id: '1', mine: true, text: 'Привет', time: '12:00', status: 'delivered' }]} />)

    expect(screen.getByTitle('Доставлено')).toHaveTextContent('✓')
  })

  it('прокручивает загруженную историю к последнему сообщению', () => {
    const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight')
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => 640 })

    try {
      render(<MessageList messages={[{ id: '1', mine: false, text: 'Первое', time: '12:00' }, { id: '2', mine: false, text: 'Последнее', time: '12:01' }]} />)

      expect(screen.getByText('Последнее').closest('.messages')).toHaveProperty('scrollTop', 640)
    } finally {
      if (originalScrollHeight) Object.defineProperty(HTMLElement.prototype, 'scrollHeight', originalScrollHeight)
      else delete (HTMLElement.prototype as Partial<HTMLElement>).scrollHeight
    }
  })
})
