import { MessagePart } from "../ui/chat-room/message-list/line/MessagePart";
import { parseChatMessage } from "./parseChatMessage";

export class ChatMessage {

    public index: number = 0;

    private messageParts: MessagePart[] | null = null;

    constructor(
        public readonly id: string,
        public readonly text: string,
        public readonly createdAt: number,
        public readonly userId: string,
        public readonly roomId: string,
        public readonly replyToId?: string
    ) {
    }

    getMessageParts(): MessagePart[] {
        if (this.messageParts === null) {
            this.messageParts = parseChatMessage(this.text);
        }

        return this.messageParts;
    }

    isEmojiOnly(): boolean {
        return this.getMessageParts().map(part => part.type).every(type => type === 'emoji');
    }

    withIndex(index: number): ChatMessage {
        this.index = index;
        return this;
    }

}