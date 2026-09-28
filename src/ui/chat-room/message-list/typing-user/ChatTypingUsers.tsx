import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../../../ChatContext";
import { Chat } from "@chat";
import { Avatar } from "monday-ui-react-core";
import { getSize, getType } from "../../../mondayUtils";
import "./ChatTypingUsers.scss";

export function ChatTypingUsers() {

    const { currentUser, userById, selectedRoom } = useContext(ChatContext);

    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [timeoutId, setTimeoutId] = useState<number>(null);
    const [clearTimeoutRequested, setClearTimeoutRequested] = useState<boolean>(false);

    const clearTimeoutRef = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }
    };

    useEffect(() => {
        if (selectedRoom === null) {
            setTypingUsers([]);
        } else {
            const unsubscribe = Chat.streamTypingUsers(selectedRoom.id, (typingUsers: string[]) => {
                setClearTimeoutRequested(true);
                const users = typingUsers.filter(userId => userId !== currentUser?.uid);
                setTypingUsers(users);


                setTimeout(() => {
                    const userId =  users.at(-1);
                    const element = document.getElementById(userId);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
            });
            return () => unsubscribe();
        }

    }, [selectedRoom]);

    useEffect(() => {
        if (clearTimeoutRequested) {
            clearTimeoutRef();
            setClearTimeoutRequested(false);
        }
    }, [clearTimeoutRequested]);

    useEffect(() => {
        if (typingUsers.length > 0) {
            const timeoutId = setTimeout(() => {
                setTypingUsers([]);
                setTimeoutId(null);
            }, 1000) as unknown as number;
            setTimeoutId(timeoutId);
        }
    }, [typingUsers]);


    if (typingUsers.length === 0) {
        return null;
    }

    return (
        typingUsers.map(userId => {
            const user = userById.get(userId);
            if (!user) return null;
            return (
                <div id={userId} key={userId} className="py-1 flex gap-2 items-center">
                    <Avatar ariaLabel={user.name} className="avatar" size={getSize("large")} src={user.avatarUrl} type={getType()} />
                    <div className="bg-disabled-background flex items-center p-2 gap-1 rounded">
                        <span className="bg-disabled-text rounded-full w-2 h-2"></span>
                        <span className="bg-disabled-text rounded-full w-2 h-2 chat-typing-user__animated-dot-first"></span>
                        <span className="bg-disabled-text rounded-full w-2 h-2 chat-typing-user__animated-dot-second"></span>
                    </div>
                </div>
            );
        })
    );
}