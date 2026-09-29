import type { Message } from '@/entities/message/model/types'

export const demoMessages: Record<string, Message[]> = {
  'demo-alex': [{ id: '1', mine: false, text: 'Привет! Подскажи, встреча сегодня в силе?', time: '11:38' }, { id: '2', mine: true, text: 'Привет! Да, начинаем в 12:00.', time: '11:40', status: 'read' }, { id: '3', mine: false, text: 'Отлично, спасибо!', time: '11:42' }],
  'demo-team': [{ id: '4', mine: false, text: 'Марина: прикрепила макет', time: '10:18' }],
  'demo-maria': [{ id: '5', mine: false, text: 'До связи 👋', time: 'вчера' }],
}
