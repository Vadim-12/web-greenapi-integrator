import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { applyChatPreviews, applyIncomingMessage, createChat, markChatRead } from '@/entities/chat/model/chat-model'
import { demoChats } from '@/entities/chat/model/fixtures'
import type { Chat, ChatPreview, IncomingMessage } from '@/entities/chat/model/types'
import { demoMessages } from '@/entities/message/model/fixtures'
import { addMessage, updateMessageAttachmentUrl, updateMessageExternalId, updateMessageStatus, updateMessageStatusByExternalId } from '@/entities/message/model/message-model'
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
import { formatMessageDate } from '@/shared/lib/time/formatMessageDate'
import type { MessengerId } from '@/shared/types/messenger'
import type { MessengerWorkspace, MessengerWorkspaces } from '@/pages/messenger/model/types'

function createWorkspace(messengerId: MessengerId, savedSettings?: ConnectionSettings): MessengerWorkspace {
  const settings = savedSettings || defaultConnectionSettings
  const connected = isConfigured(settings)
  if (connected) return { settings: { ...settings }, connected, isChatsLoading: true, isHistoryLoading: false, chats: [], messages: {}, hasOlderMessages: {}, activeChatId: '', search: '', notice: `Подключено. Список чатов загружается из ${messengerById[messengerId].name} API.` }
  const chats = demoChats.map((chat) => ({ ...chat, id: createDemoChatId(messengerId, chat.id) }))
  const messages = Object.fromEntries(Object.entries(demoMessages).map(([chatId, items]) => [createDemoChatId(messengerId, chatId), items]))
  return { settings: { ...settings }, connected, isChatsLoading: false, isHistoryLoading: false, chats, messages, hasOlderMessages: {}, activeChatId: chats[0].id, search: '', notice: `Демо-режим: сообщения не уходят в ${messengerById[messengerId].name}.` }
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
const chatSyncInterval = 30_000
const initialJournalLookbackMinutes = 525_600
const initialHistoryCount = 50

function toChat(item: GreenApiChat): Chat | null {
  const id = item.newChatId || item.chatId || item.id
  if (!id) return null
  return { ...createChat(id, item.name || id), type: item.type, unread: item.unreadCount || 0 }
}

function mergeRemoteChats(currentChats: Chat[], remoteChats: Chat[]): Chat[] {
  const currentById = new Map(currentChats.map((chat) => [chat.id, chat]))
  const remoteById = new Map(remoteChats.map((chat) => [chat.id, chat]))
  const mergeChat = (remoteChat: Chat) => {
    const current = currentById.get(remoteChat.id)
    return current ? { ...remoteChat, ...current, name: remoteChat.name, initials: remoteChat.initials, color: remoteChat.color, type: remoteChat.type } : remoteChat
  }
  const existingChats = currentChats.flatMap((chat) => {
    const remoteChat = remoteById.get(chat.id)
    return remoteChat ? [mergeChat(remoteChat)] : []
  })
  const newChats = remoteChats.filter((chat) => !currentById.has(chat.id)).map(mergeChat)
  return [...existingChats, ...newChats]
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
  const latestChatPreviews = useRef(new Map<string, ChatPreview>())
  const fullHistoryByChatId = useRef(new Map<string, Message[]>())
  const workspace = workspaces[messengerId]
  const workspaceRef = useRef(workspace)
  const messenger = messengerById[messengerId]
  const client = useMemo(() => workspace.connected && isConfigured(workspace.settings) ? new GreenApiClient(workspace.settings) : null, [workspace.connected, workspace.settings])
  const sendTextMutation = useMutation({ mutationFn: ({ chatId, text }: { chatId: string; text: string }) => client ? client.sendMessage(chatId, text) : Promise.reject(new Error('API не подключён')) })
  const sendFileMutation = useMutation({ mutationFn: ({ chatId, file }: { chatId: string; file: File }) => client ? client.sendFile(chatId, file) : Promise.reject(new Error('API не подключён')) })
  const activeChat = workspace.chats.find((chat) => chat.id === workspace.activeChatId) || null
  const visibleChats = workspace.chats.filter((chat) => chat.name.toLowerCase().includes(workspace.search.toLowerCase()))
  const updateWorkspace = useCallback((updater: (current: MessengerWorkspace) => MessengerWorkspace) => setWorkspaces((current) => ({ ...current, [messengerId]: updater(current[messengerId]) })), [messengerId])

  useEffect(() => { workspaceRef.current = workspace }, [workspace])

  useEffect(() => {
    saveConnectionSettings({ telegram: workspaces.telegram.settings, whatsapp: workspaces.whatsapp.settings, max: workspaces.max.settings })
  }, [workspaces])

  const onIncoming = useCallback((message: IncomingMessage) => updateWorkspace((current) => ({ ...current, chats: applyIncomingMessage(current.chats, message, current.activeChatId), messages: addMessage(current.messages, message.chatId, { id: message.id || createId(), mine: false, text: message.text, time: message.time, dateKey: message.dateKey, dateLabel: message.dateLabel, senderName: message.senderName, senderAvatarUrl: message.senderAvatarUrl, attachment: message.attachment }) })), [updateWorkspace])
  const onOutgoingStatus = useCallback((status: OutgoingMessageStatus) => updateWorkspace((current) => ({
    ...current,
    messages: updateMessageStatusByExternalId(current.messages, status.chatId, status.messageId, status.status),
    chats: current.chats.map((chat) => chat.id === status.chatId && chat.lastExternalId === status.messageId ? { ...chat, lastStatus: status.status } : chat),
    notice: status.status === 'error' ? `Сообщение не доставлено: ${status.description || 'Telegram отклонил отправку.'}` : current.notice,
  })), [updateWorkspace])
  const onPollingError = useCallback((message: string) => updateWorkspace((current) => ({ ...current, connected: false, isChatsLoading: false, isHistoryLoading: false, notice: `Не удалось получить уведомления: ${message}` })), [updateWorkspace])
  useNotificationPolling({ client, onMessage: onIncoming, onOutgoingStatus, onError: onPollingError })

  useEffect(() => {
    if (!client) return undefined
    let cancelled = false
    latestChatPreviews.current.clear()
    const syncChats = async (isInitialLoad = false) => {
      try {
        const items = await client.getChats()
        if (cancelled) return
        const chats = items.map(toChat).filter((chat): chat is Chat => Boolean(chat))
        updateWorkspace((current) => ({
          ...current,
          isChatsLoading: false,
          chats: applyChatPreviews(mergeRemoteChats(current.chats, chats), [...latestChatPreviews.current.values()], isInitialLoad),
          notice: isInitialLoad ? chats.length ? 'Выберите чат, чтобы открыть диалог.' : 'В API пока нет доступных чатов.' : current.notice,
        }))
      } catch (error) {
        if (!cancelled && isInitialLoad) updateWorkspace((current) => ({ ...current, isChatsLoading: false, notice: `Не удалось загрузить список чатов: ${error instanceof Error ? error.message : 'неизвестная ошибка'}` }))
      }
    }
    const watchdogId = window.setTimeout(() => {
      if (!cancelled) updateWorkspace((current) => current.isChatsLoading ? { ...current, isChatsLoading: false, notice: 'Не удалось дождаться списка чатов. Проверьте доступность API и попробуйте подключиться ещё раз.' } : current)
    }, loadingWatchdogDelay)
    void syncChats(true)
    const intervalId = window.setInterval(() => { void syncChats() }, chatSyncInterval)
    return () => { cancelled = true; window.clearTimeout(watchdogId); window.clearInterval(intervalId) }
  }, [client, messengerId, updateWorkspace])

  useEffect(() => {
    if (!client) return undefined
    let cancelled = false
    let initialized = false
    knownJournalMessageIds.current = new Set()
    latestChatPreviews.current.clear()
    const syncJournal = async () => {
      try {
        const journal = await client.getRecentMessages(initialized ? undefined : initialJournalLookbackMinutes)
        if (cancelled) return
        const incoming = toIncomingJournalMessages(journal)
        toChatPreviews(journal).forEach((preview) => {
          const currentPreview = latestChatPreviews.current.get(preview.chatId)
          if (!currentPreview || preview.timestamp >= currentPreview.timestamp) latestChatPreviews.current.set(preview.chatId, preview)
        })
        const newMessages = incoming.filter((message) => !knownJournalMessageIds.current.has(message.id as string))
        incoming.forEach((message) => knownJournalMessageIds.current.add(message.id as string))
        const shouldAppendMessages = initialized
        initialized = true
        updateWorkspace((current) => {
          const withPreviews = { ...current, chats: applyChatPreviews(current.chats, [...latestChatPreviews.current.values()]) }
          if (!shouldAppendMessages) return withPreviews
          return newMessages.reduce((result, message) => {
            if (result.messages[message.chatId]?.some((item) => item.id === message.id)) return result
            return { ...result, chats: applyIncomingMessage(result.chats, message, result.activeChatId), messages: addMessage(result.messages, message.chatId, { id: message.id as string, mine: false, text: message.text, time: message.time, dateKey: message.dateKey, dateLabel: message.dateLabel, senderName: message.senderName, senderAvatarUrl: message.senderAvatarUrl, attachment: message.attachment }) }
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
    const applyHistory = (history: Awaited<ReturnType<typeof client.getChatHistory>>, isInitial: boolean) => {
      if (cancelled) return
      const mappedHistory = toMessages(history)
      if (!isInitial) fullHistoryByChatId.current.set(chatId, mappedHistory)
      updateWorkspace((current) => ({
        ...current,
        isHistoryLoading: false,
        chats: applyChatPreviews(current.chats, toChatPreviews(history.map((message) => ({ ...message, chatId }))), false).map((chat) => {
          const avatarUrl = history.find((message) => message.urlAvatar)?.urlAvatar
          return chat.id === chatId && avatarUrl ? { ...chat, avatarUrl } : chat
        }),
        messages: isInitial ? { ...current.messages, [chatId]: mappedHistory } : current.messages,
        hasOlderMessages: {
          ...current.hasOlderMessages,
          [chatId]: !isInitial && mappedHistory.length > (current.messages[chatId]?.length || 0),
        },
        notice: isInitial && !history.length ? 'В этом чате пока нет сообщений.' : current.notice,
      }))
    }

    void client.getChatHistory(chatId, initialHistoryCount)
      .then((history) => {
        applyHistory(history, true)
        return client.getChatHistory(chatId)
      })
      .then((history) => applyHistory(history, false))
      .catch((error) => {
        if (!cancelled && workspaceRef.current.messages[chatId] === undefined) updateWorkspace((current) => ({ ...current, isHistoryLoading: false, notice: `Не удалось загрузить историю: ${error instanceof Error ? error.message : 'неизвестная ошибка'}` }))
      })
    return () => { cancelled = true; window.clearTimeout(watchdogId) }
  }, [client, messengerId, updateWorkspace, workspace.activeChatId])

  useEffect(() => {
    const chatId = workspace.activeChatId
    if (!client || !chatId || workspace.isHistoryLoading || isDemoChatId(messengerId, chatId)) return undefined
    let cancelled = false

    void client.getAvatar(chatId)
      .then((avatarUrl) => {
        if (!cancelled) updateWorkspace((current) => ({
          ...current,
          chats: current.chats.map((chat) => chat.id === chatId ? { ...chat, avatarUrl } : chat),
        }))
      })
      .catch(() => {
        if (!cancelled) updateWorkspace((current) => ({
          ...current,
          chats: current.chats.map((chat) => chat.id === chatId ? { ...chat, avatarUrl: null } : chat),
        }))
      })

    return () => { cancelled = true }
  }, [client, messengerId, updateWorkspace, workspace.activeChatId, workspace.isHistoryLoading])

  function selectMessenger(nextId: MessengerId) { setMessengerId(nextId); setSettingsOpen(false); setCreateChatOpen(false) }
  function selectChat(chatId: string) {
    updateWorkspace((current) => {
      if (current.activeChatId === chatId) return current
      return {
        ...current,
        activeChatId: chatId,
        isHistoryLoading: current.connected && !isDemoChatId(messengerId, chatId),
        chats: markChatRead(current.chats, chatId),
      }
    })
  }
  function setSearch(search: string) { updateWorkspace((current) => ({ ...current, search })) }
  function connect(settings: ConnectionSettings) { fullHistoryByChatId.current.clear(); updateWorkspace((current) => current.connected && hasSameSettings(current.settings, settings) ? current : { ...current, settings, connected: true, isChatsLoading: true, isHistoryLoading: false, chats: [], messages: {}, hasOlderMessages: {}, activeChatId: '', notice: `Подключено. Список чатов загружается из ${messenger.name} API.` }); setSettingsOpen(false) }
  function addChat(id: string, name: string) { updateWorkspace((current) => { const chat = createChat(id, name); return { ...current, chats: current.chats.some((item) => item.id === id) ? current.chats : [chat, ...current.chats], messages: { ...current.messages, [id]: current.messages[id] || [] }, activeChatId: id, isHistoryLoading: current.connected } }); setCreateChatOpen(false) }
  async function send(text: string, retryMessageId?: string) {
    const chatId = workspace.activeChatId
    if (!chatId) return
    const previous = retryMessageId ? workspace.messages[chatId]?.find((message) => message.id === retryMessageId) : undefined
    const message: Message = previous ? { ...previous, status: 'sending' } : { id: createId(), mine: true, text, time: formatCurrentTime(), ...formatMessageDate(new Date()), status: 'sending' }
    updateWorkspace((current) => ({ ...current, messages: previous ? updateMessageStatus(current.messages, chatId, message.id, 'sending') : addMessage(current.messages, chatId, message), chats: current.chats.map((chat) => chat.id === chatId ? { ...chat, last: text, time: message.time, lastMine: true, lastStatus: 'sending' } : chat) }))
    if (isDemoChatId(messengerId, chatId)) {
      updateWorkspace((current) => ({ ...current, messages: updateMessageStatus(current.messages, chatId, message.id, 'sent') }))
      window.setTimeout(() => updateWorkspace((current) => ({ ...current, messages: updateMessageStatus(current.messages, chatId, message.id, 'read') })), demoReadDelay)
      return
    }
    if (!client) return
    try {
      const externalId = await sendTextMutation.mutateAsync({ chatId, text })
      updateWorkspace((current) => ({
        ...current,
        messages: updateMessageStatus(
          externalId ? updateMessageExternalId(current.messages, chatId, message.id, externalId) : current.messages,
          chatId,
          message.id,
          'sent',
        ),
        chats: current.chats.map((chat) => chat.id === chatId ? { ...chat, lastMine: true, lastStatus: 'sent', lastExternalId: externalId || chat.lastExternalId } : chat),
      }))
    }
    catch (error) { updateWorkspace((current) => ({ ...current, messages: updateMessageStatus(current.messages, chatId, message.id, 'error'), notice: `Сообщение не отправлено: ${error instanceof Error ? error.message : 'неизвестная ошибка'}` })) }
  }

  async function attach(file: File) {
    const chatId = workspace.activeChatId
    if (!chatId) return
    const type = file.type || 'application/octet-stream'
    const kind = type.startsWith('image/') ? 'image' : type.startsWith('video/') ? 'video' : type.startsWith('audio/') ? 'audio' : 'file'
    const message: Message = { id: createId(), mine: true, text: '', time: formatCurrentTime(), ...formatMessageDate(new Date()), status: 'sending', attachment: { name: file.name, type, kind, url: URL.createObjectURL(file) } }
    updateWorkspace((current) => ({ ...current, messages: addMessage(current.messages, chatId, message), chats: current.chats.map((chat) => chat.id === chatId ? { ...chat, last: `📎 ${file.name}`, time: message.time, lastMine: true, lastStatus: 'sending' } : chat) }))
    if (isDemoChatId(messengerId, chatId)) { updateWorkspace((current) => ({ ...current, messages: updateMessageStatus(current.messages, chatId, message.id, 'sent') })); return }
    if (!client) return
    try {
      const response = await sendFileMutation.mutateAsync({ chatId, file })
      const externalId = response.idMessage
      updateWorkspace((current) => ({ ...current, messages: updateMessageStatus(externalId ? updateMessageExternalId(current.messages, chatId, message.id, externalId) : current.messages, chatId, message.id, 'sent'), chats: current.chats.map((chat) => chat.id === chatId ? { ...chat, lastStatus: 'sent', lastExternalId: externalId || chat.lastExternalId } : chat) }))
    } catch (error) { updateWorkspace((current) => ({ ...current, messages: updateMessageStatus(current.messages, chatId, message.id, 'error'), notice: `Вложение не отправлено: ${error instanceof Error ? error.message : 'неизвестная ошибка'}` })) }
  }

  function retry(messageId: string) {
    const message = workspace.messages[workspace.activeChatId]?.find((item) => item.id === messageId)
    if (message && !message.attachment) void send(message.text, message.id)
  }

  async function refreshAttachment(messageId: string): Promise<boolean> {
    const chatId = workspace.activeChatId
    const message = workspace.messages[chatId]?.find((item) => item.id === messageId)
    if (!client || !message?.attachment || isDemoChatId(messengerId, chatId)) return false
    try {
      const url = await client.getFileDownloadUrl(chatId, message.externalId || message.id)
      if (!url) return false
      updateWorkspace((current) => ({ ...current, messages: updateMessageAttachmentUrl(current.messages, chatId, messageId, url) }))
      return true
    } catch {
      return false
    }
  }

  function loadOlderMessages(): boolean {
    const chatId = workspace.activeChatId
    const history = fullHistoryByChatId.current.get(chatId)
    const displayed = workspace.messages[chatId] || []
    if (!history?.length || !displayed.length) return false
    const firstIndex = history.findIndex((message) => message.id === displayed[0].id)
    if (firstIndex <= 0) return false
    const previousMessages = history.slice(Math.max(0, firstIndex - initialHistoryCount), firstIndex)
    updateWorkspace((current) => {
      const currentMessages = current.messages[chatId] || []
      const nextMessages = [...previousMessages, ...currentMessages.filter((message) => !previousMessages.some((item) => item.id === message.id))]
      return {
        ...current,
        messages: { ...current.messages, [chatId]: nextMessages },
        hasOlderMessages: { ...current.hasOlderMessages, [chatId]: firstIndex - previousMessages.length > 0 },
      }
    })
    return true
  }

  const sendTyping = useCallback(() => {
    if (!client || isDemoChatId(messengerId, workspace.activeChatId)) return
    const now = Date.now()
    if (now - lastTypingAt.current < 1500) return
    lastTypingAt.current = now
    void client.sendTyping(workspace.activeChatId).catch(() => undefined)
  }, [client, messengerId, workspace.activeChatId])

  return { activeChat, activeChatId: workspace.activeChatId, canSend: Boolean(activeChat) && !workspace.isHistoryLoading && (workspace.connected || isDemoChatId(messengerId, workspace.activeChatId)), chats: visibleChats, connected: workspace.connected, createChatOpen, hasOlderMessages: workspace.hasOlderMessages[workspace.activeChatId] || false, isChatsLoading: workspace.isChatsLoading, isHistoryLoading: workspace.isHistoryLoading, loadOlderMessages, messages: workspace.messages[workspace.activeChatId] || [], messenger, messengerId, notice: workspace.notice, search: workspace.search, settings: workspace.settings, settingsOpen, addChat, attach, connect, refreshAttachment, retry, selectChat, selectMessenger, send, sendTyping, setCreateChatOpen, setSearch, setSettingsOpen }
}
