import { useContext, useEffect, useRef, useState } from "react";
import { ChatContext } from "../ChatContext";
import { ChatMessage } from "../../domain";

type ChatToastProps = {
    message: ChatMessage;
};

export function ChatMessageToast({ message }: ChatToastProps) {

    const { userById, onChatUsersRequested, onSelectRoom, currentUser, selectedRoom, roomById, pausedNotificationsByRoom } = useContext(ChatContext);

    const timeoutRef = useRef<number | null>(null);
    const processedMessageIdRef = useRef<string | null>(null);
    const [lastMessage, setLastMessage] = useState<ChatMessage>(null);
    const [messagesCount, setMessagesCount] = useState<number>(0);

    useEffect(() => {
        if (!message || processedMessageIdRef.current === message.id) return;
        processedMessageIdRef.current = message.id;
        if (message.userId === currentUser?.uid ||
            message.createdAt < Date.now() - 5000 ||
            selectedRoom?.id === message.roomId) {
            return;
        }

        const notificationPaused = pausedNotificationsByRoom.get(message.roomId);
        if (notificationPaused === -1 || notificationPaused > Date.now()) {
            return;
        }

        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current);
        }

        setLastMessage(message);
        setMessagesCount(count => count + 1);

        timeoutRef.current = window.setTimeout(() => {
            setMessagesCount(0);
            setLastMessage(null);
            timeoutRef.current = null;
        }, 5000);

        onChatUsersRequested([message.userId]);
    }, [message, currentUser?.uid, selectedRoom?.id, pausedNotificationsByRoom, onChatUsersRequested]);

    useEffect(() => () => {
        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    }, []);


    if (!lastMessage) {
        return null;
    }

    const onGoToMessageRoom = () => {
        const room = roomById.get(lastMessage.roomId);
        if (room) onSelectRoom(room);
        setLastMessage(null);
        setMessagesCount(0);
    };

    const getToastMessage = () => {
        const message = lastMessage;
        if (!message) {
            return '';
        }

        const text = message.text.replaceAll('[', '').replaceAll(']', '');

        if (text.length > 100) {
            return text.substring(0, 100) + '...';

            }
        return text;
    };

    return (
        <div className="absolute p-4 right-6 top-6 w-96 primary-selected-bg rounded-lg">
            {
                messagesCount > 1 ?
                    <div className="flex justify-between w-full">
                        <span className="font-bold">{messagesCount} new messages</span>
                        <button type="button" onClick={onGoToMessageRoom} className="text-sm underline cursor-pointer">Go to chat</button>
                    </div>
                    :
                    <div className="flex flex-col justify-center">
                        <span className="font-bold">{userById.get(lastMessage.userId)?.name ?? ''}</span>
                        <div className="flex text-sm w-full justify-between">
                            <span className="secondary max-w-64 text-ellipsis overflow-hidden">{getToastMessage()}</span>
                            <button type="button" onClick={onGoToMessageRoom} className="underline cursor-pointer">Read more</button>
                        </div>
                    </div>
            }
        </div>
    );

}
