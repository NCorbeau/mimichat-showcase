import { ChatMessage } from "./ChatMessage";

export type ChatMessagesByRoomId = { [roomId: string]: ChatMessage[]; };