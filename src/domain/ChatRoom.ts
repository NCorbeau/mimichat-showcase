import { ChatUser } from "./ChatUser";

export class ChatRoom {

    static DEFAULT_NAME = 'Room';

    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly workspaceId: string,
        public readonly isPrivate: boolean,
        public readonly members?: string[]
    ) {
    }

    static getBoardRoomId(workspaceId: string, boardId: string): string {
        return `${workspaceId}:${boardId}`;
    }

    /** Stable Firestore id for the workspace default public room (avoids duplicate rooms on concurrent first-open). */
    static getDefaultPublicRoomId(workspaceId: string): string {
        const safe = workspaceId.replace(/\//g, '_');
        return `defaultPub_${safe}`;
    }

    isBoardRoom(): boolean {
        return this.id.includes(":") && this.id.split(":").length === 2;
    }

    getDisplayName(userById?: Map<string, ChatUser>, currentUser?: ChatUser): string {
        return this.isPrivate ? this.getPrivateRoomDisplayName(userById, currentUser) : this.name;
    }

    private getPrivateRoomDisplayName(userById?: Map<string, ChatUser>, currentUser?: ChatUser): string {
        return this.name || (this.members?.filter(memberId => memberId !== currentUser?.uid).map(memberId => userById.get(memberId)?.name).join(', ') ?? ChatRoom.DEFAULT_NAME);
    }

}