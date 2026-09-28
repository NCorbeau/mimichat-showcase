import './ChatMessageList.scss';
import { createRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ChatMessage } from '../../../domain';
import { Chat } from '../../../app/chat';
import { ChatMessageLine } from './line/ChatMessageLine';
import { ChatContext } from '../../ChatContext';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

type ChatMessageWithIndex = ChatMessage;

export function ChatMessageList() {

    const { selectedRoom, currentUser, userById, onChatUsersRequested, appMode } = useContext(ChatContext);

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

        if (selectedRoom === null) {
            setChatMessages([]);
            return;
        }

        Chat.getChatMessagesCount(selectedRoom.id).then((count) => {
            setTotalStaticMessages(count);
        });

        setLiveChatMessages([]);
        const unsubscribe = Chat.streamChatMessages(selectedRoom.id, (chatMessages: ChatMessage[]) => {
            const userIds = chatMessages.map((chatMessage) => chatMessage.userId);
            onChatUsersRequested(userIds);
            setLiveChatMessages(chatMessages);
            Chat.updateLastSeen(selectedRoom.id, currentUser.uid);
        }, 1);
        return () => unsubscribe();
    }, [selectedRoom]);

    useEffect(() => {
        if (totalStaticMessages === 0) {
            return;
        }

        setStaticChatMessages([]);
        Chat.getChatMessages(selectedRoom.id).then((chatMessages) => {
            const userIds = chatMessages.map((chatMessage) => chatMessage.userId);
            onChatUsersRequested(userIds);
            setStaticChatMessages(chatMessages);
        });
    }, [totalStaticMessages]);

    useEffect(() => {
        // The live stream sends snapshots, including messages already fetched above.
        const byId = new Map([...staticChatMessages, ...(liveChatMessages ?? [])]
            .map(message => [message.id, message]));
        const messagesWithIndex = [...byId.values()]
            .sort((a, b) => a.createdAt - b.createdAt)
            .map((message, index) => message.withIndex(index));

        setChatMessages(messagesWithIndex);
    }, [staticChatMessages, liveChatMessages, totalStaticMessages]);

    const userHasOwnMessageInRoom = useMemo(
        () => chatMessages?.some((m) => m.userId === currentUser?.uid) ?? false,
        [chatMessages, currentUser?.uid]
    );

    useEffect(() => {
        if (appMode !== 'board' || !selectedRoom || !currentUser?.uid) {
            setShowBoardFirstOpenHint(false);
            return;
        }

        const key = `mimichat-board-first-open-hint:${currentUser.uid}:${selectedRoom.id}`;
        const dismissed = localStorage.getItem(key) === '1';
        setShowBoardFirstOpenHint(!dismissed);
    }, [appMode, selectedRoom?.id, currentUser?.uid]);

    useEffect(() => {
        if (appMode !== 'board' || !selectedRoom || !currentUser?.uid || !userHasOwnMessageInRoom) {
            return;
        }

        const key = `mimichat-board-first-open-hint:${currentUser.uid}:${selectedRoom.id}`;
        localStorage.setItem(key, '1');
        setShowBoardFirstOpenHint(false);
    }, [appMode, selectedRoom?.id, currentUser?.uid, userHasOwnMessageInRoom]);

    const onFollowOutputHandler = useCallback(
        (atBottom) => {
            if (atBottom || lastMessage?.userId === currentUser?.uid) {
                return "auto";
            } else {
                return false;
            }
        },
        [lastMessage]
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
