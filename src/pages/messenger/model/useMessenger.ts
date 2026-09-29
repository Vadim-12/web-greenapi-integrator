import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyChatPreviews, applyIncomingMessage, createChat, markChatRead } from '@/entities/chat/model/chat-model'
import { demoChats } from '@/entities/chat/model/fixtures'
import type { Chat, IncomingMessage } from '@/entities/chat/model/types'
import { demoMessages } from '@/entities/message/model/fixtures'
import { addMessage, updateMessageExternalId, updateMessageStatus, updateMessageStatusByExternalId } from '@/entities/message/model/message-model'
import type { Message } from '@/entities/message/model/types'
import { defaultConnectionSettings, isConfigured, type ConnectionSettings } from '@/features/connect-instance/model/types'
import { loadConnectionSettings, saveConnectionSettings } from '@/features/connect-instance/model/storage'
import { toChatPreviews, toIncomingJournalMessages, toMessages } from '@/features/load-chat-history/model/history'
import { useNotificationPolling } from '@/features/receive-notifications/model/useNotificationPolling'
import type { OutgoingMessageStatus } from '@/features/receive-notifications/model/types'
import { messengerById } from '@/shared/config/messengers'
import { GreenApiClient } from '@/shared/api/green-api/client'
import type { GreenApiChat } from '@/shared/api/green-api/types'
import { createId } from '@/shared/lib/id/createId'
import { createDemoChatId, isDemoChatId } from '@/shared/lib/messenger/demoChatId'
import { formatCurrentTime } from '@/shared/lib/time/formatCurrentTime'
import type { MessengerId } from '@/shared/types/messenger'
import type { MessengerWorkspace, MessengerWorkspaces } from '@/pages/messenger/model/types'

function createWorkspace(messengerId: MessengerId, savedSettings?: ConnectionSettings): MessengerWorkspace {
  const settings = savedSettings || defaultConnectionSettings
  const connected = isConfigured(settings)
  if (connected) return { settings: { ...settings }, connected, isChatsLoading: true, isHistoryLoading: false, chats: [], messages: {}, activeChatId: '', search: '', notice: `Подключено. Список чатов загружается из ${messengerById[messengerId].name} API.` }
  const chats = demoChats.map((chat) => ({ ...chat, id: createDemoChatId(messengerId, chat.id) }))
  const messages = Object.fromEntries(Object.entries(demoMessages).map(([chatId, items]) => [createDemoChatId(messengerId, chatId), items]))
  return { settings: { ...settings }, connected, isChatsLoading: false, isHistoryLoading: false, chats, messages, activeChatId: chats[0].id, search: '', notice: `Демо-режим: сообщения не уходят в ${messengerById[messengerId].name}.` }
}

function createInitialWorkspaces(): MessengerWorkspaces {
  const savedSettings = loadConnectionSettings()
  return {
    telegram: createWorkspace('telegram', savedSettings.telegram),
    whatsapp: createWorkspace('whatsapp', savedSettings.whatsapp),
    max: createWorkspace('max', savedSettings.max),
  }
}

const demoReadDelay = 700
const loadingWatchdogDelay = 8500
const journalSyncInterval = 7000

function toChat(item: GreenApiChat): Chat | null {
  const id = item.chatId || item.id
  if (!id) return null
  return { ...createChat(id, item.name || id), unread: item.unreadCount || 0 }
}

function hasSameSettings(left: ConnectionSettings, right: ConnectionSettings): boolean {
  return left.apiUrl === right.apiUrl && left.idInstance === right.idInstance && left.apiTokenInstance === right.apiTokenInstance
}

export function useMessenger() {
  const [messengerId, setMessengerId] = useState<MessengerId>('telegram')
  const [workspaces, setWorkspaces] = useState<MessengerWorkspaces>(createInitialWorkspaces)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [createChatOpen, setCreateChatOpen] = useState(false)
  const lastTypingAt = useRef(0)
  const knownJournalMessageIds = useRef(new Set<string>())
  const workspace = workspaces[messengerId]
  const messenger = messengerById[messengerId]
  const client = useMemo(() => workspace.connected && isConfigured(workspace.settings) ? new GreenApiClient(workspace.settings) : null, [workspace.connected, workspace.settings])
  const activeChat = workspace.chats.find((chat) => chat.id === workspace.activeChatId) || null
  const visibleChats = workspace.chats.filter((chat) => chat.name.toLowerCase().includes(workspace.search.toLowerCase()))
  const updateWorkspace = useCallback((updater: (current: MessengerWorkspace) => MessengerWorkspace) => setWorkspaces((current) => ({ ...current, [messengerId]: updater(current[messengerId]) })), [messengerId])

  useEffect(() => {
    saveConnectionSettings({ telegram: workspaces.telegram.settings, whatsapp: workspaces.whatsapp.settings, max: workspaces.max.settings })
  }, [workspaces])

  const onIncoming = useCallback((message: IncomingMessage) => updateWorkspace((current) => ({ ...current, chats: applyIncomingMessage(current.chats, message, current.activeChatId), messages: addMessage(current.messages, message.chatId, { id: message.id || createId(), mine: false, text: message.text, time: message.time }) })), [updateWorkspace])
  const onOutgoingStatus = useCallback((status: OutgoingMessageStatus) => updateWorkspace((current) => ({
    ...current,
    messages: updateMessageStatusByExternalId(current.messages, status.chatId, status.messageId, status.status),
    notice: status.status === 'error' ? `Сообщение не доставлено: ${status.description || 'Telegram отклонил отправку.'}` : current.notice,
  })), [updateWorkspace])
  const onPollingError = useCallback((message: string) => updateWorkspace((current) => ({ ...current, connected: false, isChatsLoading: false, isHistoryLoading: false, notice: `Не удалось получить уведомления: ${message}` })), [updateWorkspace])
  useNotificationPolling({ client, onMessage: onIncoming, onOutgoingStatus, onError: onPollingError })

  useEffect(() => {
    if (!client) return undefined
    let cancelled = false
    const watchdogId = window.setTimeout(() => {
      if (!cancelled) updateWorkspace((current) => current.isChatsLoading ? { ...current, isChatsLoading: false, notice: 'Не удалось дождаться списка чатов. Проверьте доступность API и попробуйте подключиться ещё раз.' } : current)
    }, loadingWatchdogDelay)
    void client.getChats()
      .then((items) => {
        if (cancelled) return
        const chats = items.map(toChat).filter((chat): chat is Chat => Boolean(chat))
        updateWorkspace((current) => ({ ...current, isChatsLoading: false, chats, messages: {}, activeChatId: '', notice: chats.length ? `Загружено чатов: ${chats.length}. Выберите чат, чтобы загрузить историю.` : 'В API пока нет доступных чатов.' }))
      })
      .catch((error) => {
        if (!cancelled) updateWorkspace((current) => ({ ...current, isChatsLoading: false, notice: `Не удалось загрузить список чатов: ${error instanceof Error ? error.message : 'неизвестная ошибка'}` }))
      })
    return () => { cancelled = true; window.clearTimeout(watchdogId) }
  }, [client, updateWorkspace])

  useEffect(() => {
    if (!client) return undefined
    let cancelled = false
    let initialized = false
    knownJournalMessageIds.current = new Set()
    const syncJournal = async () => {
      try {
        const journal = await client.getRecentMessages()
        if (cancelled) return
        const incoming = toIncomingJournalMessages(journal)
        const newMessages = incoming.filter((message) => !knownJournalMessageIds.current.has(message.id as string))
        incoming.forEach((message) => knownJournalMessageIds.current.add(message.id as string))
        const shouldAppendMessages = initialized
        initialized = true
        updateWorkspace((current) => {
          const withPreviews = { ...current, chats: applyChatPreviews(current.chats, toChatPreviews(journal)) }
          if (!shouldAppendMessages) return withPreviews
          return newMessages.reduce((result, message) => {
            if (result.messages[message.chatId]?.some((item) => item.id === message.id)) return result
            return { ...result, chats: applyIncomingMessage(result.chats, message, result.activeChatId), messages: addMessage(result.messages, message.chatId, { id: message.id as string, mine: false, text: message.text, time: message.time }) }
          }, withPreviews)
        })
      } catch {
        // Уведомления остаются основным каналом; ошибка журнала не должна отключать API.
      }
    }
    void syncJournal()
    const intervalId = window.setInterval(() => { void syncJournal() }, journalSyncInterval)
    return () => { cancelled = true; window.clearInterval(intervalId) }
  }, [client, updateWorkspace])

  useEffect(() => {
    const chatId = workspace.activeChatId
    if (!client || !chatId || isDemoChatId(messengerId, chatId)) return undefined
    let cancelled = false
    const watchdogId = window.setTimeout(() => {
      if (!cancelled) updateWorkspace((current) => current.isHistoryLoading ? { ...current, isHistoryLoading: false, notice: 'Не удалось дождаться истории сообщений. Попробуйте выбрать чат ещё раз.' } : current)
    }, loadingWatchdogDelay)
    void client.getChatHistory(chatId)
      .then((history) => {
        if (!cancelled) updateWorkspace((current) => ({ ...current, isHistoryLoading: false, messages: { ...current.messages, [chatId]: toMessages(history) }, notice: `Загружена история чата: ${history.length} сообщений.` }))
      })
      .catch((error) => {
        if (!cancelled) updateWorkspace((current) => ({ ...current, isHistoryLoading: false, notice: `Не удалось загрузить историю: ${error instanceof Error ? error.message : 'неизвестная ошибка'}` }))
      })
    return () => { cancelled = true; window.clearTimeout(watchdogId) }
  }, [client, messengerId, updateWorkspace, workspace.activeChatId])

  function selectMessenger(nextId: MessengerId) { setMessengerId(nextId); setSettingsOpen(false); setCreateChatOpen(false) }
  function selectChat(chatId: string) { updateWorkspace((current) => ({ ...current, activeChatId: chatId, isHistoryLoading: current.connected && !isDemoChatId(messengerId, chatId), chats: markChatRead(current.chats, chatId) })) }
  function setSearch(search: string) { updateWorkspace((current) => ({ ...current, search })) }
  function connect(settings: ConnectionSettings) { updateWorkspace((current) => current.connected && hasSameSettings(current.settings, settings) ? current : { ...current, settings, connected: true, isChatsLoading: true, isHistoryLoading: false, chats: [], messages: {}, activeChatId: '', notice: `Подключено. Список чатов загружается из ${messenger.name} API.` }); setSettingsOpen(false) }
  function addChat(id: string, name: string) { updateWorkspace((current) => { const chat = createChat(id, name); return { ...current, chats: current.chats.some((item) => item.id === id) ? current.chats : [chat, ...current.chats], messages: { ...current.messages, [id]: current.messages[id] || [] }, activeChatId: id, isHistoryLoading: current.connected } }); setCreateChatOpen(false) }
  async function send(text: string) {
    const chatId = workspace.activeChatId
    if (!chatId) return
    const message: Message = { id: createId(), mine: true, text, time: formatCurrentTime(), status: 'sending' }
    updateWorkspace((current) => ({ ...current, messages: addMessage(current.messages, chatId, message), chats: current.chats.map((chat) => chat.id === chatId ? { ...chat, last: text, time: message.time } : chat) }))
    if (isDemoChatId(messengerId, chatId)) {
      updateWorkspace((current) => ({ ...current, messages: updateMessageStatus(current.messages, chatId, message.id, 'sent') }))
      window.setTimeout(() => updateWorkspace((current) => ({ ...current, messages: updateMessageStatus(current.messages, chatId, message.id, 'read') })), demoReadDelay)
      return
    }
    if (!client) return
    try {
      const externalId = await client.sendMessage(chatId, text)
      updateWorkspace((current) => ({
        ...current,
        messages: updateMessageStatus(
          externalId ? updateMessageExternalId(current.messages, chatId, message.id, externalId) : current.messages,
          chatId,
          message.id,
          'sent',
        ),
      }))
    }
    catch (error) { updateWorkspace((current) => ({ ...current, messages: updateMessageStatus(current.messages, chatId, message.id, 'error'), notice: `Сообщение не отправлено: ${error instanceof Error ? error.message : 'неизвестная ошибка'}` })) }
  }

  const sendTyping = useCallback(() => {
    if (!client || isDemoChatId(messengerId, workspace.activeChatId)) return
    const now = Date.now()
    if (now - lastTypingAt.current < 1500) return
    lastTypingAt.current = now
    void client.sendTyping(workspace.activeChatId).catch(() => undefined)
  }, [client, messengerId, workspace.activeChatId])

  return { activeChat, activeChatId: workspace.activeChatId, canSend: Boolean(activeChat) && !workspace.isHistoryLoading && (workspace.connected || isDemoChatId(messengerId, workspace.activeChatId)), chats: visibleChats, connected: workspace.connected, createChatOpen, isChatsLoading: workspace.isChatsLoading, isHistoryLoading: workspace.isHistoryLoading, messages: workspace.messages[workspace.activeChatId] || [], messenger, messengerId, notice: workspace.notice, search: workspace.search, settings: workspace.settings, settingsOpen, addChat, connect, selectChat, selectMessenger, send, sendTyping, setCreateChatOpen, setSearch, setSettingsOpen }
}
