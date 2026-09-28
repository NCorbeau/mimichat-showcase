import { useContext, useEffect, useRef, useState } from "react";
import { ChatUserSuggestion } from "../../../domain/ChatUserSuggestion";
import { Chat } from "../../../app/chat";
import { ChatUserSuggestionsDropdown } from "../../user/suggestions/ChatUserSuggestionsDropdown";
import { ChatContext } from "../../ChatContext";

export function ChatRoomCreateForm() {

    const { onChatMemberSelected, currentUser } = useContext(ChatContext);
    const inputRef = useRef<HTMLInputElement>(null);
    const [suggestions, setSuggestions] = useState<ChatUserSuggestion[]>([]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const onInput = async () => {
        const query = inputRef.current?.value ?? '';
        const suggestions = await Chat.getChatMemberSuggestions('', query);
        setSuggestions(suggestions.filter(suggestion => suggestion.uid !== currentUser.uid));
    };

    const onMemberSelected = (memberUid: string) => {
        setSuggestions([]);
        onChatMemberSelected(memberUid);
    };

    return (
        <div className="flex flex-row gap-6 items-center">
            <span className="text-lg">To:</span>
            <div className="flex-grow">
                <input ref={inputRef} onInput={onInput} className="w-1/2 focus:outline-none bg-primary" type="text" />
                <div className="absolute z-20">
                    <ChatUserSuggestionsDropdown suggestions={suggestions} onSelected={onMemberSelected} />
                </div>
            </div>
        </div>
    );
}