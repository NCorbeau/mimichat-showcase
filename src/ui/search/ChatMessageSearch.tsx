import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../ChatContext";
import { Chat } from "../../app/chat";
import { ChatUserAvatar } from "../user/ChatUserAvatar";
import { Tooltip } from "monday-ui-react-core";
import { ChatMessage, ChatRoom } from "../../domain";
import { DateTime } from "luxon";
import { isSelectedByArrowKeys, useArrowKeysSelect } from "../utils/useArrowKeysSelect";

type ChatMessageSearchProps = {
    query: string;
    onMessageClick: (room: ChatRoom, messageId: string) => void;
    roomId?: string;
};

export function ChatMessageSearch({ query, roomId, onMessageClick }: ChatMessageSearchProps) {

    const { rooms, roomById, userById, currentUser } = useContext(ChatContext);
    const [foundMessages, setFoundMessages] = useState<ChatMessage[]>([]);
    const [messageToOpenIndex, setMessageToOpenIndex] = useState<number | null>(null);

    const selectedMessageIndex = useArrowKeysSelect(messageIndex => setMessageToOpenIndex(messageIndex));

    useEffect(() => {
        if (!query) {
            setFoundMessages([]);
            return;
        }
        const roomIds = roomId ? [roomId] : rooms.map(room => room.id);
        Chat.searchMessages(query, roomIds).then(messages => {
            setFoundMessages(messages);
        });
    }, [query]);

    useEffect(() => {
        if (messageToOpenIndex !== null) {
            const message = foundMessages[messageToOpenIndex];
            if (message) {
                onMessageClick(roomById.get(message.roomId), message.id);
            }
            setMessageToOpenIndex(null);
        }
    }, [messageToOpenIndex]);

    const getRoomName = (roomId: string): string => {
        const room = roomById.get(roomId);
        return room?.getDisplayName(userById, currentUser) ?? ChatRoom.DEFAULT_NAME;
    };

    const getMessageDate = (createdAt: number): string => {
        const date = DateTime.fromMillis(createdAt);
        return date.toLocaleString(DateTime.DATETIME_SHORT);
    };

    const onClick = (message: ChatMessage) => {
        const room = roomById.get(message.roomId);
        onMessageClick(room, message.id);
    };

    const isMessageSelected = (index: number) => {
        return isSelectedByArrowKeys(index, selectedMessageIndex, foundMessages.length);
    }

    return (
        <div className="w-full max-h-[512px] overflow-y-auto">
            {foundMessages.map((message, index) => (
                <div onClick={() => onClick(message)} key={message.id} className={`h-14 w-full flex items-center px-1 gap-3 overflow-hidden cursor-pointer ${isMessageSelected(index) ? 'primary-selected-bg' : ''}`}>
                    <div className="flex-shrink-0">
                        <ChatUserAvatar userId={message.userId} />
                    </div>
                    <div className="w-full h-full flex flex-col justify-center">
                        <Tooltip immediateShowDelay={50} content={message.text}>
                            <div className="select-text font-semibold text-nowrap overflow-hidden text-ellipsis w-fit max-w-[90%]">
                                {message.text}
                            </div>
                        </Tooltip>
                        <div className="secondary text-nowrap overflow-hidden text-ellipsis max-w-[90%]">
                            <span>{getMessageDate(message.createdAt)}, </span>
                            <Tooltip immediateShowDelay={50} content={getRoomName(message.roomId)}>
                                <span>{getRoomName(message.roomId)}</span>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

}