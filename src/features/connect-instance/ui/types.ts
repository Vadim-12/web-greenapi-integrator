import type { ConnectionSettings } from '@/features/connect-instance/model/types';
import type { MessengerMeta } from '@/shared/types/messenger';

export type ConnectionModalProps = {
  initialSettings: ConnectionSettings;
  onConnect: (settings: ConnectionSettings) => void;
  onClose: () => void;
  messenger: MessengerMeta;
};
