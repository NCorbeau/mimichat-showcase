import { createContext } from "react";
import { ChatMessage } from "../../domain";

export type RoomHeaderState = 'DEFAULT' | 'ADD_MEMBERS';
export type ChatRoomContextData = {
    headerState: RoomHeaderState;
    onHeaderStateChange: (state: RoomHeaderState) => void;
    sidebarOpen: boolean;
    onSidebarToggle: () => void;
    onMessageReply: (message: ChatMessage) => void;
};

export const ChatRoomContext = createContext<ChatRoomContextData>({ headerState: 'DEFAULT', onHeaderStateChange: null, sidebarOpen: true, onSidebarToggle: null, onMessageReply: null });