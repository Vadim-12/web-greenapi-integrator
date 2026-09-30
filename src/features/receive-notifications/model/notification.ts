import type { IncomingMessage } from '@/entities/chat/model/types';
import type { GreenApiNotification } from '@/shared/api/green-api/types';
import { toAttachment } from '@/features/load-chat-history/model/history';
import type { OutgoingMessageStatus } from '@/features/receive-notifications/model/types';
import { formatMessageDate } from '@/shared/lib/time/formatMessageDate';

export function toIncomingMessage(
  notification: GreenApiNotification,
  time: string,
): IncomingMessage | null {
  const body = notification.body;
  const data = body?.messageData;
  const attachment = data?.fileMessageData
    ? toAttachment({ typeMessage: data.typeMessage, ...data.fileMessageData })
    : undefined;
  const text =
    data?.textMessageData?.textMessage ||
    data?.extendedTextMessageData?.text ||
    data?.fileMessageData?.caption ||
    (attachment ? '' : undefined);
  const chatId = body?.senderData?.chatId || body?.senderData?.sender;
  return text !== undefined && chatId
    ? {
        id: body?.idMessage,
        chatId,
        text,
        name: body?.senderData?.senderName || chatId,
        senderName: body?.senderData?.senderName,
        time,
        attachment,
        ...formatMessageDate(new Date()),
      }
    : null;
}

export function toOutgoingMessageStatus(
  notification: GreenApiNotification,
): OutgoingMessageStatus | null {
  const body = notification.body;
  if (body?.typeWebhook !== 'outgoingMessageStatus' || !body.chatId || !body.idMessage) return null;
  const status =
    body.status === 'read'
      ? 'read'
      : body.status === 'delivered'
        ? 'delivered'
        : body.status === 'failed' || body.status === 'noAccount'
          ? 'error'
          : 'sent';
  return { chatId: body.chatId, messageId: body.idMessage, status, description: body.description };
}
