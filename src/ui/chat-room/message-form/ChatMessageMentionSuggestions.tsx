import { useContext, useEffect, useRef, useState } from "react";
import { ChatUserSuggestion } from "../../../domain/ChatUserSuggestion";
import { ChatUserSuggestionsDropdown } from "../../user/suggestions/ChatUserSuggestionsDropdown";
import { ChatContext } from "../../ChatContext";
import { useKeyDown } from "../../utils/useKeyDown";

type ChatMessageMentionSuggestionsProps = {
    query: string;
    leftPosition: number;
    suggestionStart: number | null;
    onSelect: (uid: string, suggestionStart: number) => void;
    onCancel: (query: string) => void;
};

export function ChatMessageMentionSuggestions({ query, leftPosition, suggestionStart, onSelect, onCancel }: ChatMessageMentionSuggestionsProps) {

    const { selectedRoom, userById } = useContext(ChatContext);
    const ref = useRef(null);

    const [suggestions, setSuggestions] = useState<ChatUserSuggestion[]>([]);

    useKeyDown('Escape', () => onCancel(query));

    const onUserSelected = (uid: string) => {
        setSuggestions([]);
        onSelect(uid, suggestionStart);
    };

    const memberToSuggestion = (member: string) => {
        const user = userById.get(member);
        return new ChatUserSuggestion(member, user?.name, user?.avatarUrl);
    };

    useEffect(() => {
        if (!query) {
            setSuggestions([]);
            return;
        }
        const filterQuery = query.slice(1);

        const suggestions: ChatUserSuggestion[] = selectedRoom?.members
            .filter(member => {
                const user = userById.get(member);
                return !filterQuery || user.name.toLowerCase().includes(filterQuery.toLowerCase()) || user.email.toLowerCase().includes(filterQuery.toLowerCase());
            })
            .map(memberToSuggestion);

        if (suggestions.length === 0) {
            setSuggestions(selectedRoom?.members.map(memberToSuggestion));
            return;
        }

        setSuggestions(suggestions);
    }, [query, selectedRoom, userById]);

    if (!query || !suggestions.length) {
        return null;
    }

    return (
        <div ref={ref} className="absolute bottom-19" style={{ left: `${leftPosition}px` }}>
            <ChatUserSuggestionsDropdown suggestions={suggestions} onSelected={onUserSelected} />
        </div>

    );

}