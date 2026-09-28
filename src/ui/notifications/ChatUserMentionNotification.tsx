import React, { useEffect, useState } from "react";
import { ChatMessage, ChatRoom, ChatUser } from "../../domain";
import { CustomContentProps, SnackbarContent, closeSnackbar } from "notistack";
import { DateTime } from "luxon";
import { Button, IconButton } from "monday-ui-react-core";
import Replay from "monday-ui-react-core/dist/icons/Replay.js";
import CloseSmall from "monday-ui-react-core/dist/icons/CloseSmall.js";
import { getSize } from "../mondayUtils";

interface ChatUserMentionNotificationProps extends CustomContentProps {
    chatMessage: ChatMessage;
    userById: Map<string, ChatUser>;
    roomById: Map<string, ChatRoom>;
    onSelectRoom: (room: ChatRoom) => void;
    onChatUsersRequested: (userIds: string[]) => void;
}

export const ChatUserMentionNotification = React.forwardRef<HTMLDivElement, ChatUserMentionNotificationProps>((props, ref) => {

    const { chatMessage, id, userById, roomById, onSelectRoom, onChatUsersRequested } = props;

    const [messageRoom, setMessageRoom] = useState<ChatRoom>(null);

    useEffect(() => {
        if (!chatMessage) {
            return;
        }

        setMessageRoom(roomById.get(chatMessage.roomId));
        onChatUsersRequested([chatMessage.userId]);
    }, [chatMessage]);

    const getToastMessage = () => {
        if (!chatMessage) {
            return '';
        }

        if (chatMessage.text.length > 100) {
            return chatMessage.text.substring(0, 100) + '...';
        }

        return chatMessage.text.replaceAll('[', '').replaceAll(']', '');
    };

    const getTitle = () => {
        const userName = userById.get(chatMessage.userId)?.name;
        return userName ? `${userName} mentioned you` : 'You have been mentioned';
    };

    const getMentionTime = () => {
        const date = DateTime.fromMillis(chatMessage.createdAt);
        if (date.hasSame(DateTime.now(), 'day')) {
            return date.toLocaleString(DateTime.TIME_SIMPLE);
        }
        return date.toLocaleString(DateTime.DATETIME_SHORT);
    };

    const onReplyClick = () => () => {
        onSelectRoom(messageRoom);
    };

    const onNoticicationClose = () => {
        closeSnackbar(id);
    };

    return (
        <SnackbarContent ref={ref}>
            <div className="pt-0.5 px-4 pb-4 w-96 primary-selected-bg rounded-lg">
                <div className="w-full flex justify-end">
                    <IconButton icon={CloseSmall} size={getSize("small")} onClick={() => onNoticicationClose()} />
                </div>
                <div className="flex flex-col justify-center w-full">
                    <div className="flex flex-row justify-between w-full">
                        <span className="font-bold">{getTitle()}</span>
                        <span className="secondary">{getMentionTime()}</span>
                    </div>
                    <div className="w-full">
                        <span className="max-w-64 text-ellipsis overflow-hidden">{getToastMessage()}</span>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={onReplyClick()} leftIcon={Replay} size={getSize("small")}>Reply</Button>
                    </div>
                </div>
            </div>
        </SnackbarContent>
    );

});