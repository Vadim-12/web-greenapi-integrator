import type { MessengerId } from '@/shared/types/messenger';

export const createDemoChatId = (messengerId: MessengerId, chatId: string) =>
  chatId.replace('demo-', `${messengerId}-demo-`);
export const isDemoChatId = (messengerId: MessengerId, chatId: string) =>
  chatId.startsWith(`${messengerId}-demo-`);
