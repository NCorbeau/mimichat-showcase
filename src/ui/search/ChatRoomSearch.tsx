import { useContext, useEffect, useState } from "react";
import { ChatRoomAvatar } from "../chat-room/avatar/ChatRoomAvatar";
import { ChatRoom } from "../../domain";
import { Tooltip } from "monday-ui-react-core";
import { isSelectedByArrowKeys, useArrowKeysSelect } from "../utils/useArrowKeysSelect";
import { ChatContext } from "../ChatContext";

type ChatRoomSearchProps = {
    query: string;
    onRoomClick: (room: ChatRoom) => void;
};

export function ChatRoomSearch({ query, onRoomClick }: ChatRoomSearchProps) {

    const { rooms, userById, currentUser } = useContext(ChatContext);

    const [filteredRooms, setFilteredRooms] = useState<ChatRoom[]>([]);
    const [roomToOpenIndex, setRoomToOpenIndex] = useState<number | null>(null);

    const selectedRoomIndex = useArrowKeysSelect(roomIndex => setRoomToOpenIndex(roomIndex));

    useEffect(() => {
        if (!query) {
            setFilteredRooms([]);
            return;
        }
        const filteredRooms = rooms.filter(room => room.getDisplayName(userById, currentUser).toLowerCase().includes(query.toLowerCase()));
        setFilteredRooms(filteredRooms);
    }, [query]);

    useEffect(() => {
        if (roomToOpenIndex !== null) {
            onRoomClick(filteredRooms[roomToOpenIndex]);
            setRoomToOpenIndex(null);
        }
    }, [roomToOpenIndex]);

    const getRoomName = (room: ChatRoom): string => {
        return room.getDisplayName(userById, currentUser).slice(0, 100);
    };

    const isRoomSelected = (index: number) => {
        return isSelectedByArrowKeys(index, selectedRoomIndex, filteredRooms.length);
    };

    return (
        <div className="w-full max-h-[512px] overflow-y-auto">
            {filteredRooms.map((room, index) => (
                <div onClick={() => onRoomClick(room)} key={room.id} className={`h-14 w-full flex items-center px-1 gap-3 overflow-hidden cursor-pointer ${isRoomSelected(index) ? 'primary-selected-bg' : ''}`}>
                    <div className="flex-shrink-0">
                        <ChatRoomAvatar room={room} />
                    </div>
                    <div className="w-full h-full flex items-center">
                        <Tooltip immediateShowDelay={50} content={room.getDisplayName(userById, currentUser)}>
                            <div className="font-semibold text-nowrap overflow-hidden text-ellipsis max-w-[90%]">
                                {getRoomName(room)}
                            </div>
                        </Tooltip>
                    </div>
                </div>
            ))}
        </div>
    );
}