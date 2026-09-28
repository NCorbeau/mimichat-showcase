import { useContext, useEffect, useRef, useState } from "react";
import { ChatUserId } from "../../../../../domain/ChatUserId";
import { Tooltip } from "monday-ui-react-core";
import { CHAT_MESSAGE_OVERLAY_Z_INDEX } from "../../../../mondayUtils";
import { ChatContext } from "../../../../ChatContext";
import { ChatMessageLineContext } from "../ChatMessageLineContext";
import "./ChatBubbleReactions.scss";

export function ChatBubbleReactions() {

    const { userById } = useContext(ChatContext);
    const { usersByReaction } = useContext(ChatMessageLineContext);
    const previousReactionsRef = useRef<Map<string, number>>(new Map());
    const [animatedReactions, setAnimatedReactions] = useState<Set<string>>(new Set());

    const getTooltip = (userIds: ChatUserId[]) => {
        return (
            <div className="flex flex-col gap-1">
                {
                    userIds.map(userId => (
                        <div key={userId}>{userById.get(userId)?.name}</div>
                    ))
                }
            </div>
        );
    };

    useEffect(() => {
        const currentReactions = new Map<string, number>();
        const changedReactions: string[] = [];

        usersByReaction.forEach((users, reaction) => {
            currentReactions.set(reaction, users.length);
            if (previousReactionsRef.current.get(reaction) !== users.length) {
                changedReactions.push(reaction);
            }
        });

        previousReactionsRef.current = currentReactions;

        if (changedReactions.length === 0) {
            return;
        }

        setAnimatedReactions(new Set(changedReactions));
        const timeoutId = window.setTimeout(() => {
            setAnimatedReactions(new Set());
        }, 260);

        return () => window.clearTimeout(timeoutId);
    }, [usersByReaction]);

    if (usersByReaction.size === 0) {
        return null;
    }

    return (
        <div className="chat-bubble-reactions h-6 shadow-md px-1 bg-allgrey rounded-3xl flex flex-row gap-1">
            {
                Array.from(usersByReaction.entries()).map(([reaction, users]) => (
                    <Tooltip
                        key={reaction}
                        content={getTooltip(users.map((userId) => userId))}
                        zIndex={CHAT_MESSAGE_OVERLAY_Z_INDEX}
                        containerSelector="body"
                    >
                        <div key={reaction} className={`chat-bubble-reactions__item flex flex-row gap-1 items-center ${animatedReactions.has(reaction) ? 'chat-bubble-reactions__item--animate' : ''}`}>
                            <span>{reaction}</span>
                            {users.length > 1 && <span className="secondary">{users.length}</span>}
                        </div>
                    </Tooltip>
                ))
            }
        </div>
    );

}