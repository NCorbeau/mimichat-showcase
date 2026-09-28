import { useContext, useEffect, useRef, useState } from "react";
import { Chat } from "../../../app/chat";
import { ChatContext } from "../../ChatContext";
import { ChatUserSuggestionsDropdown } from "../../user/suggestions/ChatUserSuggestionsDropdown";
import { ChatUserSuggestion } from "../../../domain/ChatUserSuggestion";
import { Chips } from "monday-ui-react-core";
import { ChatRoomContext } from "../ChatRoomContext";

export function ChatRoomAddMemberForm() {

    const { selectedRoom, userById, currentUser, onChatUsersRequested } = useContext(ChatContext);
    const { onHeaderStateChange } = useContext(ChatRoomContext);

    const [currentMemberIds, setCurrentMemberIds] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const [suggestions, setSuggestions] = useState<ChatUserSuggestion[]>([]);
    const [newMemberIds, setNewMemberIds] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        focusInput();
    }, []);

    useEffect(() => {
        let unsubscribe;
        if (selectedRoom?.isPrivate) {
            unsubscribe = Chat.streamPrivateRoomMembers(selectedRoom.id, (memberIds: string[]) => {
                setCurrentMemberIds(memberIds.filter(memberId => currentUser.uid !== memberId));
            });
        }
        return () => unsubscribe?.();
    }, []);

    const focusInput = () => {
        inputRef.current?.focus();
    };

    const onInput = async () => {
        const query = inputRef.current?.value ?? '';
        const suggestions = await Chat.getChatMemberSuggestions('', query);
        setSuggestions(suggestions.filter(suggestion => ![...currentMemberIds, ...newMemberIds].includes(suggestion.uid) && suggestion.uid !== currentUser.uid));
    };

    const onMemberSelected = (memberUid: string) => {
        if (!memberUid) {
            return;
        }

        setNewMemberIds([...newMemberIds, memberUid]);
        setSuggestions([]);
        setInputValue('');
        onChatUsersRequested([memberUid]);
        focusInput();
    };

    const getMemberName = (memberId: string) => {
        return userById.get(memberId)?.name;
    };

    const getMemberAvatar = (memberId: string) => {
        return userById.get(memberId)?.avatarUrl;
    };

    const onKeyDown = (key: string) => {
        if (key === 'Enter') {
            newMemberIds.forEach(memberId => Chat.addPrivateRoomMember(selectedRoom?.id, memberId));
            onHeaderStateChange('DEFAULT');
        } else if (key === 'Escape') {
            onHeaderStateChange('DEFAULT');
        }
    };

    const onMemberDelete = (memberId: string) => {
        setNewMemberIds(newMemberIds.filter(id => id !== memberId));
    };

    return (
        <div className="flex flex-grow flex-row gap-3 items-center" onKeyDown={event => onKeyDown(event.key)}>
            <span className="text-lg">Invite:</span>
            <div className="flex-grow flex flex-row">
                <div className="flex flex-row flex-wrap max-w-[70%]">
                    {newMemberIds.map(memberId =>
                        <Chips className="my-1" key={memberId} label={getMemberName(memberId)} leftAvatar={getMemberAvatar(memberId)} onDelete={() => onMemberDelete(memberId)} />
                    )}
                </div>
                <div className="relative flex flex-grow items-center">
                    <input ref={inputRef} onInput={onInput} className="w-full focus:outline-none" type="text" value={inputValue} onChange={(event => setInputValue(event.target.value))} />
                    <div className="absolute top-8 z-20">
                        <ChatUserSuggestionsDropdown suggestions={suggestions} onSelected={onMemberSelected} />
                    </div>
                </div>
            </div>
        </div>
    );
}