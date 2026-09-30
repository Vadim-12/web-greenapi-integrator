import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { ConnectionModalProps } from '@/features/connect-instance/ui/types';
import { useModalFocus } from '@/shared/lib/dom/useModalFocus';
import '@/shared/ui/Modal.scss';

export function ConnectionModal({
  initialSettings,
  onConnect,
  onClose,
  messenger,
}: ConnectionModalProps) {
  const [settings, setSettings] = useState(initialSettings);
  const modalRef = useRef<HTMLElement>(null);
  useModalFocus(modalRef);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onConnect(settings);
  }
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="connection-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <form onSubmit={submit}>
          <div className="modal-title">
            <h2 id="connection-modal-title">Подключение {messenger.name} API</h2>
            <button type="button" data-autofocus onClick={onClose} aria-label="Закрыть">
              ×
            </button>
          </div>
          <p>Данные используются только в текущей вкладке браузера.</p>
          <label>
            Адрес API
            <input
              required
              type="url"
              value={settings.apiUrl}
              onChange={(event) => setSettings({ ...settings, apiUrl: event.target.value })}
            />
          </label>
          <label>
            ID инстанса
            <input
              required
              value={settings.idInstance}
              onChange={(event) => setSettings({ ...settings, idInstance: event.target.value })}
              placeholder="1100000001"
            />
          </label>
          <label>
            API-токен
            <input
              required
              type="password"
              value={settings.apiTokenInstance}
              onChange={(event) =>
                setSettings({ ...settings, apiTokenInstance: event.target.value })
              }
              placeholder="Ваш токен"
            />
          </label>
          <button className="primary" type="submit">
            Подключить
          </button>
          <a href={messenger.documentationUrl} target="_blank" rel="noreferrer">
            Как создать инстанс {messenger.name}?
          </a>
        </form>
      </section>
    </div>
  );
}
