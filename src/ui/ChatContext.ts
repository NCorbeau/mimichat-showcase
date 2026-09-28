import { createContext } from "react";
import { ChatUser, ChatRoom, ChatMessage } from "../domain";
import { ChatSearchMode } from "./search/ChatSearch";
import { ChatUserStatus } from "../domain/ChatStatus";

type ChatContextData = {
  currentUser: ChatUser;
  rooms: ChatRoom[];
  roomById: Map<string, ChatRoom>;
  selectedRoom: ChatRoom;
  userById: Map<string, ChatUser>;
  lastMessageByRoom: Map<string, ChatMessage>;
  statusByUser: Map<string, ChatUserStatus>;
  pausedNotificationsByRoom: Map<string, number | null>;
  headerState: 'default' | 'new-room';
  theme: 'light' | 'dark' | 'black';
  appMode: 'main' | 'board';
  onCreateNewRoom: () => void;
  onSelectRoom: (room: ChatRoom) => void;
  onChatMemberSelected: (memberUid: string) => void;
  onChatUsersRequested: (userIds: string[]) => void;
  onNewMessage: (message: ChatMessage) => void;
  onSearchOpen: (mode: ChatSearchMode, roomId?: string) => void;
  onScrollToMessage: (messageId: string) => void;
};

export const ChatContext = createContext<ChatContextData>({
  currentUser: null,
  rooms: [],
  roomById: new Map(),
  selectedRoom: null,
  userById: new Map(),
  onCreateNewRoom: null,
  onSelectRoom: null,
  lastMessageByRoom: new Map(),
  statusByUser: new Map(),
  pausedNotificationsByRoom: new Map(),
  headerState: null,
  theme: null,
  appMode: null,
  onChatMemberSelected: null,
  onChatUsersRequested: null,
  onNewMessage: null,
  onSearchOpen: null,
  onScrollToMessage: null
});