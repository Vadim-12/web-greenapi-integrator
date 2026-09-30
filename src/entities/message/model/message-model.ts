import type { Message, MessageStatus } from '@/entities/message/model/types';

export function addMessage(
  messages: Record<string, Message[]>,
  chatId: string,
  message: Message,
): Record<string, Message[]> {
  return { ...messages, [chatId]: [...(messages[chatId] || []), message] };
}

export function updateMessageStatus(
  messages: Record<string, Message[]>,
  chatId: string,
  messageId: string,
  status: MessageStatus,
): Record<string, Message[]> {
  return {
    ...messages,
    [chatId]: (messages[chatId] || []).map((message) =>
      message.id === messageId ? { ...message, status } : message,
    ),
  };
}

export function updateMessageExternalId(
  messages: Record<string, Message[]>,
  chatId: string,
  messageId: string,
  externalId: string,
): Record<string, Message[]> {
  return {
    ...messages,
    [chatId]: (messages[chatId] || []).map((message) =>
      message.id === messageId ? { ...message, externalId } : message,
    ),
  };
}

export function updateMessageAttachmentUrl(
  messages: Record<string, Message[]>,
  chatId: string,
  messageId: string,
  url: string,
): Record<string, Message[]> {
  return {
    ...messages,
    [chatId]: (messages[chatId] || []).map((message) =>
      message.id === messageId && message.attachment
        ? { ...message, attachment: { ...message.attachment, url } }
        : message,
    ),
  };
}

export function updateMessageStatusByExternalId(
  messages: Record<string, Message[]>,
  chatId: string,
  externalId: string,
  status: MessageStatus,
): Record<string, Message[]> {
  return {
    ...messages,
    [chatId]: (messages[chatId] || []).map((message) =>
      message.externalId === externalId || message.id === externalId
        ? { ...message, status }
        : message,
    ),
  };
}
