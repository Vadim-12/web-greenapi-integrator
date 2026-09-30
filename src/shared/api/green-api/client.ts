import axios, { type AxiosRequestConfig } from 'axios';
import type {
  GreenApiAvatar,
  GreenApiChat,
  GreenApiConfig,
  GreenApiDownloadFileResponse,
  GreenApiHistoryMessage,
  GreenApiJournalMessage,
  GreenApiNotification,
  GreenApiSendMessageResponse,
} from '@/shared/api/green-api/types';
import { trimTrailingSlash } from '@/shared/lib/string/trimTrailingSlash';

const jsonHeaders = { 'Content-Type': 'application/json' };
const requestTimeout = 15000;
const loadingRequestTimeout = 8000;
const rateLimitRetryDelay = 1100;
const defaultHistoryCount = 10_000;
const defaultChatsCount = 1000;
const constrainedMethodInterval = 1100;
const methodQueues = new Map<string, Promise<void>>();
const methodLastStartedAt = new Map<string, number>();

export class GreenApiClient {
  private readonly config: GreenApiConfig;

  constructor(config: GreenApiConfig) {
    this.config = config;
  }

  async sendMessage(chatId: string, message: string): Promise<string | null> {
    const response = await this.request('sendMessage', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ chatId, message }),
    });
    const idMessage = (response as GreenApiSendMessageResponse).idMessage;
    return typeof idMessage === 'string' ? idMessage : null;
  }

  async getChats(count = defaultChatsCount): Promise<GreenApiChat[]> {
    const response = await this.runRateLimited('getChats', () =>
      this.retryAfterRateLimit(() =>
        this.request(`getChats?count=${count}`, { method: 'GET' }, loadingRequestTimeout),
      ),
    );
    return Array.isArray(response) ? response : [];
  }

  async getChatHistory(
    chatId: string,
    count = defaultHistoryCount,
  ): Promise<GreenApiHistoryMessage[]> {
    const response = await this.runRateLimited('getChatHistory', () =>
      this.retryAfterRateLimit(() =>
        this.request(
          'getChatHistory',
          {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ chatId, count }),
          },
          loadingRequestTimeout,
        ),
      ),
    );
    return Array.isArray(response) ? (response as GreenApiHistoryMessage[]) : [];
  }

  async getAvatar(chatId: string): Promise<string | null> {
    const response = (await this.request(
      'getAvatar',
      {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ chatId }),
      },
      loadingRequestTimeout,
    )) as GreenApiAvatar;
    const urlAvatar =
      typeof response.urlAvatar === 'string' && response.urlAvatar ? response.urlAvatar : null;
    return urlAvatar;
  }

  async getFileDownloadUrl(chatId: string, idMessage: string): Promise<string | null> {
    const response = (await this.runRateLimited('downloadFile', () =>
      this.request(
        'downloadFile',
        {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({ chatId, idMessage }),
        },
        loadingRequestTimeout,
      ),
    )) as GreenApiDownloadFileResponse;
    return typeof response.downloadUrl === 'string' && response.downloadUrl
      ? response.downloadUrl
      : null;
  }

  async getRecentMessages(minutes = 1440): Promise<GreenApiJournalMessage[]> {
    const [incoming, outgoing] = await Promise.all([
      this.retryAfterRateLimit(() =>
        this.request(
          `lastIncomingMessages?minutes=${minutes}`,
          { method: 'GET' },
          loadingRequestTimeout,
        ),
      ),
      this.retryAfterRateLimit(() =>
        this.request(
          `lastOutgoingMessages?minutes=${minutes}`,
          { method: 'GET' },
          loadingRequestTimeout,
        ),
      ),
    ]);
    return [
      ...(Array.isArray(incoming) ? incoming : []),
      ...(Array.isArray(outgoing) ? outgoing : []),
    ] as GreenApiJournalMessage[];
  }

  async receiveNotification(signal?: AbortSignal): Promise<GreenApiNotification> {
    const response = await this.request(
      'receiveNotification?receiveTimeout=5',
      { signal },
      requestTimeout,
      [408],
    );
    return response && typeof response === 'object' ? (response as GreenApiNotification) : {};
  }

  async deleteNotification(receiptId: number): Promise<void> {
    await this.request(`deleteNotification/${receiptId}`, { method: 'DELETE' });
  }

  async sendTyping(chatId: string, typingTime = 2000): Promise<void> {
    await this.request('sendTyping', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ chatId, typingTime }),
    });
  }

  async sendFile(chatId: string, file: File): Promise<GreenApiSendMessageResponse> {
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('file', file);
    formData.append('fileName', file.name);
    return this.request('sendFileByUpload', {
      method: 'POST',
      body: formData,
    }) as Promise<GreenApiSendMessageResponse>;
  }

  private async request(
    method: string,
    init?: RequestInit,
    timeout = requestTimeout,
    acceptedErrorStatuses: number[] = [],
  ): Promise<unknown> {
    const { apiUrl, idInstance, apiTokenInstance } = this.config;
    const base = trimTrailingSlash(apiUrl);
    const [path, query] = method.split('?');
    const url = `${base}/waInstance${idInstance}/${path}/${apiTokenInstance}${query ? `?${query}` : ''}`;
    const config: AxiosRequestConfig = {
      url,
      method: init?.method || 'GET',
      headers: init?.headers as AxiosRequestConfig['headers'],
      data: init?.body,
      signal: init?.signal || undefined,
      timeout,
      validateStatus: (status) =>
        (status >= 200 && status < 300) || acceptedErrorStatuses.includes(status),
    };
    try {
      const response = await axios.request(config);
      return response.data ?? {};
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED') {
          throw new Error('Превышено время ожидания ответа API', { cause: error });
        }
        if (error.response) {
          throw new Error(`HTTP ${error.response.status}`, { cause: error });
        }
      }
      throw error;
    }
  }

  private async retryAfterRateLimit<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'HTTP 429') throw error;
      await new Promise<void>((resolve) => window.setTimeout(resolve, rateLimitRetryDelay));
      return request();
    }
  }

  private runRateLimited<T>(method: string, request: () => Promise<T>): Promise<T> {
    const instanceKey = `${trimTrailingSlash(this.config.apiUrl)}:${this.config.idInstance}:${method}`;
    const previous = methodQueues.get(instanceKey) || Promise.resolve();
    const run = async () => {
      const wait =
        constrainedMethodInterval - (Date.now() - (methodLastStartedAt.get(instanceKey) || 0));
      if (wait > 0) await new Promise<void>((resolve) => window.setTimeout(resolve, wait));
      methodLastStartedAt.set(instanceKey, Date.now());
      return request();
    };
    const result = previous.then(run, run);
    methodQueues.set(
      instanceKey,
      result.then(
        () => undefined,
        () => undefined,
      ),
    );
    return result;
  }
}
