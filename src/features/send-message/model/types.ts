export type MessageComposerProps = {
  chatId: string;
  disabled?: boolean;
  messengerName: string;
  isLoading?: boolean;
  onSend: (text: string) => Promise<void>;
  onAttach?: (file: File) => Promise<void>;
  onTyping?: () => void;
};
