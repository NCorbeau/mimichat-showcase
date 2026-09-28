import { enqueueSnackbar } from "notistack";
import { ChatMessage, ChatRoom, ChatUser } from "../../domain";

type ChatUserMentionProps = {
    chatMessage: ChatMessage;
    userById: Map<string, ChatUser>;
    roomById: Map<string, ChatRoom>;
    onSelectRoom: (room: ChatRoom) => void;
    onChatUsersRequested: (userIds: string[]) => void;
};

export const ChatNotifier = {
    notifyMention: (props: ChatUserMentionProps) => {
        enqueueSnackbar(
            `You were mentioned in a message`,
            { variant: 'userMention', persist: true, anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, chatMessage: props.chatMessage, userById: props.userById, roomById: props.roomById, onSelectRoom: props.onSelectRoom, onChatUsersRequested: props.onChatUsersRequested },
        );
    },
};

declare module 'notistack' {
    interface VariantOverrides {
        userMention: ChatUserMentionProps;
    }
}
