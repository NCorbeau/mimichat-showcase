import { useContext } from "react";
import { ChatContext } from "../../ChatContext";
import { Search } from "monday-ui-react-core";
import { ChatSearchMode } from "../../search/ChatSearch";

export function ChatSidebarSearch() {

    const { onSearchOpen } = useContext(ChatContext);

    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSearchOpen(ChatSearchMode.All);
    };

    return (
        <div onClick={(e) => onClick(e)} className="p-3">
            <Search placeholder="Search" className="w-full" />
        </div>
    );

}