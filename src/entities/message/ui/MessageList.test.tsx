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
})
