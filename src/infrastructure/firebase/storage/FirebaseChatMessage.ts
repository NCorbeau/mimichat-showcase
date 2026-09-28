import { Database, get, onValue, ref, remove, set } from "firebase/database";
import { ChatMessage } from "../../../domain";
import { Firestore, QueryConstraint, collection, doc, getDoc, getDocs, limitToLast, onSnapshot, orderBy, query, setDoc, where } from "firebase/firestore";
import { ChatUserId } from "../../../domain/ChatUserId";
import { ChatMessageReaction } from "../../../domain/ChatMessageReaction";
import { AccountIdProvider } from "../../../app/AccountIdProvider";

const addChatMessage = async (store: Firestore, message: ChatMessage) => {
  const accountId = AccountIdProvider.getInstance().getAccountId();
  const messagesRef = doc(store, `accounts/${accountId}/messages/${message.id}`);
  const { id, text, createdAt, userId, roomId, replyToId } = message;

  const data: { id: string, text: string, createdAt: number, userId: string, roomId: string, replyToId?: string; } = { id, text, createdAt, userId, roomId };
  if (replyToId) {
    data.replyToId = replyToId;
  }

  return setDoc(messagesRef, data);
};

const updateLastRoomMessage = async (db: Database, roomId: string, message: ChatMessage) => {
  const accountId = AccountIdProvider.getInstance().getAccountId();
  const lastRoomMessageRef = ref(db, `accounts/${accountId}/lastMessage/${roomId}`);
  const data: { id: string, text: string, createdAt: number, userId: string, roomId: string, replyToId?: string; } = { id: message.id, text: message.text, createdAt: message.createdAt, userId: message.userId, roomId: message.roomId };
  if (message.replyToId) {
    data.replyToId = message.replyToId;
  }
  return set(lastRoomMessageRef, data);
};

const streamChatMessages = (store: Firestore, roomId: string, onChange: (messages: ChatMessage[]) => void, limit?: number) => {
  const accountId = AccountIdProvider.getInstance().getAccountId();
  const messagesRef = collection(store, `accounts/${accountId}/messages`);

  const constraints: QueryConstraint[] = [
    where('roomId', '==', roomId),
    orderBy('createdAt', 'asc')
  ];
  if (limit) {
    constraints.push(limitToLast(limit));
  }

  const messagesQuery = query(
    messagesRef,
    ...constraints
  );

  return onSnapshot(messagesQuery, (messages) => {
    onChange(messages.docs.map((message) => {
      const messageData = message.data();
      return new ChatMessage(messageData.id, messageData.text, messageData.createdAt, messageData.userId, messageData.roomId, messageData.replyToId);
    }));
  });
};

const getChatMessages = async (store: Firestore, roomId: string, limit?: number, beforeCreatedAt?: number) => {
  const accountId = AccountIdProvider.getInstance().getAccountId();
  const messagesRef = collection(store, `accounts/${accountId}/messages`);

  const constraints: QueryConstraint[] = [
    where('roomId', '==', roomId),
    orderBy('createdAt', 'asc')
  ];

  if (beforeCreatedAt) {
    constraints.push(where('createdAt', '<', beforeCreatedAt));
  }

  if (limit) {
    constraints.push(limitToLast(limit));
  }

  const messagesQuery = query(
    messagesRef,
    ...constraints
  );

  const docs = await getDocs(messagesQuery);
  return docs.docs.map((message) => {
    const messageData = message.data();
    return new ChatMessage(messageData.id, messageData.text, messageData.createdAt, messageData.userId, messageData.roomId, messageData.replyToId);
  });
};

const getChatMessageById = async (store: Firestore, messageId: string) => {
  const accountId = AccountIdProvider.getInstance().getAccountId();
  const messageRef = doc(store, `accounts/${accountId}/messages/${messageId}`);
  const messageData = await getDoc(messageRef);
  const message = messageData.data();
  return new ChatMessage(message.id, message.text, message.createdAt, message.userId, message.roomId, message.replyToId);
};

const searchChatMessages = async (store: Firestore, searchQuery: string, roomIds: string[]) => {
  const accountId = AccountIdProvider.getInstance().getAccountId();
  const messagesRef = collection(store, `accounts/${accountId}/messages`);

  const constraints: QueryConstraint[] = [
    where('roomId', 'in', roomIds),
    where('text', '>=', searchQuery),
    where('text', '<=', searchQuery + '\uf8ff')
  ];

  const messagesQuery = query(
    messagesRef,
    ...constraints
  );

  const docs = await getDocs(messagesQuery);
  return docs.docs.map((message) => {
    const messageData = message.data();
    return new ChatMessage(messageData.id, messageData.text, messageData.createdAt, messageData.userId, messageData.roomId, messageData.replyToId);
  });
}

const getChatMessagesCount = async (store: Firestore, roomId: string) => {
  const accountId = AccountIdProvider.getInstance().getAccountId();
  const messagesRef = collection(store, `accounts/${accountId}/messages`);

  const messagesQuery = query(
    messagesRef,
    where('roomId', '==', roomId)
  );

  const docs = await getDocs(messagesQuery);
  return docs.size;
};

const streamLastRoomMessage = (db: Database, roomId: string, onChange: (message: ChatMessage) => void) => {
  const accountId = AccountIdProvider.getInstance().getAccountId();
  const lastRoomMessageRef = ref(db, `accounts/${accountId}/lastMessage/${roomId}`);
  return onValue(lastRoomMessageRef, (snapshot) => {
    const message = snapshot.val();
    if (message) {
      onChange(new ChatMessage(message.id, message.text, message.createdAt, message.userId, message.roomId, message.replyToId));
    }
  });
};

const getLastRoomMessage = async (db: Database, roomId: string) => {
  const accountId = AccountIdProvider.getInstance().getAccountId();
  const lastRoomMessageRef = ref(db, `accounts/${accountId}/lastMessage/${roomId}`);
  const messageData = await get(lastRoomMessageRef);
  const message = messageData.val();
  return new ChatMessage(message.id, message.text, message.createdAt, message.userId, message.roomId, message.replyToId);
};

const streamLastMessageByRoom = (db: Database, onChange: (lastMessageByRoom: Map<string, ChatMessage>) => void) => {
  const accountId = AccountIdProvider.getInstance().getAccountId();
  const lastMessageRef = ref(db, `accounts/${accountId}/lastMessage`);
  return onValue(lastMessageRef, (snapshot) => {
    const lastMessageByRoom = new Map<string, ChatMessage>();
    snapshot.forEach((roomSnapshot) => {
      const message = roomSnapshot.val();
      lastMessageByRoom.set(roomSnapshot.key, new ChatMessage(message.id, message.text, message.createdAt, message.userId, message.roomId, message.replyToId));
    });
    onChange(lastMessageByRoom);
  }, (error) => {
    console.error(error);
  });
};

const streamMessageReactions = (db: Database, messageId: string, onChange: (reactions: Map<ChatUserId, ChatMessageReaction>) => void) => {
  const accountId = AccountIdProvider.getInstance().getAccountId();
  const reactionsRef = ref(db, `accounts/${accountId}/reactions/${messageId}`);
  return onValue(reactionsRef, (snapshot) => {
    const reactions = new Map<ChatUserId, ChatMessageReaction>();
    snapshot.forEach((reactionSnapshot) => {
      const reaction = reactionSnapshot.val();
      reactions.set(reactionSnapshot.key, reaction);
    });
    onChange(reactions);
  });
};

const addMessageReaction = async (db: Database, messageId: string, reaction: ChatMessageReaction, userId: ChatUserId) => {
  const accountId = AccountIdProvider.getInstance().getAccountId();
  const reactionsRef = ref(db, `accounts/${accountId}/reactions/${messageId}/${userId}`);
  return set(reactionsRef, reaction);
};

const deleteMessageReaction = async (db: Database, messageId: string, userId: ChatUserId) => {
  const accountId = AccountIdProvider.getInstance().getAccountId();
  const reactionsRef = ref(db, `accounts/${accountId}/reactions/${messageId}/${userId}`);
  remove(reactionsRef);
};

const addUserMention = async (db: Database, messageId: string, userId: ChatUserId, roomId: string) => {
  const accountId = AccountIdProvider.getInstance().getAccountId();
  const mentionRef = ref(db, `accounts/${accountId}/mentions/${userId}/${roomId}`);
  return set(mentionRef, { messageId, createdAt: Date.now() });
};

const removeUserMentions = async (db: Database, userId: ChatUserId) => {
  const accountId = AccountIdProvider.getInstance().getAccountId();
  const mentionsRef = ref(db, `accounts/${accountId}/mentions/${userId}`);
  remove(mentionsRef);
};

const streamUserMentionMessageIds = (db: Database, userId: ChatUserId, onChange: (mentionMessageIds: string[]) => void) => {
  const accountId = AccountIdProvider.getInstance().getAccountId();
  const mentionsRef = ref(db, `accounts/${accountId}/mentions/${userId}`);
  return onValue(mentionsRef, (snapshot) => {
    const mentionMessageIds: string[] = [];
    const mentionsVal = snapshot.val() ?? {};
    if (mentionsVal) {
      Object.values(mentionsVal).forEach((mention: { messageId: string }) => {
        mentionMessageIds.push(mention.messageId);
      });
    }
    onChange(mentionMessageIds);
  });
};

export const FirebaseChatMessage = {
  addChatMessage,
  streamChatMessages,
  getChatMessages,
  getChatMessageById,
  searchChatMessages,
  getChatMessagesCount,
  streamLastRoomMessage,
  streamLastMessageByRoom,
  getLastRoomMessage,
  updateLastRoomMessage,
  streamMessageReactions,
  addMessageReaction,
  deleteMessageReaction,
  addUserMention,
  removeUserMentions,
  streamUserMentionMessageIds
};