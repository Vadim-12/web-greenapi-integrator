import { useEffect } from 'react'
import { toIncomingMessage, toOutgoingMessageStatus } from '@/features/receive-notifications/model/notification'
import type { NotificationPollingOptions } from '@/features/receive-notifications/model/types'

const emptyNotificationDelay = 1000

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

export function useNotificationPolling({ client, onMessage, onOutgoingStatus, onError }: NotificationPollingOptions) {
  useEffect(() => {
    if (!client) return undefined
    const activeClient = client
    const abortController = new AbortController()
    let stopped = false
    async function poll() {
      while (!stopped) {
        try {
          const notification = await activeClient.receiveNotification(abortController.signal)
          if (!notification.receiptId) {
            await wait(emptyNotificationDelay)
            continue
          }
          const message = toIncomingMessage(notification, new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date()))
          if (message) onMessage(message)
          const outgoingStatus = toOutgoingMessageStatus(notification)
          if (outgoingStatus) onOutgoingStatus(outgoingStatus)
          await activeClient.deleteNotification(notification.receiptId)
        } catch (error) {
          if (!stopped) onError(error instanceof Error ? error.message : 'Неизвестная ошибка')
          break
        }
      }
    }
    void poll()
    return () => { stopped = true; abortController.abort() }
  }, [client, onError, onMessage, onOutgoingStatus])
}
