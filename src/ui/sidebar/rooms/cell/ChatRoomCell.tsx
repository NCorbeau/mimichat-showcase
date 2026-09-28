import { useContext, useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { ChatMessage, ChatRoom } from "../../../../domain";
import { ChatContext } from "../../../ChatContext";
import "./ChatRoomCell.scss";
import { Chat } from "@chat";
import { ChatRoomAvatar } from "../../../chat-room/avatar/ChatRoomAvatar";
import { Icon, Skeleton, Tooltip } from "monday-ui-react-core";
import { NotificationsMuted } from "monday-ui-react-core/icons";

const TITLE_TOOLTIP_DELAY_MS = 50;
const TITLE_TOOLTIP_OFFSET = 12;

type ChatRoomCellProps = {
    room: ChatRoom;
};

export function ChatRoomCell({ room }: ChatRoomCellProps) {

    const { selectedRoom, onSelectRoom, userById, currentUser, lastMessageByRoom, pausedNotificationsByRoom } = useContext(ChatContext);

    const lastMessage: ChatMessage | null = lastMessageByRoom.get(room.id) ?? null;
    const [lastSeen, setLastSeen] = useState<number>(0);
    const isUnread = lastSeen > 0 && !!lastMessage && lastSeen < lastMessage.createdAt && selectedRoom?.id !== room.id;
    const pausedUntil = pausedNotificationsByRoom.get(room.id);
    const notificationsPaused = pausedUntil === -1 || (pausedUntil ?? 0) > Date.now();
    const membersLoading = room.isPrivate && room.members.some(memberId => !userById.has(memberId));
    const [titleTooltipPos, setTitleTooltipPos] = useState<{ x: number; y: number } | null>(null);
    const titleTooltipTimerRef = useRef<number | null>(null);
    const titlePointerRef = useRef({ x: 0, y: 0 });

    const getRoomName = (): string => {
        const name = room?.getDisplayName(userById, currentUser) ?? ChatRoom.DEFAULT_NAME;
        return name.slice(0, 100);
    };

    useEffect(() => {
        if (!currentUser?.uid) return;
        const unsubscribe = Chat.streamLastSeen(room.id, currentUser.uid, (lastSeen) => {
            setLastSeen(lastSeen);
        });
        return () => unsubscribe();
    }, [room.id, currentUser?.uid]);

    useEffect(() => {
        return () => {
            if (titleTooltipTimerRef.current !== null) {
                window.clearTimeout(titleTooltipTimerRef.current);
            }
        };
    }, []);

    const clearTitleTooltipShowTimer = () => {
        if (titleTooltipTimerRef.current !== null) {
            window.clearTimeout(titleTooltipTimerRef.current);
            titleTooltipTimerRef.current = null;
        }
    };

    const onTitleMouseEnter = (e: MouseEvent) => {
        titlePointerRef.current = { x: e.clientX, y: e.clientY };
        clearTitleTooltipShowTimer();
        titleTooltipTimerRef.current = window.setTimeout(() => {
            setTitleTooltipPos({ x: titlePointerRef.current.x, y: titlePointerRef.current.y });
            titleTooltipTimerRef.current = null;
        }, TITLE_TOOLTIP_DELAY_MS);
    };

    const onTitleMouseMove = (e: MouseEvent) => {
        titlePointerRef.current = { x: e.clientX, y: e.clientY };
        setTitleTooltipPos((prev) =>
            prev !== null ? { x: e.clientX, y: e.clientY } : prev
        );
    };

    const onTitleMouseLeave = () => {
        clearTitleTooltipShowTimer();
        setTitleTooltipPos(null);
    };

    return (
        <>
        <div onClick={() => onSelectRoom(room)}
            className={`chat-cell w-full h-14 overflow-hidden cursor-pointer ${room.id === selectedRoom?.id ? 'chat-cell--selected' : ''} ${room.isBoardRoom() ? 'chat-cell--board' : ''}`}>
            {room.isBoardRoom() && (
                <span className="chat-cell__board-badge">Board</span>
            )}
            <div className="chat-cell__content w-full flex justify-between items-center h-full">
                <div className="chat-cell__main flex min-w-0 flex-1">
                    <div className="chat-cell__avatar flex-shrink-0">
                        <ChatRoomAvatar room={room} size="cell" />
                    </div>
                    <div className="chat-cell__text h-full w-full flex flex-col min-w-0">
                        {
                            membersLoading ?
                                <Skeleton width={120} height={14} className="m-1" />
                                :
                                <div
                                    className="chat-cell__title whitespace-nowrap overflow-hidden text-ellipsis w-full"
                                    onMouseEnter={onTitleMouseEnter}
                                    onMouseMove={onTitleMouseMove}
                                    onMouseLeave={onTitleMouseLeave}
                                >
                                    {getRoomName()}
                                </div>
                        }

                        {
                            lastMessage === null ?
                                <Skeleton height={14} />
                                :
                                <div className={`chat-cell__message whitespace-nowrap text-ellipsis overflow-hidden w-full ${isUnread ? 'font-bold' : ''}`}>{lastMessage?.text.replaceAll('[', '').replaceAll(']', '')}</div>
                        }

                    </div>
                </div>
                {notificationsPaused &&
                    <div className="chat-cell__meta flex items-center flex-shrink-0">
                        <Tooltip content="Notifications paused">
                            <div className="chat-cell__notifications-icon">
                                <Icon icon={NotificationsMuted} iconSize={20} />
                            </div>
                        </Tooltip>
                    </div>}
            </div>
        </div>
        {titleTooltipPos !== null &&
            createPortal(
                <div
                    className="chat-cell__title-hover-tooltip"
                    style={{
                        left: titleTooltipPos.x + TITLE_TOOLTIP_OFFSET,
                        top: titleTooltipPos.y + TITLE_TOOLTIP_OFFSET,
                    }}
                    role="tooltip"
                >
                    {getRoomName()}
                </div>,
                document.body
            )}
        </>
    );

}
