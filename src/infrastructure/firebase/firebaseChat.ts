import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { FirebaseChatMessage } from "./storage/FirebaseChatMessage";
import { ChatMessage, ChatRoom } from "../../domain";
import { FirebaseAuth } from "./auth/FirebaseAuth";
import { FirebaseUser } from "./storage/FirebaseUser";
import { FirebaseChatRoom } from "./storage/FirebaseChatRoom";
import { getFirestore } from "firebase/firestore";
import { ChatLink } from "../../domain/ChatLink";
import { ChatUserStatus } from "../../domain/ChatStatus";
import { ChatUserId } from "../../domain/ChatUserId";
import { ChatMessageReaction } from "../../domain/ChatMessageReaction";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Mock UI imports this module too; defer real-service initialization until first use.
let app: ReturnType<typeof initializeApp> | undefined;
let db: ReturnType<typeof getDatabase> | undefined;
let store: ReturnType<typeof getFirestore> | undefined;
const getApp = () => (app ??= initializeApp(firebaseConfig));
const getDb = () => (db ??= getDatabase(getApp()));
const getStore = () => (store ??= getFirestore(getApp()));

export const FirebaseChat = {
  authenticate: (token) => FirebaseAuth.authenticate(getApp(), token),
  startOAuth: () => FirebaseAuth.startOAuth(),
  addChatMessage: (message: ChatMessage) => FirebaseChatMessage.addChatMessage(getStore(), message),
  streamChatMessages: (roomId: string, onChange: (messages: ChatMessage[]) => void, limit?: number) => FirebaseChatMessage.streamChatMessages(getStore(), roomId, onChange, limit),
  getChatMessages: (roomId: string, limit?: number, beforeCreatedAt?: number) => FirebaseChatMessage.getChatMessages(getStore(), roomId, limit, beforeCreatedAt),
  getChatMessageById: (messageId: string) => FirebaseChatMessage.getChatMessageById(getStore(), messageId),
  searchChatMessages: (query: string, roomIds: string[]) => FirebaseChatMessage.searchChatMessages(getStore(), query, roomIds),
  getChatMessagesCount: (roomId: string) => FirebaseChatMessage.getChatMessagesCount(getStore(), roomId),
  streamLastRoomMessage: (roomId: string, onChange: (message: ChatMessage) => void) => FirebaseChatMessage.streamLastRoomMessage(getDb(), roomId, onChange),
  streamLastMessageByRoom: (onChange: (lastMessageByRoom: Map<string, ChatMessage>) => void) =>
    FirebaseChatMessage.streamLastMessageByRoom(getDb(), onChange),
  getLastRoomMessage: (roomId: string) => FirebaseChatMessage.getLastRoomMessage(getDb(), roomId),
  getUser: (userId: string) => FirebaseUser.getUser(getStore(), userId),
  getUsers: (userIds: string[]) => FirebaseUser.getUsers(getStore(), userIds),
  getChatRooms: (workspaceId: string, userId: string) => FirebaseChatRoom.getChatRooms(getStore(), workspaceId, userId),
  getChatRoom: (roomId: string) => FirebaseChatRoom.getChatRoom(getStore(), roomId),
  addChatRoom: (chatRoom) => FirebaseChatRoom.addChatRoom(getStore(), chatRoom),
  updateRoomName: (roomId: string, name: string) => FirebaseChatRoom.updateRoomName(getStore(), roomId, name),
  streamChatRooms: (workspaceId: string, userId: string, onChange: (rooms: ChatRoom[]) => void) => FirebaseChatRoom.streamChatRooms(getStore(), workspaceId, userId, onChange),
  ensureDefaultPublicRoom: (workspaceId: string, workspaceName: string, userId: string) =>
    FirebaseChatRoom.ensureDefaultPublicRoom(getStore(), getDb(), workspaceId, workspaceName, userId),
  getPublicRoomMembers: (roomId: string) => FirebaseChatRoom.getPublicRoomMembers(getDb(), roomId),
  addPublicRoomMember: (roomId: string, userId: string) => FirebaseChatRoom.addPublicRoomMember(getDb(), roomId, userId),
  addPrivateRoomMember: (roomId: string, userId: string) => FirebaseChatRoom.addPrivateRoomMember(getStore(), roomId, userId),
  removePrivateRoomMember: (roomId: string, userId: string) => FirebaseChatRoom.removePrivateRoomMember(getStore(), roomId, userId),
  streamPrivateRoomMembers: (roomId: string, onChange: (members: string[]) => void) => FirebaseChatRoom.streamPrivateRoomMembers(getStore(), roomId, onChange),
  updateLastSeen: (roomId: string, userId: string) => FirebaseChatRoom.updateLastSeen(getDb(), roomId, userId),
  streamLastSeenByUser: (roomId: string, onChange: (lastSeenByUser: Map<string, number>) => void) => FirebaseChatRoom.streamLastSeenByUser(getDb(), roomId, onChange),
  streamLastSeen: (roomId: string, userId: string, onChange: (lastSeen: number) => void) => FirebaseChatRoom.streamLastSeen(getDb(), roomId, userId, onChange),
  getLastSeen: (roomId: string, userId: string) => FirebaseChatRoom.getLastSeen(getDb(), roomId, userId),
  setTyping: (roomId: string, userId: string) => FirebaseChatRoom.setTyping(getDb(), roomId, userId),
  streamLastTypingByUser: (roomId: string, onChange: (lastTypingByUser: Map<string, number>) => void) => FirebaseChatRoom.streamLastTypingByUser(getDb(), roomId, onChange),
  addRoomLink: (roomId: string, url: string, title: string, userId: string) => FirebaseChatRoom.addRoomLink(getDb(), roomId, url, title, userId),
  streamRoomLinks: (roomId: string, onChange: (links: ChatLink[]) => void) => FirebaseChatRoom.streamRoomLinks(getDb(), roomId, onChange),
  updateLastRoomMessage: (roomId: string, message: ChatMessage) => FirebaseChatMessage.updateLastRoomMessage(getDb(), roomId, message),
  updateUserStatus: (userId: string, status: ChatUserStatus) => FirebaseUser.updateUserStatus(getDb(), userId, status),
  streamStatusByUser: (userIds: string[], onChange: (statusByUser: Map<string, string>) => void) => FirebaseUser.streamStatusByUser(getDb(), userIds, onChange),
  pauseNotifications: (roomId: string, userId: string, until: number | null) => FirebaseChatRoom.pauseNotifications(getDb(), roomId, userId, until),
  resumeNotifications: (roomId: string, userId: string) => FirebaseChatRoom.resumeNotifications(getDb(), roomId, userId),
  streamPausedNotificationsByRoom: (userId: string, onChange: (pausedNotificationsByRoom: Map<string, number | null>) => void) => FirebaseChatRoom.streamPausedNotificationsByRoom(getDb(), userId, onChange),
  streamMessageReactions: (messageId: string, onChange: (reactions: Map<ChatUserId, ChatMessageReaction>) => void) => FirebaseChatMessage.streamMessageReactions(getDb(), messageId, onChange),
  addMessageReaction: (messageId: string, reaction: ChatMessageReaction, userId: ChatUserId) => FirebaseChatMessage.addMessageReaction(getDb(), messageId, reaction, userId),
  deleteMessageReaction: (messageId: string, userId: ChatUserId) => FirebaseChatMessage.deleteMessageReaction(getDb(), messageId, userId),
  addUserMention: (messageId: string, userId: ChatUserId, roomId: string) => FirebaseChatMessage.addUserMention(getDb(), messageId, userId, roomId),
  removeUserMentions: (userId: ChatUserId) => FirebaseChatMessage.removeUserMentions(getDb(), userId),
  streamUserMentionMessageIds: (userId: ChatUserId, onChange: (messageIds: string[]) => void) => FirebaseChatMessage.streamUserMentionMessageIds(getDb(), userId, onChange),
};
