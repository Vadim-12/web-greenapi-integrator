import type { ConnectionSettings } from '@/features/connect-instance/model/types';
import { readLocalStorage, writeLocalStorage } from '@/shared/lib/storage/localStorage';
import type { MessengerId } from '@/shared/types/messenger';

const storageKey = 'green-api-test:connection-settings:v1';

type StoredConnections = Partial<Record<MessengerId, ConnectionSettings>>;

function isConnectionSettings(value: unknown): value is ConnectionSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Record<string, unknown>;
  return (
    typeof settings.apiUrl === 'string' &&
    typeof settings.idInstance === 'string' &&
    typeof settings.apiTokenInstance === 'string'
  );
}

export function loadConnectionSettings(): StoredConnections {
  const stored = readLocalStorage<StoredConnections>(storageKey);
  if (!stored) return {};
  return Object.fromEntries(
    Object.entries(stored).filter(([, settings]) => isConnectionSettings(settings)),
  ) as StoredConnections;
}

export function saveConnectionSettings(settings: Record<MessengerId, ConnectionSettings>): void {
  writeLocalStorage(storageKey, settings);
}
