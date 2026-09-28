import { useContext, useEffect, useState, useCallback } from "react";
import { ChatRoomHeader } from "./header/ChatRoomHeader";
import { ChatMessageForm } from "./message-form/ChatMessageForm";
import { ChatMessageList } from "./message-list/ChatMessageList";
import { ChatRoomSidebar } from "./sidebar/ChatRoomSidebar";
import { ChatContext } from "../ChatContext";
import { useLocalStorageState } from "../utils/useLocalStorageState";
import { ChatMessage } from "../../domain";
import { RoomHeaderState, ChatRoomContext } from "./ChatRoomContext";

export function ChatRoomContainer() {

    const [sidebarOpen, setSidebarOpen] = useLocalStorageState<boolean>('mimichat-room-sidebar-open', false);
    const [sidebarExitPending, setSidebarExitPending] = useState(false);
    const { selectedRoom, appMode } = useContext(ChatContext);
    const [headerState, setHeaderState] = useState<RoomHeaderState>('DEFAULT');
    const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage>(null);

    useEffect(() => {
        setHeaderState('DEFAULT');
        setReplyingToMessage(null);
    }, [selectedRoom]);

    const onHeaderStateChange = (state: RoomHeaderState) => {
        setHeaderState(state);
    };

    const onSidebarToggle = () => {
        setSidebarOpen((open) => {
            if (open) {
                setSidebarExitPending(true);
                return false;
            }
            return true;
        });
    };

    const onSidebarExitComplete = useCallback(() => {
        setSidebarExitPending(false);
    }, []);

    useEffect(() => {
        if (sidebarOpen) {
            setSidebarExitPending(false);
        }
    }, [sidebarOpen]);

    const onMessageReply = (message: ChatMessage) => {
        setReplyingToMessage(message);
    };

    return (
        <ChatRoomContext.Provider value={{ headerState: headerState, onHeaderStateChange: onHeaderStateChange, sidebarOpen, onSidebarToggle, onMessageReply }}>
            <div className="flex flex-grow">
                <div className="flex flex-col flex-grow">
                    <ChatRoomHeader />
                    <ChatMessageList />
                    <ChatMessageForm repyingToMessage={replyingToMessage} />
                </div>
                {(sidebarOpen || sidebarExitPending) && appMode === 'main' && import.meta.env.VITE_MOCK_UI !== 'true' && (
                    <ChatRoomSidebar
                        isExiting={sidebarExitPending && !sidebarOpen}
                        onExitAnimationEnd={onSidebarExitComplete}
                    />
                )}
            </div>
        </ChatRoomContext.Provider>
    );

}
