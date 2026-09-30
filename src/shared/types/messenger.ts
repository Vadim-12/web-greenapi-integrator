export type MessengerId = 'telegram' | 'whatsapp' | 'max';

export type MessengerMeta = {
  id: MessengerId;
  name: string;
  shortName: string;
  documentationUrl: string;
  chatIdPlaceholder: string;
};
