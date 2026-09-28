import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../../../ChatContext";
import { Chat } from "@chat";
import { ChatMessageLineContext } from "../line/ChatMessageLineContext";

export function ChatMessageSeenIndicator() {

    const { currentUser, selectedRoom, userById } = useContext(ChatContext);
    const { message } = useContext(ChatMessageLineContext);

    const [lastSeenByUser, setLastSeenByUser] = useState(new Map<string, number>());
    const [readByCount, setReadByCount] = useState(0);

    useEffect(() => {
        if (selectedRoom) {
            const unsubscribe = Chat.streamLastSeenByUser(selectedRoom.id, (lastSeenByUser: Map<string, number>) => {
                setLastSeenByUser(lastSeenByUser);
            });
            return () => unsubscribe();
        }
    }, [selectedRoom]);

    useEffect(() => {
        setReadByCount(prev => {
            const count = getReadCount();
            if (prev === 0 && count > 0) {
                const element = document.getElementById("mimichat-message-seen");
                setTimeout(() => {
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
            }
            return count;
        });
    }, [lastSeenByUser]);

    const getReadByUser = () => {
        const readByUserId = selectedRoom?.members?.find(memberId => memberId !== currentUser?.uid);
        return userById.get(readByUserId);
    };

    const hasUserReadMessage = (readByUser: string) => {
        return lastSeenByUser.get(readByUser) >= message?.createdAt;
    };

    const getReadCount = () => {
        return Array.from(lastSeenByUser.values()).filter(createdAt => createdAt >= message?.createdAt).length - 1;
    };

    const empty = null;

    if (message?.userId !== currentUser?.uid) {
        return empty;
    }

    if (selectedRoom?.members.length === 2) {
        const readByUser = getReadByUser();
        if (!hasUserReadMessage(readByUser?.uid) || !readByUser) {
            return empty;
        }

        return (
            <div id="mimichat-message-seen" className="secondary text-right text-sm">
                Read by {readByUser.name}
            </div>
        );
    }

    const diff = selectedRoom?.members.length - 1 - readByCount;

    if (readByCount <= 0) {
        return empty;
    }

    if (selectedRoom?.members.length === 1) {
        return empty;
    }

    return (
        <div id="mimichat-message-seen" className="secondary text-right text-sm">
            Read by {diff === 0 ? "All" : `${readByCount} of ${selectedRoom?.members.length - 1}`}
        </div>
    );

}