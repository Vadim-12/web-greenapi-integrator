import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectionModal } from '@/features/connect-instance/ui/ConnectionModal';
import { CreateChatModal } from '@/features/create-chat/ui/CreateChatModal';
import { MessengerDialog } from '@/widgets/messenger-dialog/ui/MessengerDialog';
import { MessengerSidebar } from '@/widgets/messenger-sidebar/ui/MessengerSidebar';
import { useMessenger } from '@/pages/messenger/model/useMessenger';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 5_000 } } });

function MessengerPageContent() {
	const messenger = useMessenger();

	useEffect(() => {
		document.title = `${messenger.messenger.name} — сообщения`;
	}, [messenger.messenger.name]);

	return (
		<main className='app-shell' data-messenger={messenger.messengerId}>
			<MessengerSidebar
				chats={messenger.chats}
				activeChatId={messenger.activeChatId}
				connected={messenger.connected}
				isChatsLoading={messenger.isChatsLoading}
				search={messenger.search}
				messenger={messenger.messenger}
				onSearchChange={messenger.setSearch}
				onSelectChat={messenger.selectChat}
				onSelectMessenger={messenger.selectMessenger}
				onOpenSettings={() => messenger.setSettingsOpen(true)}
				onOpenCreateChat={() => messenger.setCreateChatOpen(true)}
			/>
			<MessengerDialog
				chat={messenger.activeChat}
				messages={messenger.messages}
				hasOlderMessages={messenger.hasOlderMessages}
				connected={messenger.connected}
				isChatsLoading={messenger.isChatsLoading}
				isHistoryLoading={messenger.isHistoryLoading}
				notice={messenger.notice}
				canSend={messenger.canSend}
				messengerName={messenger.messenger.name}
				onSend={messenger.send}
				onAttach={messenger.attach}
				onRetry={messenger.retry}
				onRefreshAttachment={messenger.refreshAttachment}
				onLoadOlder={messenger.loadOlderMessages}
				onTyping={messenger.sendTyping}
			/>
			{messenger.settingsOpen && (
				<ConnectionModal
					initialSettings={messenger.settings}
					messenger={messenger.messenger}
					onConnect={messenger.connect}
					onClose={() => messenger.setSettingsOpen(false)}
				/>
			)}
			{messenger.createChatOpen && (
				<CreateChatModal
					messenger={messenger.messenger}
					onCreate={messenger.addChat}
					onClose={() => messenger.setCreateChatOpen(false)}
				/>
			)}
		</main>
	);
}

export function MessengerPage() {
	return <QueryClientProvider client={queryClient}><MessengerPageContent /></QueryClientProvider>;
}
