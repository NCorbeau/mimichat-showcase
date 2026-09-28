import { Icon, Tooltip } from "monday-ui-react-core";
import "./ChatBubble.scss";
import { ChatMessage } from "../../../../../domain";
import { DateTime } from "luxon";
import { CHAT_MESSAGE_OVERLAY_Z_INDEX, getPosition } from "../../../../mondayUtils";
import { useContext, useEffect, useState } from "react";
import { Chat } from "@chat";
import { ChatContext } from "../../../../ChatContext";
import { MessagePart } from "../MessagePart";
import { ChatBubbleMessage } from "./ChatBubbleMessage";
import { Replay } from "monday-ui-react-core/icons";
import { ChatMessageSideButtons } from "../side-buttons/ChatMessageSideButtons";
import { ChatBubbleReactions } from "../reactions/ChatBubbleReactions";
import { ChatMessageLineContext } from "../ChatMessageLineContext";
import { parseChatMessage } from "../../../../../domain/parseChatMessage";

type ChatBubbleProps = {
    own: boolean;
};

export function ChatBubble({ own }: ChatBubbleProps) {

    const { onChatUsersRequested, userById, currentUser, theme } = useContext(ChatContext);
    const { message } = useContext(ChatMessageLineContext);

    const [repliedMessage, setRepliedMessage] = useState<ChatMessage | null>(null);
    const [repliedMessageParts, setRepliedMessageParts] = useState<MessagePart[]>(null);

    useEffect(() => {
        if (message.replyToId) {
            Chat.getChatMessageById(message.replyToId).then((replyToMessage) => {
                setRepliedMessage(replyToMessage);
                onChatUsersRequested([replyToMessage.userId]);
            });
        }
    }, [message.replyToId]);

    useEffect(() => {
        if (repliedMessage) {
            const parts = parseChatMessage(repliedMessage.text);
            setRepliedMessageParts(parts);
        }
    }, [repliedMessage]);

    const getTooltip = () => {
        const createdDate = DateTime.fromMillis(message.createdAt);
        const now = DateTime.now();
        const yesterday = DateTime.now().minus({ days: 1 });

        if (createdDate.hasSame(now, 'day')) {
            return createdDate.toLocaleString(DateTime.TIME_SIMPLE);
        } else if (createdDate.hasSame(yesterday, 'day')) {
            return `yesterday ${createdDate.toLocaleString(DateTime.TIME_SIMPLE)}`;
        } else {
            return createdDate.toLocaleString(DateTime.DATETIME_SHORT);
        }
    };

    const getReactionsContainer = (rightClass: string) =>
        <div className="relative">
            <div className={`absolute -bottom-4 ${rightClass}`}>
                <ChatBubbleReactions />
            </div>
        </div>;

    return (
        <div className="w-full flex flex-col">
            {repliedMessage &&
                <div className="flex flex-col">
                    <div className={`flex flex-row gap-1 secondary text-xs my-1  ${own ? 'justify-end' : 'justify-start'}`}>
                        <Icon icon={Replay} iconSize={14} />
                        <span>
                            {
                                message.userId === currentUser.uid ? 'You' : userById.get(message.userId)?.name
                            }
                        </span>
                        <span>replied to</span>
                        <span>
                            {
                                repliedMessage.userId === currentUser.uid ? 'you' : userById.get(repliedMessage.userId)?.name
                            }
                        </span>
                    </div>
                    <div className={`w-full flex ${own ? 'justify-end' : 'justify-start'}`}>
                        <div className={`chat-bubble__replied-message max-w-[60%] w-fit flex flex-wrap rounded-lg ${theme === 'dark' || theme === 'black' ? 'chat-bubble__replied-message--dark' : ''}`}>
                            <ChatBubbleMessage messageParts={repliedMessageParts} own={repliedMessage.userId === currentUser.uid} emojiOnly={false} />
                        </div>
                    </div>
                </div>
            }

            <div className={`w-full flex gap-2 ${own ? 'flex-row-reverse' : ''}`}>
                <Tooltip
                    immediateShowDelay={50}
                    position={getPosition(own ? "bottom" : "bottom")}
                    content={getTooltip()}
                    zIndex={CHAT_MESSAGE_OVERLAY_Z_INDEX}
                    containerSelector="body"
                >
                    <div className={`cursor-default rounded-lg max-w-[80%] w-fit shrink-0 ${own ? 'chat-bubble--own' : 'chat-bubble--other'}`}>
                        <ChatBubbleMessage messageParts={message?.getMessageParts()} own={own} emojiOnly={message?.isEmojiOnly()} />
                    </div>
                </Tooltip>
                {!own && getReactionsContainer("right-3")}
                <ChatMessageSideButtons />
            </div>
            {own && getReactionsContainer("right-1")}
        </div>
    );
}
