import { AvatarGroup, EditableText, Tooltip } from "monday-ui-react-core";
import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../../ChatContext";
import { CHAT_MESSAGE_OVERLAY_Z_INDEX, getPosition, getSize } from "../../mondayUtils";
import { Chat } from "@chat";
import { ChatRoom } from "../../../domain";
import { ChatUserAvatar } from "../../user/ChatUserAvatar";
import "./ChatRoomInfobar.scss";

export function ChatRoomInfobar() {

    const { selectedRoom, userById, currentUser } = useContext(ChatContext);
    const [memberIds, setMemberIds] = useState<string[]>([]);
    const [overwrittenName, setOverwrittenName] = useState<string>(null);

    const getRoomName = (): string => {
        return overwrittenName || (selectedRoom?.getDisplayName?.(userById, currentUser) ?? ChatRoom.DEFAULT_NAME);
    };

    useEffect(() => {
        setOverwrittenName(null);
        let unsubscribe;
        if (selectedRoom?.isPrivate) {
            unsubscribe = Chat.streamPrivateRoomMembers(selectedRoom.id, (memberIds: string[]) => {
                setMemberIds(memberIds);
            });
        } else {
            setMemberIds(selectedRoom?.members ?? []);
        }
        return () => unsubscribe?.();
    }, [selectedRoom]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getHeadingType = (): any => {
        return 'H3';
    }

    const onRoomNameChange = (name: string) => {
        if (selectedRoom) {
            Chat.updateRoomName(selectedRoom.id, name);
            setOverwrittenName(name);
        }
    }

    return (
        <div className="flex flex-row items-center">
            <Tooltip
                className="w-full"
                containerSelector="body"
                content={getRoomName()}
                immediateShowDelay={50}
                position={getPosition("bottom")}
                zIndex={CHAT_MESSAGE_OVERLAY_Z_INDEX}
            >
                {import.meta.env.VITE_MOCK_UI === 'true'
                    ? <h3 className="chat-room-infobar__heading max-w-xl">{getRoomName()}</h3>
                    : <EditableText onChange={name => onRoomNameChange(name)} className="chat-room-infobar__heading max-w-xl" type={getHeadingType()} value={getRoomName()} />}
            </Tooltip>
            <AvatarGroup className="avatar-group gap-2 flex-shrink-0" size={getSize("medium")}>
                {memberIds.map(userId => (
                    <ChatUserAvatar key={userId} userId={userId} size="medium" showStatus={true} />
                ))}
            </AvatarGroup>
        </div>
    );
}
