import { createRef, useContext, useEffect, useState } from "react";
import { ChatMessage, ChatUser } from "../../../../domain";
import { ChatUserAvatar } from "../../../user/ChatUserAvatar";
import { ChatBubble } from "./bubble/ChatBubble";
import { ChatRoomActionContext } from "../../ChatRoomActionContext";
import { ChatMessageSeenIndicator } from "../message-seen/ChatMessageSeenIndicator";
import { ChatTypingUsers } from "../typing-user/ChatTypingUsers";
import { Chat } from "@chat";
import { ChatMessageReaction } from "../../../../domain/ChatMessageReaction";
import { ChatUserId } from "../../../../domain/ChatUserId";
import { ChatMessageLineContext } from "./ChatMessageLineContext";

type ChatMessageLineProps = {
    own: boolean;
    sender: ChatUser;
    message: ChatMessage;
    isLive: boolean;
    isLast: boolean;
    scrollToMessage: (messageId: string) => void;
};

export function ChatMessageLine({ own, sender, message, isLive, isLast, scrollToMessage }: ChatMessageLineProps) {

    const { onScrollToMessage } = useContext(ChatRoomActionContext);

    const ref = createRef<HTMLDivElement>();

    const [usersByReaction, setUsersByReaction] = useState<Map<ChatMessageReaction, ChatUserId[]>>(new Map<ChatMessageReaction, ChatUserId[]>);
    const [isEntering, setIsEntering] = useState<boolean>(isLive);

    useEffect(() => {
        onScrollToMessage(message.id, (messageId: string) => {
            scrollToMessage(messageId);
        });
    }, []);

    useEffect(() => {
        if (!isLive) {
            setIsEntering(false);
            return;
        }

        setIsEntering(true);
        const timeoutId = window.setTimeout(() => {
            setIsEntering(false);
        }, 260);

        return () => window.clearTimeout(timeoutId);
    }, [isLive, message.id]);

    useEffect(() => {
        const unsubscribe = Chat.streamMessageReactions(message.id, (reactions) => {
            const usersByReaction = new Map<ChatMessageReaction, ChatUserId[]>();
            reactions.forEach((reaction, userId) => {
                if (!usersByReaction.has(reaction)) {
                    usersByReaction.set(reaction, []);
                }
                usersByReaction.get(reaction).push(userId);
            });
            setUsersByReaction(usersByReaction);
        });
        return () => unsubscribe();
    }, [message]);

    return (
        <ChatMessageLineContext.Provider value={{ message, usersByReaction }}>
            <div id={message.id} ref={ref} className={`group px-3 flex gap-2 ${usersByReaction.size > 0 ? 'pb-6' : 'pb-2'} ${own ? 'flex-row-reverse' : ''} ${isEntering ? 'chat-message-line--enter' : ''}`}>
                {!own && <ChatUserAvatar user={sender} />}
                <ChatBubble own={own} />
            </div>
            {
                isLast && (
                    <div className="px-3 py-1 min-h-7">
                        <ChatMessageSeenIndicator />
                        <ChatTypingUsers />
                    </div>
                )
            }
        </ChatMessageLineContext.Provider>
    );
}