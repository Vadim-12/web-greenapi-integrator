import type { Message } from '@/entities/message/model/types'

export type MessageListProps = { messages: Message[]; onRetry?: (messageId: string) => void }
