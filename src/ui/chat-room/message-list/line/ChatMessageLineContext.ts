import { createContext } from "react";
import { ChatMessage } from "../../../../domain";
import { ChatMessageReaction } from "../../../../domain/ChatMessageReaction";
import { ChatUserId } from "../../../../domain/ChatUserId";

type ChatMessageLineContextData = {
    message: ChatMessage;
    usersByReaction: Map<ChatMessageReaction, ChatUserId[]>;
};

export const ChatMessageLineContext = createContext<ChatMessageLineContextData>({ message: null, usersByReaction: null });