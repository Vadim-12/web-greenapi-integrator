export type ConnectionSettings = { apiUrl: string; idInstance: string; apiTokenInstance: string }

export const defaultConnectionSettings: ConnectionSettings = {
  apiUrl: import.meta.env.VITE_GREEN_API_URL || 'https://api.green-api.com',
  idInstance: '',
  apiTokenInstance: '',
}

export const isConfigured = (settings: ConnectionSettings) => Boolean(settings.idInstance.trim() && settings.apiTokenInstance.trim())
