import { Database, onValue, ref, set } from "firebase/database";
import { ChatUser } from "../../../domain";
import { DocumentData, Firestore, collection, doc, documentId, getDoc, getDocs, query, where } from "firebase/firestore";
import { ChatUserStatus } from "../../../domain/ChatStatus";
import { AccountIdProvider } from "../../../app/AccountIdProvider";

const userDataToChatUser = (userData: DocumentData, docIdFallback: string) => {
    const uid = (typeof userData.uid === 'string' && userData.uid.length > 0 ? userData.uid : null) ?? docIdFallback;
    return new ChatUser(uid, userData.name, userData.email, userData.photoOriginal);
};

const getUser = async (store: Firestore, userId: string) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const userRef = doc(store, `accounts/${accountId}/users/${userId}`);
    const user = await getDoc(userRef);
    if (!user.exists()) {
        throw new Error(
            `MimiChat: no Firestore user profile at accounts/${accountId}/users/${userId} (auth OK; provisioning or rules may be missing).`,
        );
    }
    const userData = user.data();
    const chatUser = userDataToChatUser(userData, userId);
    return chatUser;
};

const FIRESTORE_IN_MAX = 10;

const getUsers = async (store: Firestore, userIds: string[]) => {
    const uniqueIds = [...new Set(userIds)].filter(Boolean);
    if (uniqueIds.length === 0) {
        return [];
    }
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const usersRef = collection(store, `accounts/${accountId}/users`);
    const chunks: string[][] = [];
    for (let i = 0; i < uniqueIds.length; i += FIRESTORE_IN_MAX) {
        chunks.push(uniqueIds.slice(i, i + FIRESTORE_IN_MAX));
    }
    const snapshots = await Promise.all(
        chunks.map((chunk) => getDocs(query(usersRef, where(documentId(), 'in', chunk))))
    );
    return snapshots.flatMap((users) =>
        users.docs.map((user) => userDataToChatUser(user.data(), user.id))
    );
};

const updateUserStatus = (db: Database, userId: string, status: ChatUserStatus) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const statusRef = ref(db, `accounts/${accountId}/userStatus/${userId}`);
    return set(statusRef, status);
};

const streamStatusByUser = (db: Database, userIds: string[], onChange: (statusByUser: Map<string, ChatUserStatus>) => void) => {
    const accountId = AccountIdProvider.getInstance().getAccountId();
    const statusRef = ref(db, `accounts/${accountId}/userStatus`);
    return onValue(statusRef, (snapshot) => {
        const statusByUser = new Map<string, ChatUserStatus>();
        snapshot.forEach((statusSnapshot) => {
            if (userIds.includes(statusSnapshot.key)) {
                const status: ChatUserStatus = statusSnapshot.val();
                statusByUser.set(statusSnapshot.key, status);
            }
        });
        userIds.filter((userId) => !statusByUser.has(userId)).forEach((userId) => statusByUser.set(userId, ChatUserStatus.OFFLINE));
        onChange(statusByUser);
    });
}

export const FirebaseUser = {
    getUser,
    getUsers,
    updateUserStatus,
    streamStatusByUser
};