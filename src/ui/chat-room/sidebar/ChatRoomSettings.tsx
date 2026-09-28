import Search from "monday-ui-react-core/dist/icons/Search.js";
import NotificationsMuted from "monday-ui-react-core/dist/icons/NotificationsMuted.js";
import Invite from "monday-ui-react-core/dist/icons/Invite.js";
import Logout from "monday-ui-react-core/dist/icons/LogOut.js";
import { Icon } from "monday-ui-react-core";
import { ChatRoomLeaveModal } from "./settings/ChatRoomLeaveModal";
import { useState, useRef, useContext } from "react";
import { Chat } from "../../../app/chat";
import { ChatContext } from "../../ChatContext";
import { ChatSearchMode } from "../../search/ChatSearch";
import { ChatRoomPauseNotificationsModal } from "./settings/ChatRoomPauseNotificationsModal";
import { ChatRoomContext } from "../ChatRoomContext";


export function ChatRoomSettings() {

    const { selectedRoom, currentUser, onSearchOpen } = useContext(ChatContext);
    const { onHeaderStateChange } = useContext(ChatRoomContext);

    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showPauseNotificationsModal, setShowPauseNotificationsModal] = useState(false);

    const leaveRoomRef = useRef<HTMLDivElement>(null);
    const pauseNotificationsRef = useRef<HTMLDivElement>(null);

    const settingsItems = [
        {
            icon: Search,
            title: "Search in conversation",
            action: () => {
                onSearchOpen?.(ChatSearchMode.InRoom, selectedRoom.id);
            }
        },
        {
            icon: NotificationsMuted,
            title: "Pause notifications",
            action: () => {
                setShowPauseNotificationsModal(true);
            },
            itemRef: pauseNotificationsRef
        },
        {
            icon: Invite,
            title: "Invite",
            action: () => {
                onHeaderStateChange?.("ADD_MEMBERS");
            },
            visible: selectedRoom?.isPrivate
        },
        {
            icon: Logout,
            title: "Leave conversation",
            action: () => {
                setShowLeaveModal(true);
            },
            itemRef: leaveRoomRef,
            visible: selectedRoom?.isPrivate
        }
    ];

    const onLeaveRoom = () => {
        Chat.leavePrivateChatRoom(selectedRoom.id, currentUser.uid);
        setShowLeaveModal(false);
    };

    return (
        <div>
            {settingsItems.filter(item => item.visible === undefined || item.visible).map((item, index) => (
                <div ref={item.itemRef} onClick={() => item.action?.()} key={index} className="cursor-pointer border-b ui-border px-4 py-2">
                    <div className="flex items-center gap-3">
                        <Icon icon={item.icon} />
                        <span>{item.title}</span>
                    </div>
                </div>
            ))}
            <ChatRoomLeaveModal onCancel={() => setShowLeaveModal(false)} onConfirm={() => onLeaveRoom()} show={showLeaveModal} triggerElement={leaveRoomRef?.current} />
            <ChatRoomPauseNotificationsModal onClose={() => setShowPauseNotificationsModal(false)} show={showPauseNotificationsModal} triggerElement={pauseNotificationsRef?.current} />
        </div>
    );
}