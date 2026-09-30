const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });

export const formatCurrentTime = () => timeFormatter.format(new Date());
