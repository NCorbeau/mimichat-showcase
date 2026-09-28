import "./ChatMessageSideButtons.scss";
import { Dialog, DialogContentContainer, Icon, Tooltip } from "monday-ui-react-core";
import Emoji from "monday-ui-react-core/dist/icons/Emoji.js";
import Replay from "monday-ui-react-core/dist/icons/Replay.js";
import { useContext, useState } from "react";
import { CHAT_MESSAGE_OVERLAY_Z_INDEX, getPosition } from "../../../../mondayUtils";
import { ChatMessageReactions } from "./reactions/ChatMessageReactions";
import { ChatMessageLineContext } from "../ChatMessageLineContext";
import { ChatRoomContext } from "../../../ChatRoomContext";

export function ChatMessageSideButtons() {

    const { onMessageReply } = useContext(ChatRoomContext);
    const { message } = useContext(ChatMessageLineContext);

    const [reactingToMessage, setReactingToMessage] = useState<boolean>(false);

    const onMessageReact = () => {
        setReactingToMessage((prev) => !prev);
    };

    return (
        <div className="flex gap-1 items-center relative">
            {import.meta.env.VITE_MOCK_UI !== 'true' && <Dialog
                position={getPosition("top")}
                open={reactingToMessage}
                onClickOutside={() => setReactingToMessage(false)}
                showTrigger={[]}
                zIndex={CHAT_MESSAGE_OVERLAY_Z_INDEX}
                containerSelector="body"
                content={
                    <DialogContentContainer>
                        <ChatMessageReactions onClose={() => setReactingToMessage(false)} />
                    </DialogContentContainer>}>
                <Tooltip
                    content="React"
                    position={getPosition("bottom")}
                    zIndex={CHAT_MESSAGE_OVERLAY_Z_INDEX}
                    containerSelector="body"
                >
                    <div onClick={() => onMessageReact()} className={`chat-message__side-button items-center justify-center w-8 h-8 cursor-pointer rounded-full ${!reactingToMessage ? "hidden" : "flex"} group-hover:flex`}>
                        <Icon className="icon" icon={Emoji} iconSize={20} />
                    </div>
                </Tooltip>
            </Dialog>}
            <Tooltip
                content="Reply"
                position={getPosition("bottom")}
                zIndex={CHAT_MESSAGE_OVERLAY_Z_INDEX}
                containerSelector="body"
            >
                <div onClick={() => onMessageReply(message)} className={`chat-message__side-button items-center justify-center w-8 h-8 cursor-pointer rounded-full ${!reactingToMessage ? "hidden" : "flex"} group-hover:flex`}>
                    <Icon className="icon" icon={Replay} iconSize={20} />
                </div>
            </Tooltip>
        </div>
    );

}
