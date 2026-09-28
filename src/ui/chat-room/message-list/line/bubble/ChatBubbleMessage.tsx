import { MessagePart } from "../MessagePart";

interface ChatBubbleMessageProps {
    messageParts: MessagePart[];
    own: boolean;
    emojiOnly: boolean;
}

export function ChatBubbleMessage({ messageParts, own, emojiOnly }: ChatBubbleMessageProps) {

    const getLink = (text: string) => {
        if (text.startsWith('http://') || text.startsWith('https://')) {
            return text;
        } else {
            return `https://${text}`;
        }
    };

    const getTextMargin = (index: number, total: number) => {
        return index !== total - 1 ? `mr-1` : '';
    };

    return (
        messageParts?.length > 0 &&
        <div className="select-text flex flex-wrap items-center p-3 text-pretty [overflow-wrap:anywhere]">
            {
                messageParts?.map((part, index) => {
                    const textMargin = getTextMargin(index, messageParts.length);
                    if (part.type === 'url') {
                        return <a key={index} href={getLink(part.text)} target="_blank" rel="noreferrer" className={`text-pretty underline mr-1 ${!own ? 'link' : ''}`}>{part.text}</a>;
                    } else if (part.type === 'emoji') {
                        return <span key={index} className={`${textMargin} ${emojiOnly ? 'text-3xl' : 'text-lg'}`}>{part.text}</span>;
                    } else if (part.type === 'mention') {
                        return <span key={index} className={`${textMargin} font-medium ${!own && 'link'}`}>{part.text}</span>;
                    } else {
                        return <span key={index} className={textMargin}>{part.text}</span>;
                    }
                })
            }
        </div>
    );

}