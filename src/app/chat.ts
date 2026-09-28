import { ChatMessage, ChatRoom, ChatUser } from '../domain';
import { FirebaseChat } from '../infrastructure/firebase/firebaseChat';
import { Monday } from '../infrastructure/monday/Monday';
import { MondayWorkspace } from './MondayWorkspace';
import { ChatLink } from '../domain/ChatLink';
import { UrlRegex } from './regex/url';
import { ChatUserStatus } from '../domain/ChatStatus';
import { ChatMessageReaction } from '../domain/ChatMessageReaction';
import { ChatUserId } from '../domain/ChatUserId';
import { MentionRegex } from './regex/mention';
import { MondayBoard } from './MondayBoard';
import { chatMock } from './chatMock';

const authenticate = (token: string) => {
    return FirebaseChat.authenticate(token);
};

const startOAuth = () => {
    return FirebaseChat.startOAuth();
};

const addChatMessage = async (message: ChatMessage, mentionedUsers: Map<string, ChatUser>) => {
    if (message.text === "") return Promise.resolve();

    const links = message.text.matchAll(UrlRegex);
    [...links]?.forEach(async link => {
        if (!link) return;
        const urlValue = link[0];
        const url = urlValue.startsWith("http") || urlValue.startsWith("https") ? urlValue : `http://${urlValue}`;
        const title = urlValue.replace("http://", "").replace("https://", "").split("/")[0];

        await addRoomLink(message.roomId, url, title, message.userId);
    });

    const mentions = message.text.matchAll(MentionRegex);
    [...mentions]?.forEach(async mention => {
        if (!mention) return;
        const userMention = mention[0];
        const userId = mentionedUsers.get(userMention)?.uid;
        if (!userId) return;
        await addUserMention(message.id, userId, message.roomId);
    });

    await FirebaseChat.updateLastRoomMessage(message.roomId, message);
    return FirebaseChat.addChatMessage(message);
};

const streamChatMessages = (roomId: string, onChange: (messages: ChatMessage[]) => void, limit?: number) => {
    return FirebaseChat.streamChatMessages(roomId, onChange, limit);
};

const getChatMessages = (roomId: string, limit?: number, beforeCreatedAt?: number) => {
    return FirebaseChat.getChatMessages(roomId, limit, beforeCreatedAt);
};

const getChatMessageById = (messageId: string) => {
    return FirebaseChat.getChatMessageById(messageId);
};

const getChatMessagesCount = (roomId: string) => {
    return FirebaseChat.getChatMessagesCount(roomId);
};

const streamLastRoomMessage = (roomId: string, onChange: (message: ChatMessage) => void) => {
    return FirebaseChat.streamLastRoomMessage(roomId, onChange);
};

const streamLastMessageByRoom = (onChange: (lastMessageByRoom: Map<string, ChatMessage>) => void) => {
    return FirebaseChat.streamLastMessageByRoom(onChange);
};

const getUser = (userId: string) => {
    return FirebaseChat.getUser(userId);
};

const getUsers = (userIds: string[]) => {
    if (userIds.length === 0) return Promise.resolve([]);
    return FirebaseChat.getUsers(userIds);
};

const listRoomsOrEmpty = async (workspaceId: string, userId: string): Promise<ChatRoom[]> => {
    try {
        const list = await FirebaseChat.getChatRooms(workspaceId, userId);
        return list;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('MimiChat: Firestore chatRooms list query failed (often missing composite index). Deploy firestore.indexes.json', e);
        return [];
    }
};

const getChatRooms = async (workspace: MondayWorkspace, userId: string) => {
    if (!workspace?.id || !userId) {
        return [];
    }
    let rooms = await listRoomsOrEmpty(workspace.id, userId);
    let publicRooms = rooms.filter(room => !room.isPrivate);
    const defaultPublicId = ChatRoom.getDefaultPublicRoomId(workspace.id);
    const hasDefaultPublicRoom = rooms.some((r) => !r.isPrivate && r.id === defaultPublicId);
    if (publicRooms.length === 0 || !hasDefaultPublicRoom) {
        try {
            await FirebaseChat.ensureDefaultPublicRoom(workspace.id, workspace.name, userId);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('MimiChat: could not create default public room (check Firestore rules and indexes)', e);
            throw e;
        }
        rooms = await listRoomsOrEmpty(workspace.id, userId);
        publicRooms = rooms.filter(room => !room.isPrivate);
    }
    if (publicRooms.length === 0) {
        const fallbackId = ChatRoom.getDefaultPublicRoomId(workspace.id);
        const raw = await FirebaseChat.getChatRoom(fallbackId);
        if (raw && !raw.isPrivate) {
            let members = raw.members ?? [];
            try {
                members = await FirebaseChat.getPublicRoomMembers(raw.id);
            } catch {
                /* RTDB may still be syncing */
            }
            rooms = [new ChatRoom(raw.id, raw.name, raw.workspaceId, raw.isPrivate, members)];
            publicRooms = rooms.filter((room) => !room.isPrivate);
        }
    }
    if (publicRooms.length === 0) {
        // eslint-disable-next-line no-console
        console.warn('MimiChat: no public rooms after ensure — check Firestore rules and deploy firestore.indexes.json');
        return [];
    }
    const publicRoom = publicRooms[0];
    let roomMembers = await FirebaseChat.getPublicRoomMembers(publicRoom.id);
    const isMember = roomMembers?.some(member => member === userId);
    if (!isMember) {
        await FirebaseChat.addPublicRoomMember(publicRoom.id, userId);
        roomMembers = [...roomMembers, userId];
    }
    return Promise.all(rooms.map(async room => {
        if (!room.isPrivate) {
            try {
                const members = await FirebaseChat.getPublicRoomMembers(room.id);
                return new ChatRoom(room.id, room.name, room.workspaceId, room.isPrivate, members);
            } catch {
                return new ChatRoom(room.id, room.name, room.workspaceId, room.isPrivate, room.members ?? []);
            }
        }
        return room;
    }));
};

const streamChatRooms = async (workspaceId: string, userId: string, onChange: (rooms: ChatRoom[]) => void) => {
    if (!workspaceId || !userId) {
        return () => {};
    }
    return FirebaseChat.streamChatRooms(workspaceId, userId, async (rooms: ChatRoom[]) => {
        const enrichedRooms = await Promise.all(rooms.map(async room => {
            if (room.isPrivate) {
                return room;
            }
            try {
                const members = await FirebaseChat.getPublicRoomMembers(room.id);
                return new ChatRoom(room.id, room.name, room.workspaceId, room.isPrivate, members);
            } catch {
                return new ChatRoom(room.id, room.name, room.workspaceId, room.isPrivate, room.members ?? []);
            }
        }));
        onChange(enrichedRooms);
    });
};

const getChatRoom = async (roomId: string) => {
    const room = await FirebaseChat.getChatRoom(roomId);

    if (!room) return null;

    if (!room.isPrivate) {
        return new ChatRoom(room.id, room.name, room.workspaceId, room.isPrivate, await FirebaseChat.getPublicRoomMembers(room.id));
    }
    return room;
};

const addChatRoom = (currentUserId: string, memberId: string, workspaceId: string) => {
    const roomId = crypto.randomUUID();
    const chatRoom = new ChatRoom(roomId, "", workspaceId, true, [currentUserId, memberId]);
    return FirebaseChat.addChatRoom(chatRoom);
};

const updateRoomName = (roomId: string, name: string) => {
    return FirebaseChat.updateRoomName(roomId, name);
};

const getPublicRoomMembers = (roomId: string) => {
    return FirebaseChat.getPublicRoomMembers(roomId);
};

const addPrivateRoomMember = (roomId: string, userId: string) => {
    return FirebaseChat.addPrivateRoomMember(roomId, userId);
};

const leavePrivateChatRoom = (roomId: string, userId: string) => {
    return FirebaseChat.removePrivateRoomMember(roomId, userId);
};

const streamPrivateRoomMembers = (roomId: string, onChange: (members: string[]) => void) => {
    return FirebaseChat.streamPrivateRoomMembers(roomId, onChange);
};

const getContext = () => Monday.getContext();

const getAccountId = () => {
    return Monday.getAccountId();
}

const getWorkspace = () => {
    return Monday.getWorkspace();
};

const getBoard = () => {
    return Monday.getBoard();
};

const subscribeWorkspace = (onWorkspace: (workspace: MondayWorkspace | null) => void) => {
    return Monday.subscribeWorkspace(onWorkspace);
};

const subscribeWorkspaceAndBoard = (
    onUpdate: (workspace: MondayWorkspace | null, board: MondayBoard | null) => void
) => {
    return Monday.subscribeWorkspaceAndBoard(onUpdate);
};

const subscribeAccountId = (onAccountId: (accountId: string | null) => void) => {
    return Monday.subscribeAccountId(onAccountId);
};

const accountIdFromMondayContext = (raw: unknown): string | null => {
    if (raw === undefined || raw === null || raw === "") {
        return null;
    }
    return String(raw);
};

/** One explicit context read (fast) then subscribe, so late subscribers are not missed after the hub's first get. */
const waitForAccountId = (timeoutMs = 60000): Promise<string | null> =>
    (async () => {
        const direct = await Monday.getAccountId();
        const directId = accountIdFromMondayContext(direct);
        if (directId) {
            return directId;
        }
        return new Promise<string | null>((resolve) => {
            let done = false;
            const cleanupRef: { unsub?: () => void; timer?: ReturnType<typeof setTimeout> } = {};
            const cleanup = () => {
                if (cleanupRef.timer !== undefined) {
                    clearTimeout(cleanupRef.timer);
                }
                cleanupRef.unsub?.();
            };
            const finish = (id: string | null) => {
                if (done || !id) {
                    return;
                }
                done = true;
                cleanup();
                resolve(id);
            };
            cleanupRef.unsub = subscribeAccountId(finish);
            cleanupRef.timer = setTimeout(() => {
                if (!done) {
                    done = true;
                    cleanup();
                    resolve(null);
                }
            }, timeoutMs);
        });
    })();

const getOrCreateBoardRoom = async (workspaceId: string, board: MondayBoard, userId: string) => {
    const roomId = ChatRoom.getBoardRoomId(workspaceId, board.id);
    let boardRoom = await getChatRoom(roomId);

    if (boardRoom) {
        const isMember = boardRoom.members?.some(member => member === userId);
        if (!isMember) {
            await FirebaseChat.addPublicRoomMember(roomId, userId);
            boardRoom = new ChatRoom(boardRoom.id, boardRoom.name, boardRoom.workspaceId, boardRoom.isPrivate, [...boardRoom.members, userId]);
        }

        return boardRoom;
    }

    const room = new ChatRoom(roomId, board.name, workspaceId, false, []);
    await FirebaseChat.addChatRoom(room);
    await FirebaseChat.addPublicRoomMember(roomId, userId);

    return new ChatRoom(roomId, board.name, workspaceId, false, [userId]);
}

const getChatMemberSuggestions = (workspaceId: string, query: string) => {
    return Monday.getUsers(workspaceId, query);
};

const updateLastSeen = (roomId: string, userId: string) => {
    return FirebaseChat.updateLastSeen(roomId, userId);
};

const streamLastSeenByUser = (roomId: string, onChange: (lastSeenByUser: Map<string, number>) => void) => {
    return FirebaseChat.streamLastSeenByUser(roomId, onChange);
};

const streamLastSeen = (roomId: string, userId: string, onChange: (lastSeen: number) => void) => {
    return FirebaseChat.streamLastSeen(roomId, userId, onChange);
};

const setTyping = (roomId: string, userId: string) => {
    return FirebaseChat.setTyping(roomId, userId);
};

const streamTypingUsers = (roomId: string, onChange: (typingUsers: string[]) => void) => {
    const onLastTypingByUserChange = (lastTypingByUser: Map<string, number>) => {
        const now = Date.now();
        const typingUsers = Array.from(lastTypingByUser.entries())
            .filter(([, lastTyping]) => now - lastTyping < 1000)
            .map(([userId,]) => userId);
        typingUsers.sort((a, b) => a.localeCompare(b));
        onChange(typingUsers);
    };

    return FirebaseChat.streamLastTypingByUser(roomId, onLastTypingByUserChange);
};

const addRoomLink = (roomId: string, url: string, title: string, userId: string) => {
    return FirebaseChat.addRoomLink(roomId, url, title, userId);
};

const streamRoomLinks = (roomId: string, onChange: (links: ChatLink[]) => void) => {
    return FirebaseChat.streamRoomLinks(roomId, onChange);
};

const searchMessages = async (query: string, roomIds: string[]) => {
    return FirebaseChat.searchChatMessages(query, roomIds);
};

const updateLastRoomMessage = (roomId: string, message: ChatMessage) => {
    return FirebaseChat.updateLastRoomMessage(roomId, message);
};

const updateUserStatus = (userId: string, status: ChatUserStatus) => {
    return FirebaseChat.updateUserStatus(userId, status);
};

const streamStatusByUser = (userIds: string[], onChange: (statusByUser: Map<string, ChatUserStatus>) => void) => {
    return FirebaseChat.streamStatusByUser(userIds, onChange);
};

const pauseNotifications = (roomId: string, userId: string, until: number | null) => {
    return FirebaseChat.pauseNotifications(roomId, userId, until);
};

const resumeNotifications = (roomId: string, userId: string) => {
    return FirebaseChat.resumeNotifications(roomId, userId);
};

const streamPausedNotificationsByRoom = (userId: string, onChange: (pausedNotificationsByRoom: Map<string, number | null>) => void) => {
    return FirebaseChat.streamPausedNotificationsByRoom(userId, onChange);
};

const streamMessageReactions = (messageId: string, onChange: (reactions: Map<ChatUserId, ChatMessageReaction>) => void) => {
    return FirebaseChat.streamMessageReactions(messageId, onChange);
};

const addMessageReaction = (messageId: string, reaction: ChatMessageReaction, userId: ChatUserId) => {
    return FirebaseChat.addMessageReaction(messageId, reaction, userId);
};

const deleteMessageReaction = (messageId: string, userId: ChatUserId) => {
    return FirebaseChat.deleteMessageReaction(messageId, userId);
};

const addUserMention = (messageId: string, userId: ChatUserId, roomId: string) => {
    return FirebaseChat.addUserMention(messageId, userId, roomId);
};

const removeUserMentions = (userId: ChatUserId) => {
    return FirebaseChat.removeUserMentions(userId);
};

const streamUserMentionMessageIds = (userId: ChatUserId, onChange: (mentionMessageIds: string[]) => void) => {
    return FirebaseChat.streamUserMentionMessageIds(userId, onChange);
};

const streamThemeChanges = (onChange: (theme: 'light' | 'dark' | 'black') => void) => {
    return Monday.listenToThemeChange(onChange);
};

const realChat = {
    authenticate,
    startOAuth,
    addChatMessage,
    streamChatMessages,
    getChatMessages,
    getChatMessageById,
    getChatMessagesCount,
    streamLastRoomMessage,
    streamLastMessageByRoom,
    updateLastRoomMessage,
    getUser,
    getUsers,
    getChatRooms,
    getChatRoom,
    addChatRoom,
    updateRoomName,
    streamChatRooms,
    getPublicRoomMembers,
    leavePrivateChatRoom,
    streamPrivateRoomMembers,
    addPrivateRoomMember,
    getContext,
    getAccountId,
    getWorkspace,
    getBoard,
    subscribeWorkspace,
    subscribeWorkspaceAndBoard,
    subscribeAccountId,
    waitForAccountId,
    getChatMemberSuggestions,
    updateLastSeen,
    streamLastSeenByUser,
    streamLastSeen,
    setTyping,
    streamTypingUsers,
    addRoomLink,
    streamRoomLinks,
    searchMessages,
    updateUserStatus,
    streamStatusByUser,
    pauseNotifications,
    resumeNotifications,
    streamPausedNotificationsByRoom,
    streamMessageReactions,
    addMessageReaction,
    deleteMessageReaction,
    addUserMention,
    removeUserMentions,
    streamUserMentionMessageIds,
    getOrCreateBoardRoom,
    streamThemeChanges
};

export const Chat = import.meta.env.VITE_MOCK_UI === 'true' ? chatMock : realChat;