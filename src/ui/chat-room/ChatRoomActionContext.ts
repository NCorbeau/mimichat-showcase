import { createContext } from "react";

type ChatRoomActionContextData = {
    onScrollToMessage: (messageId: string, onScrollFn: (messageId: string) => void) => void;

};

export const ChatRoomActionContext = createContext<ChatRoomActionContextData>({
    onScrollToMessage: () => {}
});