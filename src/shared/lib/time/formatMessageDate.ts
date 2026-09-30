export type MessageDate = { dateKey: string; dateLabel: string };

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function formatMessageDate(date: Date): MessageDate {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  if (isSameDay(date, now)) return { dateKey, dateLabel: 'Сегодня' };
  if (isSameDay(date, yesterday)) return { dateKey, dateLabel: 'Вчера' };

  const options: Intl.DateTimeFormatOptions =
    date.getFullYear() === now.getFullYear()
      ? { day: 'numeric', month: 'long' }
      : { day: 'numeric', month: 'long', year: 'numeric' };
  return { dateKey, dateLabel: new Intl.DateTimeFormat('ru-RU', options).format(date) };
}

export function formatMessageDateFromTimestamp(timestamp?: number): MessageDate | undefined {
  return timestamp ? formatMessageDate(new Date(timestamp * 1000)) : undefined;
}
