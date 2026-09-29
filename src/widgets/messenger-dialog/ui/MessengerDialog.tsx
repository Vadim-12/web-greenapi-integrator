import { Avatar } from '@/entities/chat/ui/Avatar';
import { MessageList } from '@/entities/message/ui/MessageList';
import { MessageComposer } from '@/features/send-message/ui/MessageComposer';
import type { MessengerDialogProps } from '@/widgets/messenger-dialog/model/types';

export function MessengerDialog({
	chat,
	messages,
	connected,
	isChatsLoading,
	isHistoryLoading,
	notice,
	canSend,
	messengerName,
	onSend,
	onAttach,
	onRetry,
	onTyping,
}: MessengerDialogProps) {
	if (!chat)
		return (
			<section className='dialog'>
				<div className='empty-dialog'>
					{isChatsLoading ? (
						<>
							<div className='dialog-skeleton' aria-label='Загрузка чатов'>
								<i />
								<i />
								<i />
							</div>
							<p>Загружаем чаты из API…</p>
						</>
					) : (
						<>
							<h1>Выберите чат</h1>
							<p>
								{connected
									? notice
									: 'Выберите демо-чат или подключите инстанс.'}
							</p>
						</>
					)}
				</div>
			</section>
		);
	return (
		<section className='dialog'>
			<header className='dialog-head'>
				<Avatar {...chat} />
				<div>
					<b>{chat.name}</b>
					<small>{connected ? 'статус контакта недоступен' : 'демо-диалог'}</small>
				</div>
				<button
					className='icon more'
					disabled
					title='Дополнительные действия пока не доступны'
					aria-label='Дополнительные действия'
				>
					⋮
				</button>
			</header>
			<div className='notice' role='status'>
				{notice}
			</div>
			{isHistoryLoading ? (
				<div className='message-skeletons' aria-label='Загрузка истории'>
					<i />
					<i />
					<i />
				</div>
			) : (
				<MessageList messages={messages} onRetry={onRetry} />
			)}
			<MessageComposer
				chatId={chat.id}
				disabled={!canSend}
				isLoading={isHistoryLoading}
				messengerName={messengerName}
				onSend={onSend}
				onAttach={onAttach}
				onTyping={onTyping}
			/>
		</section>
	);
}
