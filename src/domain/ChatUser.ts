import { ChatUserId } from './ChatUserId';

export class ChatUser {

    constructor(
        public readonly uid: ChatUserId,
        public readonly name: string,
        public readonly email: string,
        public readonly avatarUrl: string
    ) {
    }

}