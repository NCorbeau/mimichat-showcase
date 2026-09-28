import { Search } from "monday-ui-react-core";
import { ChatMessageSearch } from "./ChatMessageSearch";
import { useContext, useRef, useState } from "react";
import { ChatContext } from "../ChatContext";
import { ChatRoom } from "../../domain";

type ChatInRoomSearchProps = {
    roomId: string;
    onClose: () => void;
};

export function ChatInRoomSearch({ roomId, onClose }: ChatInRoomSearchProps) {

    const { onScrollToMessage } = useContext(ChatContext);

    const searchRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const onSearchChange = (value: string) => {
        setSearchQuery(value);
    };

    const onMessageClick = (room: ChatRoom, messageId: string) => {
        onClose();
        onScrollToMessage(messageId);
    };

    return (
        <div className="h-full w-full flex flex-col gap-6">
            <Search ref={searchRef} autoFocus={true} placeholder="Search in this conversation" onChange={onSearchChange} value={searchQuery} />
            <ChatMessageSearch query={searchQuery} roomId={roomId} onMessageClick={onMessageClick} />
        </div>
    );

}