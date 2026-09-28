import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../../ChatContext";
import { ChatLink } from "../../../domain/ChatLink";
import { Chat } from "@chat";
import { Icon, Tooltip } from "monday-ui-react-core";
import { Link } from "monday-ui-react-core/icons";
import { getPosition } from "../../mondayUtils";

export function ChatRoomLinks() {

    const { selectedRoom } = useContext(ChatContext);
    const [links, setLinks] = useState<ChatLink[]>([]);

    useEffect(() => {
        if (!selectedRoom) {
            setLinks([]);
            return;
        }
        Chat.streamRoomLinks(selectedRoom.id, (links: ChatLink[]) => {
            setLinks(links);
        });
    }, [selectedRoom]);

    return (
        <div>
            {links.map((link) => (
                <div key={link.id} className="flex items-center gap-3 cursor-pointer border-b ui-border px-4 py-2">
                    <Icon className="flex-shrink-0" icon={Link} />
                    <Tooltip immediateShowDelay={50} position={getPosition("left")} content={link.url}>
                        <a href={link.url} target="_blank" rel="noreferrer" className="underline link text-ellipsis overflow-hidden max-w-full">{link.title}</a>
                    </Tooltip>
                </div>
            ))}
        </div>
    );

}