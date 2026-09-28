import { useContext, useEffect, useState } from "react";
import { ChatRoom } from "../../../domain";
import { ChatContext } from "../../ChatContext";
import { getSize, getSkeletonType } from "../../mondayUtils";
import { Chat } from "@chat";
import { ChatUserAvatar } from "../../user/ChatUserAvatar";
import { Skeleton } from "monday-ui-react-core";
import "./ChatRoomAvatar.scss";

type ChatRoomAvatarProps = {
    room: ChatRoom;
    size?: "default" | "cell";
};

const normalizeMemberIds = (raw: string[] | undefined): string[] =>
    Array.isArray(raw) ? raw.filter((id) => typeof id === "string" && id.length > 0) : [];

export function ChatRoomAvatar({ room, size = "default" }: ChatRoomAvatarProps) {

    const { onChatUsersRequested, currentUser } = useContext(ChatContext);
    const [memberIds, setMemberIds] = useState<string[]>(() => normalizeMemberIds(room.members));

    const getMembers = () => {
        const ids = normalizeMemberIds(memberIds);
        if (ids.length === 1) {
            return ids;
        }
        return ids.filter((memberId) => memberId !== currentUser?.uid);
    };

    const members = getMembers();

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        if (room.isPrivate) {
            unsubscribe = Chat.streamPrivateRoomMembers(room.id, (ids: string[]) => {
                const next = normalizeMemberIds(ids);
                setMemberIds(next);
                if (next.length > 0) {
                    onChatUsersRequested(next);
                }
            });
        } else {
            const next = normalizeMemberIds(room.members);
            setMemberIds(next);
            if (next.length > 0) {
                onChatUsersRequested(next);
            }
        }
        return () => unsubscribe?.();
    }, [room.id, room.isPrivate, room.members, onChatUsersRequested]);

    const isCell = size === "cell";
    const wrapperClass = isCell ? "w-10 h-10" : "w-12 h-12";
    // Compact room cell uses smaller top avatars so the 3-circle stack matches design.
    const innerSize = isCell ? getSize("small") : getSize("medium-8");
    const overflowClass = isCell ? "chat-room-avatar__overflow w-8 h-8" : "avatar w-8 h-8 border primary-border";
    const overflowPosClass = isCell ? "" : "left-2";
    const overflowStyle = isCell ? { bottom: "-3px", left: "50%", transform: "translateX(-50%)" } : undefined;

    const getUserAvatar = (userId: string, avatarSize: string, showStatus = false) => {
        return <ChatUserAvatar userId={userId} size={avatarSize} showStatus={showStatus} />;
    };

    if (members.length === 0) {
        return (
            <div className={wrapperClass}>
                <Skeleton type={getSkeletonType("circle")} />
            </div>
        );
    }

    if (members.length === 1) {
        return (
            <div className={wrapperClass}>
                {getUserAvatar(members[0], isCell ? "cell" : getSize("large"), true)}
            </div>
        );
    }

    if (members.length === 2) {
        return (
            <div className={`relative ${wrapperClass}`}>
                <div className="absolute top-0 left-0">
                    {getUserAvatar(members[0], innerSize)}
                </div>
                <div className="absolute bottom-0 right-0">
                    {getUserAvatar(members[1], innerSize)}
                </div>
            </div>
        );
    }

    if (members.length === 3) {
        return (
            <div className={`relative ${wrapperClass}`}>
                <div className="absolute top-0 left-0">
                    {getUserAvatar(members[0], innerSize)}
                </div>
                <div className="absolute top-0 right-0">
                    {getUserAvatar(members[1], innerSize)}
                </div>
                <div className={`absolute bottom-0 ${overflowPosClass}`} style={overflowStyle}>
                    {getUserAvatar(members[2], innerSize)}
                </div>
            </div>
        );
    }

    if (members.length > 3) {
        return (
            <div className={`relative ${wrapperClass}`}>
                <div className="absolute top-0 left-0">
                    {getUserAvatar(members[0], innerSize)}
                </div>
                <div className="absolute top-0 right-0">
                    {getUserAvatar(members[1], innerSize)}
                </div>
                <div className={`flex items-center justify-center absolute bottom-0 ${overflowPosClass} rounded-full z-10 ${overflowClass}`} style={overflowStyle}>
                    <span className={`${isCell ? "text-xs font-medium" : "text-sm"}`}>+{members.length - 2}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={wrapperClass}>
            <Skeleton type={getSkeletonType("circle")} />
        </div>
    );

}
