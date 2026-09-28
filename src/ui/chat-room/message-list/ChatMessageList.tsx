import './ChatMessageList.scss';
import { createRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ChatMessage } from '../../../domain';
import { Chat } from '@chat';
import { ChatMessageLine } from './line/ChatMessageLine';
import { ChatContext } from '../../ChatContext';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

type ChatMessageWithIndex = ChatMessage;

export function ChatMessageList() {

    const { selectedRoom, currentUser, userById, onChatUsersRequested, appMode } = useContext(ChatContext);
    const roomId = selectedRoom?.id;
    const currentUserId = currentUser?.uid;

    const [chatMessages, setChatMessages] = useState<ChatMessageWithIndex[]>();
    const lastMessage = chatMessages?.length ? chatMessages[chatMessages?.length - 1] : null;

    const [totalStaticMessages, setTotalStaticMessages] = useState<number>(0);
    const [staticChatMessages, setStaticChatMessages] = useState<ChatMessage[]>([]);
    const [liveChatMessages, setLiveChatMessages] = useState<ChatMessage[]>(null);
    const [showBoardFirstOpenHint, setShowBoardFirstOpenHint] = useState<boolean>(false);

    const virtuosoRef = useRef<VirtuosoHandle>();
    const listRef = createRef<HTMLDivElement>();

    useEffect(() => {
        setChatMessages([]);
        setTotalStaticMessages(0);
        setStaticChatMessages([]);
        setLiveChatMessages(null);

        if (!roomId || !currentUserId) {
            setChatMessages([]);
            return;
        }

        let cancelled = false;
        Chat.getChatMessagesCount(roomId).then((count) => {
            if (!cancelled) setTotalStaticMessages(count);
        });

        setLiveChatMessages([]);
        const unsubscribe = Chat.streamChatMessages(roomId, (chatMessages: ChatMessage[]) => {
            if (cancelled) return;
            const userIds = chatMessages.map((chatMessage) => chatMessage.userId);
            onChatUsersRequested(userIds);
            setLiveChatMessages(chatMessages);
            Chat.updateLastSeen(roomId, currentUserId);
        }, 1);
        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [roomId, currentUserId, onChatUsersRequested]);

    useEffect(() => {
        if (!roomId || totalStaticMessages === 0) {
            return;
        }

        let cancelled = false;
        setStaticChatMessages([]);
        Chat.getChatMessages(roomId).then((chatMessages) => {
            if (cancelled) return;
            const userIds = chatMessages.map((chatMessage) => chatMessage.userId);
            onChatUsersRequested(userIds);
            setStaticChatMessages(chatMessages);
        });
        return () => { cancelled = true; };
    }, [roomId, totalStaticMessages, onChatUsersRequested]);

    useEffect(() => {
        // The live stream sends snapshots, including messages already fetched above.
        const byId = new Map([...staticChatMessages, ...(liveChatMessages ?? [])]
            .map(message => [message.id, message]));
        const messagesWithIndex = [...byId.values()]
            .sort((a, b) => a.createdAt - b.createdAt)
            .map((message, index) => message.withIndex(index));

        setChatMessages(messagesWithIndex);
    }, [staticChatMessages, liveChatMessages]);

    const userHasOwnMessageInRoom = useMemo(
        () => chatMessages?.some((m) => m.userId === currentUser?.uid) ?? false,
        [chatMessages, currentUser?.uid]
    );

    useEffect(() => {
        if (appMode !== 'board' || !roomId || !currentUserId) {
            setShowBoardFirstOpenHint(false);
            return;
        }

        const key = `mimichat-board-first-open-hint:${currentUserId}:${roomId}`;
        const dismissed = localStorage.getItem(key) === '1';
        setShowBoardFirstOpenHint(!dismissed);
    }, [appMode, roomId, currentUserId]);

    useEffect(() => {
        if (appMode !== 'board' || !roomId || !currentUserId || !userHasOwnMessageInRoom) {
            return;
        }

        const key = `mimichat-board-first-open-hint:${currentUserId}:${roomId}`;
        localStorage.setItem(key, '1');
        setShowBoardFirstOpenHint(false);
    }, [appMode, roomId, currentUserId, userHasOwnMessageInRoom]);

    const onFollowOutputHandler = useCallback(
        (atBottom) => {
            if (atBottom || lastMessage?.userId === currentUser?.uid) {
                return "auto";
            } else {
                return false;
            }
        },
        [lastMessage, currentUserId]
    );

    const scrollToMessage = (messageId: string) => {
        const messageIndex = chatMessages.findIndex(message => message.id === messageId);
        if (messageIndex !== -1) {
            setTimeout(() => {
                virtuosoRef.current?.scrollToIndex({ index: messageIndex, align: 'start', behavior: 'smooth' });
            }, 1000);
        }
    }

    return (
        <div ref={listRef} className="relative chat-message-list flex min-h-0 flex-col flex-grow overflow-y-auto">
            <div className="chat-message-list__messages-area relative min-h-0 flex-1 pt-2">
                {showBoardFirstOpenHint && !userHasOwnMessageInRoom && (
                    <div className="chat-message-list__board-first-open-hint secondary">
                        <div>This board has its own conversation.</div>
                        <div>Anyone who opens this view can join.</div>
                    </div>
                )}
                <div className="chat-message-list__virtuoso">
                    <Virtuoso
                        ref={virtuosoRef}
                        followOutput={onFollowOutputHandler}
                        data={chatMessages}
                        initialTopMostItemIndex={chatMessages?.length - 1}
                        itemContent={(index, message) => (
                            message &&
                            <ChatMessageLine
                                key={message.id}
                                message={message}
                                own={currentUser?.uid === message.userId}
                                sender={userById.get(message.userId)}
                                isLive={message.index >= totalStaticMessages}
                                isLast={index === chatMessages.length - 1}
                                scrollToMessage={scrollToMessage} />
                        )}
                    />
                </div>
            </div>
        </div>
    );

}
