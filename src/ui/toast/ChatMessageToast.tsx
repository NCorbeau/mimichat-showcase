import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../ChatContext";
import { ChatMessage } from "../../domain";

type ChatToastProps = {
    message: ChatMessage;
};

export function ChatMessageToast({ message }: ChatToastProps) {

    const { userById, onChatUsersRequested, onSelectRoom, currentUser, selectedRoom, roomById, pausedNotificationsByRoom } = useContext(ChatContext);

    const [timeoutId, setTimeoutId] = useState<number>(null);
    const [lastMessage, setLastMessage] = useState<ChatMessage>(null);
    const [messagesCount, setMessagesCount] = useState<number>(0);

    useEffect(() => {
        if (!message ||
            message.userId === currentUser?.uid ||
            message.createdAt < Date.now() - 5000 ||
            selectedRoom?.id === message.roomId) {
            return;
        }

        const notificationPaused = pausedNotificationsByRoom.get(message.roomId);
        if (notificationPaused === -1 || notificationPaused > Date.now()) {
            return;
        }

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        setLastMessage(message);
        setMessagesCount(messagesCount + 1);

        const timeout = setTimeout(() => {
            setMessagesCount(0);
            setLastMessage(null);
        }, 5000) as unknown as number;
        setTimeoutId(timeout);

        onChatUsersRequested([message.userId]);
    }, [message]);


    if (!lastMessage) {
        return null;
    }

    const onGoToMessageRoom = () => {
        const room = roomById.get(lastMessage.roomId);
        onSelectRoom(room);
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
                        <span onClick={() => onGoToMessageRoom()} className="text-sm underline cursor-pointer">Go to chat</span>
                    </div>
                    :
                    <div className="flex flex-col justify-center">
                        <span className="font-bold">{userById.get(message.userId)?.name ?? ''}</span>
                        <div className="flex text-sm w-full justify-between">
                            <span className="secondary max-w-64 text-ellipsis overflow-hidden">{getToastMessage()}</span>
                            <span onClick={() => onGoToMessageRoom()} className="underline cursor-pointer">Read more</span>
                        </div>
                    </div>
            }
        </div>
    );

}