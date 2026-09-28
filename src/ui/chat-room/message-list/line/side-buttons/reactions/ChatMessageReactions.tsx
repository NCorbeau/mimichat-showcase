import { useContext } from "react";
import { ChatMessageReaction } from "../../../../../../domain/ChatMessageReaction";
import { ChatContext } from "../../../../../ChatContext";
import { Chat } from "@chat";
import { ChatMessageLineContext } from "../../ChatMessageLineContext";
import "./ChatMessageReactions.scss";

export type ChatMessageReactionsProps = {
    onClose: () => void;
};

export function ChatMessageReactions({ onClose }: ChatMessageReactionsProps) {

    const { currentUser } = useContext(ChatContext);
    const { message, usersByReaction } = useContext(ChatMessageLineContext);

    const reactions: ChatMessageReaction[] = Object.values(ChatMessageReaction);

    const onReactionClick = (reaction: ChatMessageReaction) => {
        if (isSelected(reaction)) {
            Chat.deleteMessageReaction(message.id, currentUser.uid);
        } else {
            Chat.addMessageReaction(message.id, reaction, currentUser.uid);
        }
        onClose();
    };

    const isSelected = (reaction: ChatMessageReaction) => {
        return usersByReaction.get(reaction)?.includes(currentUser.uid);
    };

    return (
        <div className="flex flex-row">
            {
                reactions.map((reaction, index) => (
                    <div className={`chat-message-reactions__button-container flex items-center justify-center w-10 h-10 rounded-full ${isSelected(reaction) ? 'chat-message-reactions__button-container--selected' : ''}`}>
                        <button onClick={() => onReactionClick(reaction)} key={index} className={`text-3xl flex items-center align-middle`}>{reaction}</button>
                    </div>
                ))
            }
        </div>
    );

}