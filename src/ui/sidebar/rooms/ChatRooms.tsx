import { ChatRoomCell } from "./cell/ChatRoomCell";
import { useContext, useMemo } from "react";
import { ChatContext } from "../../ChatContext";
import { ChatRoom } from "../../../domain";

export function ChatRooms() {

    const { rooms, lastMessageByRoom } = useContext(ChatContext);

    const sortedRooms = useMemo<ChatRoom[]>(() => {
        return [...rooms].sort((a, b) => {
            const lastMessageA = lastMessageByRoom.get(a.id);
            const lastMessageB = lastMessageByRoom.get(b.id);
            if (!lastMessageA && !lastMessageB) {
                return 0;
            }
            if (!lastMessageA) {
                return 1;
            }
            if (!lastMessageB) {
                return -1;
            }
            return lastMessageB.createdAt - lastMessageA.createdAt;
        });
    }, [rooms, lastMessageByRoom]);

    return (
        <div className="flex-grow overflow-y-auto overflow-x-hidden">
            {sortedRooms?.map((room) => <ChatRoomCell key={room.id} room={room} />)}
        </div>
    );
}
