export type MessageComposerProps = {
  chatId: string
  disabled?: boolean
  messengerName: string
  isLoading?: boolean
  onSend: (text: string) => Promise<void>
  onTyping?: () => void
}
