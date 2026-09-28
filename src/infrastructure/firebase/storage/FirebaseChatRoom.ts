import { Firestore, and, collection, doc, getDoc, getDocs, onSnapshot, or, query, runTransaction, setDoc, where } from "firebase/firestore";
import { ChatRoom } from "../../../domain";
import { Database, get, onValue, push, ref, remove, set } from "firebase/database";
import { ChatLink } from "../../../domain/ChatLink";
import { AccountIdProvider } from "../../../app/AccountIdProvider";

const getChatRooms = async (store: Firestore, workspaceId: string, userId: string) => {
    if (!workspaceId || !userId) {
        return [];
    }
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const chatRoomsRef = collection(store, `accounts/${accountId}/chatRooms`);
    const chatRoomsQuery = query(
        chatRoomsRef,
        or(
            and(
                where('workspaceId', '==', workspaceId),
                where('isPrivate', '==', false)
            ),
            and(
                where('workspaceId', '==', workspaceId),
                where('isPrivate', '==', true),
                where('members', 'array-contains', userId)
            )
        ));
    const chatRooms = await getDocs(chatRoomsQuery);
    return chatRooms.docs.map((chatRoom) => {
        const chatRoomData = chatRoom.data();
        return new ChatRoom(chatRoomData.id, chatRoomData.name, chatRoomData.workspaceId, chatRoomData.isPrivate, chatRoomData.members);
    });
};

const streamChatRooms = (store: Firestore, workspaceId: string, userId: string, onChange: (rooms: ChatRoom[]) => void) => {
    if (!workspaceId || !userId) {
        return () => {};
    }
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const chatRoomsRef = collection(store, `accounts/${accountId}/chatRooms`);
    const chatRoomsQuery = query(
        chatRoomsRef,
        or(
            and(
                where('workspaceId', '==', workspaceId),
                where('isPrivate', '==', false)
            ),
            and(
                where('workspaceId', '==', workspaceId),
                where('isPrivate', '==', true),
                where('members', 'array-contains', userId)
            )
        ));

    return onSnapshot(
        chatRoomsQuery,
        (chatRooms) => {
            onChange(chatRooms.docs.map((chatRoom) => {
                const chatRoomData = chatRoom.data();
                return new ChatRoom(chatRoomData.id, chatRoomData.name, chatRoomData.workspaceId, chatRoomData.isPrivate, chatRoomData.members);
            }));
        },
        (error) => {
            // eslint-disable-next-line no-console
            console.error('MimiChat: chatRooms query failed (often missing Firestore composite index — deploy firestore.indexes.json)', error);
        }
    );
};

const getChatRoom = async (store: Firestore, roomId: string) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const chatRoomRef = doc(store, `accounts/${accountId}/chatRooms`, roomId);
    const chatRoom = await getDoc(chatRoomRef);
    const chatRoomData = chatRoom.data();

    if (!chatRoomData) {
        return null;
    }

    return new ChatRoom(chatRoomData.id, chatRoomData.name, chatRoomData.workspaceId, chatRoomData.isPrivate, chatRoomData.members);
};

const addChatRoom = async (store: Firestore, chatRoom: ChatRoom) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const chatRoomRef = doc(store, `accounts/${accountId}/chatRooms`, chatRoom.id);
    const { id, name, workspaceId, isPrivate, members } = chatRoom;
    await setDoc(chatRoomRef, { id, name, workspaceId, isPrivate, members });
    return chatRoom;
};

const updateRoomName = async (store: Firestore, roomId: string, name: string) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const chatRoomRef = doc(store, `accounts/${accountId}/chatRooms`, roomId);
    return setDoc(chatRoomRef, { name }, { merge: true });
};

const getPublicRoomMembers = async (db: Database, roomId: string) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const roomMembersRef = ref(db, `accounts/${accountId}/roomMembers/${roomId}`);
    const roomMembers = await get(roomMembersRef);
    const values = Object.values<string>(roomMembers.val() ?? {});
    return [...new Set(values)];
};

const ensureDefaultPublicRoom = async (
    store: Firestore,
    db: Database,
    workspaceId: string,
    workspaceName: string,
    userId: string
) => {
    if (!workspaceId || !userId) {
        return;
    }
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const roomId = ChatRoom.getDefaultPublicRoomId(workspaceId);
    const chatRoomRef = doc(store, `accounts/${accountId}/chatRooms`, roomId);

    await runTransaction(store, async (txn) => {
        const snap = await txn.get(chatRoomRef);
        if (!snap.exists()) {
            txn.set(chatRoomRef, {
                id: roomId,
                name: workspaceName,
                workspaceId,
                isPrivate: false,
                members: [userId],
            });
        } else {
            const data = snap.data();
            const members: string[] = Array.isArray(data.members) ? [...data.members] : [];
            if (!members.includes(userId)) {
                members.push(userId);
                txn.update(chatRoomRef, { members });
            }
        }
    });

    await addPublicRoomMember(db, roomId, userId);
};

const addPublicRoomMember = async (db: Database, roomId: string, userId: string) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const roomMembersRef = ref(db, `accounts/${accountId}/roomMembers/${roomId}`);
    const memberRef = push(roomMembersRef);
    return set(memberRef, userId);
};

const addPrivateRoomMember = async (store: Firestore, roomId: string, userId: string) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const chatRoomRef = doc(store, `accounts/${accountId}/chatRooms`, roomId);
    const chatRoom = await getDoc(chatRoomRef);
    const chatRoomData = chatRoom.data();
    const members = chatRoomData.members;
    members.push(userId);
    return setDoc(chatRoomRef, { members }, { merge: true });
};

const removePrivateRoomMember = async (store: Firestore, roomId: string, userId: string) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const chatRoomRef = doc(store, `accounts/${accountId}/chatRooms`, roomId);
    const chatRoom = await getDoc(chatRoomRef);
    const chatRoomData = chatRoom.data();
    const members = chatRoomData.members.filter((member: string) => member !== userId);
    return setDoc(chatRoomRef, { members }, { merge: true });
};

const streamPrivateRoomMembers = (store: Firestore, roomId: string, onChange: (members: string[]) => void) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const chatRoomRef = doc(store, `accounts/${accountId}/chatRooms`, roomId);
    return onSnapshot(chatRoomRef, (chatRoom) => {
        const chatRoomData = chatRoom.data();
        onChange(chatRoomData.members);
    });
};

const updateLastSeen = async (db: Database, roomId: string, userId: string) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const lastSeenRef = ref(db, `accounts/${accountId}/lastSeen/${roomId}/${userId}`);
    return set(lastSeenRef, Date.now());
};

const streamLastSeenByUser = (db: Database, roomId: string, onChange: (lastSeenByUser: Map<string, number>) => void) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const lastSeenRef = ref(db, `accounts/${accountId}/lastSeen/${roomId}`);
    return onValue(lastSeenRef, (snapshot) => {
        const lastSeenByUser = new Map<string, number>();
        snapshot.val() && Object.entries(snapshot.val()).forEach(([userId, lastSeen]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            lastSeenByUser.set(userId, <any>lastSeen);
        });

        onChange(lastSeenByUser);
    });
};

const streamLastSeen = (db: Database, roomId: string, userId: string, onChange: (lastSeen: number) => void) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const lastSeenRef = ref(db, `accounts/${accountId}/lastSeen/${roomId}/${userId}`);
    return onValue(lastSeenRef, (snapshot) => {
        onChange(snapshot.val());
    });
};

const getLastSeen = async (db: Database, roomId: string, userId: string) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const lastSeenRef = ref(db, `accounts/${accountId}/lastSeen/${roomId}/${userId}`);
    const lastSeenData = await get(lastSeenRef);
    const lastSeen: number = lastSeenData.val();
    return lastSeen;
};

const setLastTyping = async (db: Database, roomId: string, userId: string) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const lastTypingRef = ref(db, `accounts/${accountId}/lastTyping/${roomId}/${userId}`);
    return set(lastTypingRef, Date.now());
};

const streamLastTypingByUser = (db: Database, roomId: string, onChange: (lastTypingByUser: Map<string, number>) => void) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const lastTypingRef = ref(db, `accounts/${accountId}/lastTyping/${roomId}`);
    return onValue(lastTypingRef, (snapshot) => {
        const lastTypingByUser = new Map<string, number>();
        snapshot.val() && Object.entries(snapshot.val()).forEach(([userId, lastTyping]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            lastTypingByUser.set(userId, <any>lastTyping);
        });

        onChange(lastTypingByUser);
    });
};

const addRoomLink = async (db: Database, roomId: string, url: string, title: string, userId: string) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const roomLinksRef = ref(db, `accounts/${accountId}/roomLinks/${roomId}`);
    const linkRef = push(roomLinksRef);
    const id = crypto.randomUUID();
    return set(linkRef, { id, url, title, userId });
};

const streamRoomLinks = (db: Database, roomId: string, onChange: (links: ChatLink[]) => void) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const roomLinksRef = ref(db, `accounts/${accountId}/roomLinks/${roomId}`);
    return onValue(roomLinksRef, (snapshot) => {
        const linksData = snapshot.val();
        const links = linksData ? Object.values<ChatLink>(linksData) : [];
        onChange(links);
    });
};

const pauseNotifications = async (db: Database, roomId: string, userId: string, until: number | null) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const pausedNotificationsRef = ref(db, `accounts/${accountId}/pausedNotifications/${userId}/${roomId}`);
    return set(pausedNotificationsRef, until);
};

const resumeNotifications = async (db: Database, roomId: string, userId: string) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const pausedNotificationsRef = ref(db, `accounts/${accountId}/pausedNotifications/${userId}/${roomId}`);
    return remove(pausedNotificationsRef);
};

const streamPausedNotificationsByRoom = (db: Database, userId: string, onChange: (pausedNotificationsByRoom: Map<string, number | null>) => void) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const pausedNotificationsRef = ref(db, `accounts/${accountId}/pausedNotifications/${userId}`);
    return onValue(pausedNotificationsRef, (snapshot) => {
        const pausedNotificationsByRoom = new Map<string, number | null>();
        snapshot.val() && Object.entries(snapshot.val()).forEach(([roomId, until]: [string, number | null]) => {
            pausedNotificationsByRoom.set(roomId, until);
        });

        onChange(pausedNotificationsByRoom);
    });
};

export const FirebaseChatRoom = {
    getChatRooms,
    getChatRoom,
    addChatRoom,
    updateRoomName,
    streamChatRooms,
    ensureDefaultPublicRoom,
    getPublicRoomMembers,
    addPublicRoomMember,
    addPrivateRoomMember,
    removePrivateRoomMember,
    streamPrivateRoomMembers,
    updateLastSeen,
    streamLastSeenByUser,
    streamLastSeen,
    getLastSeen,
    setTyping: setLastTyping,
    streamLastTypingByUser,
    addRoomLink,
    streamRoomLinks,
    pauseNotifications,
    resumeNotifications,
    streamPausedNotificationsByRoom
};