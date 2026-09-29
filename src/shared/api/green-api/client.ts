import type { GreenApiChat, GreenApiConfig, GreenApiHistoryMessage, GreenApiJournalMessage, GreenApiNotification, GreenApiSendMessageResponse } from '@/shared/api/green-api/types'
import { parseJsonResponse } from '@/shared/lib/http/parseJsonResponse'
import { trimTrailingSlash } from '@/shared/lib/string/trimTrailingSlash'

const jsonHeaders = { 'Content-Type': 'application/json' }
const requestTimeout = 15000
const loadingRequestTimeout = 8000
const rateLimitRetryDelay = 1100

export class GreenApiClient {
  private readonly config: GreenApiConfig

  constructor(config: GreenApiConfig) {
    this.config = config
  }

  async sendMessage(chatId: string, message: string): Promise<string | null> {
    const response = await this.request('sendMessage', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ chatId, message }),
    })
    const idMessage = (response as GreenApiSendMessageResponse).idMessage
    return typeof idMessage === 'string' ? idMessage : null
  }

  async getChats(): Promise<GreenApiChat[]> {
    const response = await this.retryAfterRateLimit(() => this.request('getChats', { method: 'GET' }, loadingRequestTimeout))
    return Array.isArray(response) ? response : []
  }

  async getChatHistory(chatId: string, count = 50): Promise<GreenApiHistoryMessage[]> {
    const response = await this.retryAfterRateLimit(() => this.request('getChatHistory', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ chatId, count }),
    }, loadingRequestTimeout))
    return Array.isArray(response) ? response as GreenApiHistoryMessage[] : []
  }

  async getRecentMessages(): Promise<GreenApiJournalMessage[]> {
    const [incoming, outgoing] = await Promise.all([
      this.retryAfterRateLimit(() => this.request('lastIncomingMessages?minutes=1440', { method: 'GET' }, loadingRequestTimeout)),
      this.retryAfterRateLimit(() => this.request('lastOutgoingMessages?minutes=1440', { method: 'GET' }, loadingRequestTimeout)),
    ])
    return [...(Array.isArray(incoming) ? incoming : []), ...(Array.isArray(outgoing) ? outgoing : [])] as GreenApiJournalMessage[]
  }

  async receiveNotification(signal?: AbortSignal): Promise<GreenApiNotification> {
    const response = await this.request('receiveNotification?receiveTimeout=5', { signal }, requestTimeout, [408])
    return response && typeof response === 'object' ? response as GreenApiNotification : {}
  }

  async deleteNotification(receiptId: number): Promise<void> {
    const { apiUrl, idInstance, apiTokenInstance } = this.config
    const base = trimTrailingSlash(apiUrl)
    const response = await this.fetchWithTimeout(`${base}/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${receiptId}`, { method: 'DELETE' }, requestTimeout)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
  }

  async sendTyping(chatId: string, typingTime = 2000): Promise<void> {
    await this.request('sendTyping', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ chatId, typingTime }),
    })
  }

  private async request(method: string, init?: RequestInit, timeout = requestTimeout, acceptedErrorStatuses: number[] = []): Promise<unknown> {
    const { apiUrl, idInstance, apiTokenInstance } = this.config
    const base = trimTrailingSlash(apiUrl)
    const [path, query] = method.split('?')
    const url = `${base}/waInstance${idInstance}/${path}/${apiTokenInstance}${query ? `?${query}` : ''}`
    const response = await this.fetchWithTimeout(url, init, timeout)
    if (!response.ok && !acceptedErrorStatuses.includes(response.status)) throw new Error(`HTTP ${response.status}`)
    if (init?.method === 'DELETE') return undefined
    return parseJsonResponse(response)
  }

  private async retryAfterRateLimit<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request()
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'HTTP 429') throw error
      await new Promise<void>((resolve) => window.setTimeout(resolve, rateLimitRetryDelay))
      return request()
    }
  }

  private async fetchWithTimeout(url: string, init: RequestInit | undefined, timeout: number): Promise<Response> {
    const controller = new AbortController()
    const externalSignal = init?.signal
    const abortFromOutside = () => controller.abort()
    externalSignal?.addEventListener('abort', abortFromOutside, { once: true })
    const timeoutId = window.setTimeout(() => controller.abort(), timeout)
    try {
      return await fetch(url, { ...init, signal: controller.signal })
    } catch (error) {
      if (controller.signal.aborted) throw new Error('Превышено время ожидания ответа API')
      throw error
    } finally {
      window.clearTimeout(timeoutId)
      externalSignal?.removeEventListener('abort', abortFromOutside)
    }
  }
}
