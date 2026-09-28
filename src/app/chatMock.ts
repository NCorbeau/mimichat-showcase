import { ChatMessage, ChatRoom, ChatUser } from '../domain';
import { MondayWorkspace } from './MondayWorkspace';
import { ChatLink } from '../domain/ChatLink';
import { ChatUserStatus } from '../domain/ChatStatus';
import { ChatMessageReaction } from '../domain/ChatMessageReaction';
import { ChatUserId } from '../domain/ChatUserId';
import { ChatUserSuggestion } from '../domain/ChatUserSuggestion';
import { MondayBoard } from './MondayBoard';
import { MockMessageStore } from './mockMessageStore';
import { ChatCredential } from '../domain/ChatCredential';

const NOOP_UNSUB = () => {};

const MOCK_UID = 'mock-user-1';
const MOCK_UID_2 = 'mock-user-2';
const MOCK_UID_3 = 'mock-user-3';
const MOCK_UID_4 = 'mock-user-4';
const MOCK_UID_5 = 'mock-user-5';
const MOCK_ACCOUNT = 'mock-account';
const MOCK_WORKSPACE_ID = 'ws-mock';
const MOCK_ROOM_ID = 'room-mock-1';
const MOCK_ROOM_ID_2 = 'room-mock-2';
const MOCK_ROOM_ID_3 = 'room-mock-3';
const MOCK_BOARD_ID = 'board-mock-1';
const MOCK_BOARD_ROOM_ID = ChatRoom.getBoardRoomId(MOCK_WORKSPACE_ID, MOCK_BOARD_ID);

const mockWorkspace: MondayWorkspace = { id: MOCK_WORKSPACE_ID, name: 'Northstar Studio (fictional)' };

const mockUsers: Record<string, ChatUser> = {
  [MOCK_UID]: new ChatUser(MOCK_UID, 'Alex Morgan', 'alex@example.invalid', ''),
  [MOCK_UID_2]: new ChatUser(MOCK_UID_2, 'Ava Patel', 'ava@example.invalid', ''),
  [MOCK_UID_3]: new ChatUser(MOCK_UID_3, 'Leo Kim', 'leo@example.invalid', ''),
  [MOCK_UID_4]: new ChatUser(MOCK_UID_4, 'Priya Shah', 'priya@example.invalid', ''),
  [MOCK_UID_5]: new ChatUser(MOCK_UID_5, 'Noah Reed', 'noah@example.invalid', ''),
};

const mockRooms: ChatRoom[] = [
  new ChatRoom(MOCK_ROOM_ID, 'Product launch', MOCK_WORKSPACE_ID, false, [MOCK_UID, MOCK_UID_2, MOCK_UID_3, MOCK_UID_4]),
  new ChatRoom(MOCK_ROOM_ID_2, 'Ava · Alex', MOCK_WORKSPACE_ID, true, [MOCK_UID, MOCK_UID_2]),
  new ChatRoom(MOCK_ROOM_ID_3, 'Design team', MOCK_WORKSPACE_ID, false, [MOCK_UID, MOCK_UID_2, MOCK_UID_3, MOCK_UID_4, MOCK_UID_5]),
  new ChatRoom(MOCK_BOARD_ROOM_ID, 'Launch board', MOCK_WORKSPACE_ID, false, [MOCK_UID, MOCK_UID_2, MOCK_UID_3]),
];

const now = Date.now();
const mockMessagesByRoom: Record<string, ChatMessage[]> = {
  [MOCK_ROOM_ID]: [
    new ChatMessage('msg-0', 'I shared the launch checklist with the team.', now - 360000, MOCK_UID_2, MOCK_ROOM_ID),
    new ChatMessage('msg-1', 'The onboarding copy is ready for review.', now - 300000, MOCK_UID_3, MOCK_ROOM_ID),
    new ChatMessage('msg-2', 'I will review the handoff notes this afternoon.', now - 240000, MOCK_UID, MOCK_ROOM_ID),
    new ChatMessage('msg-3', 'I added comments to the mobile flow.', now - 180000, MOCK_UID_4, MOCK_ROOM_ID),
    new ChatMessage('msg-4', 'Great, we can use this room for final feedback.', now - 120000, MOCK_UID_2, MOCK_ROOM_ID),
    new ChatMessage('msg-5', 'The board is updated. Ready for tomorrow.', now - 60000, MOCK_UID, MOCK_ROOM_ID),
  ],
  [MOCK_ROOM_ID_2]: [
    new ChatMessage('msg-2-1', 'Can we check the mobile layout today?', now - 3000, MOCK_UID_2, MOCK_ROOM_ID_2),
    new ChatMessage('msg-2-2', 'Yes, I’ll share feedback after lunch.', now - 2500, MOCK_UID, MOCK_ROOM_ID_2),
  ],
  [MOCK_ROOM_ID_3]: [
    new ChatMessage('msg-3-1', 'The new chat layout is ready to try.', now - 5000, MOCK_UID, MOCK_ROOM_ID_3),
    new ChatMessage('msg-3-2', 'The spacing looks much clearer now.', now - 4000, MOCK_UID_2, MOCK_ROOM_ID_3),
    new ChatMessage('msg-3-3', 'I added the updated conversation states.', now - 3000, MOCK_UID_3, MOCK_ROOM_ID_3),
    new ChatMessage('msg-3-4', 'I’ll review those in the morning.', now - 2000, MOCK_UID_4, MOCK_ROOM_ID_3),
    new ChatMessage('msg-3-5', 'Ready for the next pass.', now - 1000, MOCK_UID_5, MOCK_ROOM_ID_3),
  ],
  [MOCK_BOARD_ROOM_ID]: [
    new ChatMessage('msg-board-1', 'Board sync at 10:00 tomorrow.', now - 4500, MOCK_UID_2, MOCK_BOARD_ROOM_ID),
    new ChatMessage('msg-board-2', 'The onboarding cards are in progress.', now - 3500, MOCK_UID_3, MOCK_BOARD_ROOM_ID),
  ],
};

const messageStore = new MockMessageStore(mockMessagesByRoom);

function getMockMessages(roomId: string): ChatMessage[] {
  return messageStore.get(roomId);
}

const authenticate = (_token: string) => {
  return Promise.resolve({ user: { uid: MOCK_UID } } satisfies ChatCredential);
};

const startOAuth = () => {
  // The showcase never initiates a real Monday OAuth flow.
  return Promise.resolve();
};

const addChatMessage = async (message: ChatMessage, _mentionedUsers: Map<string, ChatUser>) => {
  if (!message.text.trim() || !mockMessagesByRoom[message.roomId]) return;
  messageStore.add(message.roomId, message);
};

const streamChatMessages = (roomId: string, onChange: (messages: ChatMessage[]) => void, _limit?: number) => {
  return messageStore.subscribe(roomId, onChange);
};

const getChatMessages = (roomId: string, _limit?: number, _beforeCreatedAt?: number) => {
  return Promise.resolve(getMockMessages(roomId));
};

const getChatMessageById = (messageId: string) => {
  for (const roomId of Object.keys(mockMessagesByRoom)) {
    const messages = getMockMessages(roomId);
    const found = messages.find((m) => m.id === messageId);
    if (found) return Promise.resolve(found);
  }
  return Promise.resolve(
    new ChatMessage(messageId, '', 0, MOCK_UID, MOCK_ROOM_ID)
  );
};

const getChatMessagesCount = (roomId: string) => {
  return Promise.resolve(getMockMessages(roomId).length);
};

const streamLastRoomMessage = (roomId: string, onChange: (message: ChatMessage) => void) => {
  return messageStore.subscribe(roomId, (messages) => {
    const last = messages[messages.length - 1];
    if (last) onChange(last);
  });
};

const streamLastMessageByRoom = (onChange: (lastMessageByRoom: Map<string, ChatMessage>) => void) => {
  return messageStore.subscribeLatest(onChange);
};

const updateLastRoomMessage = (_roomId: string, _message: ChatMessage) => {
  return Promise.resolve();
};

const getUser = (userId: string) => {
  const user = mockUsers[userId] ?? new ChatUser(userId, 'Alex Morgan', 'alex@example.invalid', '');
  return Promise.resolve(user);
};

const getUsers = (userIds: string[]) => {
  if (userIds.length === 0) return Promise.resolve([]);
  return Promise.resolve(userIds.map((uid) => mockUsers[uid] ?? new ChatUser(uid, 'Alex Morgan', 'alex@example.invalid', '')));
};

const getChatRooms = async (_workspace: MondayWorkspace, userId: string) => {
  return Promise.resolve(
    mockRooms
      .filter((room) => room.members?.includes(userId))
      .map((room) => {
        const members = room.members?.includes(userId) ? room.members : [...(room.members ?? []), userId];
        return new ChatRoom(room.id, room.name, room.workspaceId, room.isPrivate, members);
      })
  );
};

const streamChatRooms = async (_workspaceId: string, userId: string, onChange: (rooms: ChatRoom[]) => void) => {
  const rooms = mockRooms
    .filter((room) => room.members?.includes(userId))
    .map((room) => {
      const members = room.members?.includes(userId) ? room.members : [...(room.members ?? []), userId];
      return new ChatRoom(room.id, room.name, room.workspaceId, room.isPrivate, members);
    });
  onChange(rooms);
  return NOOP_UNSUB;
};

const ensureDefaultPublicRoom = (_workspaceId: string, _workspaceName: string, _userId: string) => {
  return Promise.resolve();
};

const getChatRoom = async (roomId: string) => {
  const room = mockRooms.find((r) => r.id === roomId);
  return room ? Promise.resolve(room) : Promise.resolve(null);
};

const addChatRoom = (currentUserId: string, memberId: string, workspaceId: string) => {
  const roomId = crypto.randomUUID();
  const chatRoom = new ChatRoom(roomId, '', workspaceId, true, [currentUserId, memberId]);
  return Promise.resolve(chatRoom);
};

const updateRoomName = (_roomId: string, _name: string) => {
  return Promise.resolve();
};

const getPublicRoomMembers = (roomId: string) => {
  const room = mockRooms.find((r) => r.id === roomId);
  return Promise.resolve(room?.members ?? []);
};

const leavePrivateChatRoom = (_roomId: string, _userId: string) => {
  return Promise.resolve();
};

const streamPrivateRoomMembers = (roomId: string, onChange: (members: string[]) => void) => {
  const room = mockRooms.find((r) => r.id === roomId);
  onChange(room?.members ?? []);
  return NOOP_UNSUB;
};

const addPrivateRoomMember = (_roomId: string, _userId: string) => {
  return Promise.resolve();
};

const getContext = () => Promise.resolve({} as { data?: { boardId?: string | number } });

const getAccountId = () => Promise.resolve(MOCK_ACCOUNT);

const getWorkspace = () => Promise.resolve(mockWorkspace);

const getBoard = (): Promise<MondayBoard> => Promise.resolve({ id: MOCK_BOARD_ID, name: 'Launch board' });

const subscribeWorkspace = (onWorkspace: (workspace: MondayWorkspace | null) => void) => {
  onWorkspace(mockWorkspace);
  return NOOP_UNSUB;
};

const subscribeWorkspaceAndBoard = (
  onUpdate: (workspace: MondayWorkspace | null, board: MondayBoard | null) => void
) => {
  onUpdate(mockWorkspace, { id: MOCK_BOARD_ID, name: 'Launch board' });
  return NOOP_UNSUB;
};

const subscribeAccountId = (onAccountId: (accountId: string | null) => void) => {
  onAccountId(MOCK_ACCOUNT);
  return NOOP_UNSUB;
};

const waitForAccountId = () => Promise.resolve<string | null>(MOCK_ACCOUNT);

const getOrCreateBoardRoom = async (workspaceId: string, board: MondayBoard, userId: string) => {
  const roomId = ChatRoom.getBoardRoomId(workspaceId, board.id);
  return new ChatRoom(roomId, board.name, workspaceId, false, [userId]);
};

const getChatMemberSuggestions = (_workspaceId: string, _query: string) => {
  return Promise.resolve([
    new ChatUserSuggestion(MOCK_UID_2, 'Ava Patel', ''),
    new ChatUserSuggestion('mock-user-3', 'Leo Kim', ''),
  ]);
};

const updateLastSeen = (_roomId: string, _userId: string) => {
  return Promise.resolve();
};

const streamLastSeenByUser = (_roomId: string, onChange: (lastSeenByUser: Map<string, number>) => void) => {
  onChange(new Map());
  return NOOP_UNSUB;
};

const streamLastSeen = (_roomId: string, _userId: string, onChange: (lastSeen: number) => void) => {
  onChange(Date.now());
  return NOOP_UNSUB;
};

const setTyping = (_roomId: string, _userId: string) => {
  return Promise.resolve();
};

const streamTypingUsers = (_roomId: string, onChange: (typingUsers: string[]) => void) => {
  onChange([]);
  return NOOP_UNSUB;
};

const addRoomLink = (_roomId: string, _url: string, _title: string, _userId: string) => {
  return Promise.resolve();
};

const streamRoomLinks = (_roomId: string, onChange: (links: ChatLink[]) => void) => {
  onChange([]);
  return NOOP_UNSUB;
};

const searchMessages = async (_query: string, _roomIds: string[]) => {
  return Promise.resolve([]);
};

const updateUserStatus = (_userId: string, _status: ChatUserStatus) => {
  return Promise.resolve();
};

const streamStatusByUser = (_userIds: string[], onChange: (statusByUser: Map<string, ChatUserStatus>) => void) => {
  onChange(new Map());
  return NOOP_UNSUB;
};

const pauseNotifications = (_roomId: string, _userId: string, _until: number | null) => {
  return Promise.resolve();
};

const resumeNotifications = (_roomId: string, _userId: string) => {
  return Promise.resolve();
};

const streamPausedNotificationsByRoom = (_userId: string, onChange: (pausedNotificationsByRoom: Map<string, number | null>) => void) => {
  onChange(new Map());
  return NOOP_UNSUB;
};

const streamMessageReactions = (_messageId: string, onChange: (reactions: Map<ChatUserId, ChatMessageReaction>) => void) => {
  onChange(new Map());
  return NOOP_UNSUB;
};

const addMessageReaction = (_messageId: string, _reaction: ChatMessageReaction, _userId: ChatUserId) => {
  return Promise.resolve();
};

const deleteMessageReaction = (_messageId: string, _userId: ChatUserId) => {
  return Promise.resolve();
};

const addUserMention = (_messageId: string, _userId: ChatUserId, _roomId: string) => {
  return Promise.resolve();
};

const removeUserMentions = (_userId: ChatUserId) => {
  return Promise.resolve();
};

const streamUserMentionMessageIds = (_userId: ChatUserId, onChange: (mentionMessageIds: string[]) => void) => {
  onChange([]);
  return NOOP_UNSUB;
};

const streamThemeChanges = (onChange: (theme: 'light' | 'dark' | 'black') => void) => {
  onChange('light');
  return NOOP_UNSUB;
};

export const chatMock = {
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
  ensureDefaultPublicRoom,
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
  streamThemeChanges,
};

export const Chat = chatMock;
