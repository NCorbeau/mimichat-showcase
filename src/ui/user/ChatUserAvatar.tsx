import { Avatar, Skeleton, Tooltip } from "monday-ui-react-core";
import { ChatUser } from "../../domain";
import { CHAT_MESSAGE_OVERLAY_Z_INDEX, getSize, getSkeletonType, getType } from "../mondayUtils";
import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../ChatContext";
import { ChatUserStatus, ChatUserStatusColor, ChatUserStatusDisplay } from "../../domain/ChatStatus";

type ChatUserAvatarProps = {
    user?: ChatUser;
    userId?: string;
    showStatus?: boolean;
    size?: string;
};

const initialsFromName = (name: string | undefined): string => {
    const n = name?.trim();
    if (!n) {
        return "?";
    }
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase() || "?";
    }
    return (parts[0].length <= 2 ? parts[0] : parts[0].slice(0, 2)).toUpperCase();
};

export function ChatUserAvatar({ user, userId, showStatus, size }: ChatUserAvatarProps) {

    const { userById, statusByUser, onChatUsersRequested } = useContext(ChatContext);
    const [avatarUser, setAvatarUser] = useState<ChatUser>(null);
    const [status, setStatus] = useState<ChatUserStatus>(null);

    useEffect(() => {
        if (user) {
            setAvatarUser(user);
            return;
        }
        if (!userId) {
            setAvatarUser(null);
            return;
        }
        const resolved = userById?.get(userId);
        if (resolved) {
            setAvatarUser(resolved);
            return;
        }
        setAvatarUser(null);
        onChatUsersRequested([userId]);
    }, [userId, user, userById, onChatUsersRequested]);

    useEffect(() => {
        if (!statusByUser || !avatarUser || !statusByUser.has(avatarUser.uid)) {
            return;
        }
        setStatus(statusByUser.get(avatarUser.uid));
    }, [statusByUser, avatarUser]);

    const getAvatarSize = () => {
        if (size === "medium-8" || size === "cell") {
            return getSize("medium");
        }
        return size ?? getSize("large");
    };

    const statusClass = `avatar-status-indicator absolute bottom-0 right-0 rounded-full border ui-border ${getAvatarSize() === 'medium' ? 'w-3 h-3' : 'w-4 h-4'}`;

    const sizeClass = size === "medium-8" ? "w-8 h-8" : size === "cell" ? "w-10 h-10" : "";

    if (!avatarUser) {
        return (
            <div className="relative">
                <Skeleton type={getSkeletonType("circle")} />
            </div>
        );
    }

    const imageUrl = avatarUser.avatarUrl?.trim() ? avatarUser.avatarUrl : undefined;
    const avatarType = imageUrl ? getType() : "text";

    return (
        <div className="relative flex items-end">
            <Avatar
                ariaLabel={avatarUser?.name}
                className={`avatar flex-shrink-0 ${sizeClass}`}
                size={getAvatarSize()}
                src={imageUrl}
                text={!imageUrl ? initialsFromName(avatarUser?.name) : undefined}
                tooltipProps={{
                    containerSelector: "body",
                    zIndex: CHAT_MESSAGE_OVERLAY_Z_INDEX,
                }}
                type={avatarType} />
            {
                showStatus && status ?
                    <Tooltip
                        containerSelector="body"
                        content={ChatUserStatusDisplay[status]}
                        zIndex={CHAT_MESSAGE_OVERLAY_Z_INDEX}
                    >
                        <div style={{ background: ChatUserStatusColor[status] }} className={statusClass} />
                    </Tooltip>
                    : !status && showStatus ?
                        <div style={{ background: 'gray' }} className={statusClass} />
                        :
                        null
            }
        </div>
    );
}