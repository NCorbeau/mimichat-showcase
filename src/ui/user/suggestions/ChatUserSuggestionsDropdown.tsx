import { Avatar } from "monday-ui-react-core";
import { ChatUserSuggestion } from "../../../domain/ChatUserSuggestion";
import "./ChatUserSuggestionsDropdown.scss";
import { getSize, getType } from "../../mondayUtils";
import { isSelectedByArrowKeys, useArrowKeysSelect } from "../../utils/useArrowKeysSelect";

type ChatUserSuggestionsDropdownProps = {
    suggestions: ChatUserSuggestion[];
    onSelected: (uid: string) => void;
};

export function ChatUserSuggestionsDropdown({ suggestions, onSelected }: ChatUserSuggestionsDropdownProps) {

    const selectedUserIndex = useArrowKeysSelect(index => suggestions[index] && onSelected(suggestions[index].uid));

    if (suggestions.length === 0) {
        return null;
    }

    const selectItem = (uid: string) => () => {
        onSelected(uid);
    };

    const isUserSelected = (index: number) => {
        return isSelectedByArrowKeys(index, selectedUserIndex, suggestions.length);
    };

    return (
        <div className="chat-user-suggestions-dropdown p-2 bg-primary">
            {suggestions.map((suggestion, index) => (
                <div key={suggestion.uid}
                    onClick={selectItem(suggestion.uid)}
                    className={`chat-user-suggestions-dropdown__item w-72 h-10 flex flex-row items-center gap-2 p-1 cursor-pointer ${isUserSelected(index) && 'primary-selected-bg'}`}>
                    <Avatar
                        className="avatar"
                        ariaLabel={suggestion.name}
                        src={suggestion.avatarUrl}
                        size={getSize("small")}
                        type={getType()}
                    />
                    <div className="h-100 flex items-center">
                        <span className="text-sm">{suggestion.name}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}