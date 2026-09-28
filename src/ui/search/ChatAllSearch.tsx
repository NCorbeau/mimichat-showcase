import { TabsContext, TabList, Tab, TabPanels, TabPanel, Search } from "monday-ui-react-core";
import { ChatMessageSearch } from "./ChatMessageSearch";
import { ChatRoomSearch } from "./ChatRoomSearch";
import { useContext, useEffect, useRef, useState } from "react";
import { ChatRoom } from "../../domain";
import { ChatContext } from "../ChatContext";

type ChatAllSearchProps = {
    onClose: () => void;
};

export function ChatAllSearch({ onClose }: ChatAllSearchProps) {

    const { onSelectRoom, onScrollToMessage } = useContext(ChatContext);

    const searchRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [focusRequested, setFocusRequested] = useState(false);

    useEffect(() => {
        if (focusRequested) {
            searchRef.current?.focus();
            setFocusRequested(false);
        }
    }, [focusRequested]);

    const onSearchChange = (value: string) => {
        setSearchQuery(value);
    };

    const onRoomClick = (room: ChatRoom) => {
        onSelectRoom(room);
        onClose();
    };

    const onMessageClick = (room: ChatRoom, messageId: string) => {
        onSelectRoom(room);
        onScrollToMessage(messageId);
        onClose();
    };

    const onTabChange = () => {
        setSearchQuery('');
        setFocusRequested(true);
    };

    return (
        <div className="h-full w-full flex flex-col justify-start items-center gap-6">
            <Search ref={searchRef} autoFocus={true} onChange={(value) => onSearchChange(value)} value={searchQuery} placeholder="Search" className="w-full flex-shrink-0" />
            <TabsContext className="tabs w-full flex-auto">
                <TabList>
                    <Tab onClick={onTabChange} className="flex-1">
                        Chats
                    </Tab>
                    <Tab onClick={onTabChange} className="flex-1">
                        In all conversations
                    </Tab>
                </TabList>
                <TabPanels renderOnlyActiveTab={true}>
                    <TabPanel className="flex-1">
                        <ChatRoomSearch onRoomClick={onRoomClick} query={searchQuery} />
                    </TabPanel>
                    <TabPanel className="flex-1">
                        <ChatMessageSearch onMessageClick={onMessageClick} query={searchQuery} />
                    </TabPanel>
                </TabPanels>
            </TabsContext>
        </div>
    );
}