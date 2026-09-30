import type { Chat, ChatPreview, IncomingMessage } from '@/entities/chat/model/types';
import type { MessageStatus } from '@/entities/message/model/types';

const palette = ['#4a91f2', '#9277ed', '#e9819b', '#f3b34c'];

const statusRank: Record<MessageStatus, number> = {
  error: -1,
  sending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
};

function getLatestStatus(
  current?: MessageStatus,
  incoming?: MessageStatus,
): MessageStatus | undefined {
  if (!current || !incoming) return incoming || current;
  return statusRank[current] > statusRank[incoming] ? current : incoming;
}

export function createChat(id: string, name: string): Chat {
  const title = name.trim() || id;
  return {
    id,
    name: title,
    initials: title.slice(0, 2).toUpperCase(),
    color: palette[id.length % palette.length],
    last: 'Начните диалог',
    time: '',
    unread: 0,
  };
}

export function markChatRead(chats: Chat[], chatId: string): Chat[] {
  return chats.map((chat) => (chat.id === chatId ? { ...chat, unread: 0 } : chat));
}

export function applyIncomingMessage(
  chats: Chat[],
  message: IncomingMessage,
  activeChatId: string,
): Chat[] {
  const current = chats.find((chat) => chat.id === message.chatId);
  const update = (chat: Chat): Chat => ({
    ...chat,
    last: message.text,
    time: message.time,
    unread: chat.id === activeChatId ? 0 : chat.unread + 1,
    lastMine: false,
    lastStatus: undefined,
    lastExternalId: message.id,
  });
  if (current) return [update(current), ...chats.filter((chat) => chat.id !== message.chatId)];
  return [
    {
      ...createChat(message.chatId, message.name),
      last: message.text,
      time: message.time,
      unread: 1,
      lastMine: false,
      lastExternalId: message.id,
    },
    ...chats,
  ];
}

export function applyChatPreviews(
  chats: Chat[],
  previews: ChatPreview[],
  shouldSort = true,
): Chat[] {
  const previewsByChatId = new Map(previews.map((preview) => [preview.chatId, preview]));
  const updated = chats.map((chat) => {
    const preview = previewsByChatId.get(chat.id);
    if (!preview) return chat;
    const isSameLastMessage = chat.lastExternalId === preview.externalId;
    return {
      ...chat,
      last: preview.text,
      time: preview.time,
      lastMine: preview.mine,
      lastStatus: isSameLastMessage
        ? getLatestStatus(chat.lastStatus, preview.status)
        : preview.status,
      lastExternalId: preview.externalId,
    };
  });
  return shouldSort
    ? updated.sort(
        (left, right) =>
          (previewsByChatId.get(right.id)?.timestamp || 0) -
          (previewsByChatId.get(left.id)?.timestamp || 0),
      )
    : updated;
}
