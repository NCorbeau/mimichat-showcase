import { useContext } from "react";
import { ChatContext } from "../../ChatContext";
import { ChatRoomInfobar } from "./ChatRoomInfobar";
import { ChatRoomCreateForm } from "./ChatRoomCreateForm";
import { ChatRoomAddMemberForm } from "./ChatRoomAddMemberForm";
import { IconButton, Skeleton } from "monday-ui-react-core";
import { NavigationChevronLeft } from "monday-ui-react-core/icons";
import { NavigationChevronRight } from "monday-ui-react-core/icons";
import { ChatRoomContext } from "../ChatRoomContext";

export function ChatRoomHeader() {
  const {
    selectedRoom,
    headerState: chatHeaderState,
    appMode,
  } = useContext(ChatContext);
  const { headerState, sidebarOpen, onSidebarToggle } =
    useContext(ChatRoomContext);

  const getOpenSidebarIcon = () => {
    return sidebarOpen ? NavigationChevronRight : NavigationChevronLeft;
  };

  return (
    <div className="min-h-14 px-4 py-1 border-b ui-border flex items-center justify-between flex-shrink-0 ">
      {chatHeaderState === "new-room" ? (
        <ChatRoomCreateForm />
      ) : !selectedRoom ? (
        <Skeleton height={24} width={100} />
      ) : headerState === "DEFAULT" ? (
        <ChatRoomInfobar />
      ) : (
        <ChatRoomAddMemberForm />
      )}
      {appMode === "main" && import.meta.env.VITE_MOCK_UI !== 'true' && (
        <IconButton
          icon={getOpenSidebarIcon()}
          onClick={() => onSidebarToggle()}
        />
      )}
    </div>
  );
}
