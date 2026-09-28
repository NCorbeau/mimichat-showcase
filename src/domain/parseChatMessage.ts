import { EmojiRegex } from "../app/regex/emoji";
import { MentionRegex } from "../app/regex/mention";
import { UrlRegex } from "../app/regex/url";
import { MessagePart } from "../ui/chat-room/message-list/line/MessagePart";

type MessagePartRetriever = (text: string, nextRetrievers: MessagePartRetriever[]) => MessagePart[];

const retrieveTextPart = (text: string): MessagePart[] => {
    return [{ text, type: 'text' }];
};

const retrieveEmojiParts = (rawText: string, nextRetrievers: MessagePartRetriever[]): MessagePart[] => {
    const retriever = nextRetrievers.shift();

    const text = rawText
        .replace(/:D|:d|;d|;D/g, '😀')
        .replace(/:P|:p|;P|;p/g, '😛')
        .replace(/:O|:o/g, '😲')
        .replace(/:\(|;\(/g, '😞')
        .replace(/:\||;\|/g, '😐')
        .replace(/:\/|:\\/g, '😕')
        .replace(/:\)|;\)/g, '🙂');

    const parts: MessagePart[] = [];
    const matches = text.match(EmojiRegex);
    if (matches) {
        let lastIndex = 0;
        for (const match of matches) {
            const index = text.indexOf(match, lastIndex);
            if (index > lastIndex) {
                parts.push({ text: text.substring(lastIndex, index), type: 'text' });
            }
            parts.push({ text: match, type: 'emoji' });
            lastIndex = index + match?.length;
        }
        if (lastIndex < text.length) {
            parts.push(...retriever(text.substring(lastIndex), nextRetrievers));
        }
    } else {
        parts.push(...retriever(text, nextRetrievers));
    }
    return parts;
};

const retrieveUrlParts = (text: string, nextRetrievers: MessagePartRetriever[]): MessagePart[] => {
    const retriever = nextRetrievers.shift();

    const parts: MessagePart[] = [];
    const matches = text.match(UrlRegex);
    if (matches) {
        let lastIndex = 0;
        for (const match of matches) {
            const index = text.indexOf(match, lastIndex);
            if (index > lastIndex) {
                parts.push({ text: text.substring(lastIndex, index), type: 'text' });
            }
            parts.push({ text: match, type: 'url' });
            lastIndex = index + match?.length;
        }
        if (lastIndex < text.length) {
            parts.push(...retriever(text.substring(lastIndex), nextRetrievers));
        }
    } else {
        parts.push(...retriever(text, nextRetrievers));
    }
    return parts;
}

const retrieveMentionParts = (text: string, nextRetrievers: MessagePartRetriever[]): MessagePart[] => {
    const retriever = nextRetrievers.shift();

    const parts: MessagePart[] = [];
    const matches = text.match(MentionRegex);
    if (matches) {
        let lastIndex = 0;
        for (const match of matches) {
            const index = text.indexOf(match, lastIndex);
            if (index > lastIndex) {
                parts.push({ text: text.substring(lastIndex, index), type: 'text' });
            }
            parts.push({ text: match.slice(1, -1), type: 'mention' });
            lastIndex = index + match?.length;
        }
        if (lastIndex < text.length) {
            parts.push(...retriever(text.substring(lastIndex), nextRetrievers));
        }
    } else {
        parts.push(...retriever(text, nextRetrievers));
    }
    return parts;
};


export const parseChatMessage = (text: string): MessagePart[] => {
    const retrievers = [
        retrieveMentionParts,
        retrieveUrlParts,
        retrieveEmojiParts,
        retrieveTextPart
    ];

    const retriever = retrievers.shift();
    return retriever(text, retrievers);
};