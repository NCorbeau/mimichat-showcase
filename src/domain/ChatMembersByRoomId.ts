import { ChatUser } from ".";

export type ChatMembersByRoomId = { [roomId: string]: ChatUser[]; };