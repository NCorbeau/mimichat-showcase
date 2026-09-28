import { useSearchParams } from "react-router-dom";
import "./ChatBoardRoot.scss";
import { ChatRoomContainer } from "../../chat-room/ChatRoomContainer";
import { useCallback, useEffect, useRef, useState } from "react";
import { Chat } from "../../../app/chat";
import { ChatMessage, ChatRoom, ChatUser } from "../../../domain";
import { UserCredential } from "firebase/auth";
import { MondayWorkspace } from "../../../app/MondayWorkspace";
import { ChatMessageToast } from "../../toast/ChatMessageToast";
import { ChatContext } from "../../ChatContext";
import { ChatRoomActionContext } from "../../chat-room/ChatRoomActionContext";
import { Loader, ThemeProvider } from "monday-ui-react-core";
import { SessionExpiredModal } from "../../auth/SessionExpiredModal";
import { ConnectToWorkspaceModal } from "../../auth/ConnectToWorkspaceModal";
import { ChatUserStatus } from "../../../domain/ChatStatus";
import { SnackbarProvider } from "notistack";
import { ChatUserMentionNotification } from "../../notifications/ChatUserMentionNotification";
import { MondayBoard } from "../../../app/MondayBoard";
import { AccountIdProvider } from "../../../app/AccountIdProvider";
import { getTheme } from "../../mondayUtils";

export function ChatBoardRoot() {
  const [searchParams] = useSearchParams();

  const [authorized, setAuthorized] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<ChatUser>(null);
  const [mondayAccountId, setMondayAccountId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<MondayWorkspace>(null);
  const [board, setBoard] = useState<MondayBoard>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [roomById, setRoomById] = useState<Map<string, ChatRoom>>(new Map());
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom>(null);
  const [userById, setUserById] = useState<Map<string, ChatUser>>(new Map());
  const [newUsersRequest, setNewUsersRequest] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState<ChatMessage>(null);
  const [scrollToMessageListeners, setScrollToMessageListeners] = useState<
    Map<string, (messageId: string) => void>
  >(new Map());
  const [statusByUser, setStatusByUser] = useState<Map<string, ChatUserStatus>>(
    new Map()
  );
  const [headerState, setHeaderState] = useState<"default" | "new-room">(
    "default"
  );
  const [systemTheme, setSystemTheme] = useState<"light" | "dark" | "black">(
    "light"
  );
  const [showSessionExpired, setShowSessionExpired] = useState<boolean>(false);
  const [showMondayContextTimeout, setShowMondayContextTimeout] = useState<boolean>(false);
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const modalAnchorRef = useRef<HTMLDivElement>(null);
  const pendingMondayAuthRef = useRef<{ token: string; credential: UserCredential } | null>(null);
  const workspaceRef = useRef<MondayWorkspace | null>(null);
  const boardRef = useRef<MondayBoard | null>(null);
  workspaceRef.current = workspace;
  boardRef.current = board;

  useEffect(() => {
    if (!authorized) {
      let storedToken =
        searchParams?.get("access_token") ?? localStorage.getItem("access_token");
      if (import.meta.env.VITE_MOCK_UI === 'true' && !storedToken) {
        storedToken = 'mock-token';
        localStorage.setItem('access_token', storedToken);
      }
      if (!storedToken) {
        setShowConnectModal(true);
        return;
      }
      Chat.authenticate(storedToken)
        .then(async (userCredential: UserCredential) => {
          localStorage.setItem("access_token", storedToken);
          pendingMondayAuthRef.current = { token: storedToken, credential: userCredential };

          const accountId = await Chat.waitForAccountId();
          if (!accountId) {
            setShowMondayContextTimeout(true);
            return;
          }
          pendingMondayAuthRef.current = null;
          AccountIdProvider.getInstance().setAccountId(accountId);
          setMondayAccountId(accountId);

          const user = await Chat.getUser(userCredential.user.uid);
          setCurrentUser(user);
          setAuthorized(true);
        })
        .catch(() => {
          pendingMondayAuthRef.current = null;
          localStorage.removeItem("access_token");
          setShowSessionExpired(true);
        });
    }
  }, []);

  useEffect(() => {
    Chat.streamThemeChanges((theme) => {
      setSystemTheme(theme);
    });
  }, []);

  useEffect(() => {
    if (!authorized) {
      return;
    }
    const unsubscribeAccountId = Chat.subscribeAccountId((nextAccountId) => {
      if (nextAccountId) {
        AccountIdProvider.getInstance().setAccountId(nextAccountId);
        setMondayAccountId(nextAccountId);
      }
    });
    const unsubscribeWorkspaceBoard = Chat.subscribeWorkspaceAndBoard(
      (nextWorkspace, nextBoard) => {
        setWorkspace(nextWorkspace);
        setBoard(nextBoard);
      }
    );
    return () => {
      unsubscribeAccountId();
      unsubscribeWorkspaceBoard();
    };
  }, [authorized]);

  // Stable ids only — workspace/board objects get new references on debounced Monday updates.
  useEffect(() => {
    const workspaceId = workspace?.id;
    const boardId = board?.id;
    const userId = currentUser?.uid;
    if (!workspaceId || !boardId || !userId) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const ws = workspaceRef.current;
      const b = boardRef.current;
      if (
        !ws?.id ||
        ws.id !== workspaceId ||
        !b?.id ||
        b.id !== boardId
      ) {
        return;
      }
      try {
        const room = await Chat.getOrCreateBoardRoom(ws.id, b, userId);
        if (!cancelled) {
          setRooms([room]);
          setRoomById(new Map([[room.id, room]]));
          setSelectedRoom(room);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("MimiChat: failed to get or create board room", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspace?.id, board?.id, currentUser?.uid]);

  const onChatUsersRequested = useCallback(async (userIds: string[]) => {
    if (!userIds || userIds.length === 0) {
      return;
    }
    const newUserIds = [...new Set(userIds.filter((userId) => !userById.has(userId)))];
    if (newUserIds.length === 0) {
      return;
    }
    setNewUsersRequest(newUserIds);
  }, [userById]);

  useEffect(() => {
    if (!selectedRoom) {
      return;
    }
    onChatUsersRequested(selectedRoom.members);
    if (currentUser?.uid) {
      Chat.updateLastSeen(selectedRoom.id, currentUser.uid);
    }
  }, [selectedRoom, onChatUsersRequested, currentUser?.uid]);

  useEffect(() => {
    if (!newUsersRequest || newUsersRequest.length === 0) {
      return;
    }
    Chat.getUsers([...newUsersRequest]).then((newUsers) => {
      const newUsersById = new Map<string, ChatUser>(
        newUsers.map((user) => [user.uid, user])
      );
      setUserById((prev) => new Map([...(prev ?? []), ...newUsersById]));
    });
  }, [newUsersRequest]);

  useEffect(() => {
    if (!rooms.some((room) => room.id === selectedRoom?.id)) {
      setSelectedRoom(rooms.length > 0 ? rooms[0] : null);
    }
  }, [rooms]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const userIds = new Set([...userById.keys()]);
    userIds.add(currentUser?.uid);
    if (!userIds || userIds.size === 0) {
      return;
    }
    const unsubscribe = Chat.streamStatusByUser(
      Array.from(userIds),
      (statusByUser) => {
        setStatusByUser(statusByUser);
      }
    );
    return () => unsubscribe();
  }, [userById]);

  const retryMondayAccountContext = async () => {
    setShowMondayContextTimeout(false);
    const pending = pendingMondayAuthRef.current;
    if (!pending) {
      window.location.reload();
      return;
    }
    const accountId = await Chat.waitForAccountId();
    if (!accountId) {
      setShowMondayContextTimeout(true);
      return;
    }
    pendingMondayAuthRef.current = null;
    AccountIdProvider.getInstance().setAccountId(accountId);
    setMondayAccountId(accountId);
    try {
      const user = await Chat.getUser(pending.credential.user.uid);
      setCurrentUser(user);
      setAuthorized(true);
    } catch {
      pendingMondayAuthRef.current = null;
      localStorage.removeItem("access_token");
      setShowSessionExpired(true);
    }
  };

  if (!authorized) {
    return (
      <div className="flex justify-center items-center w-full h-screen">
        <div ref={modalAnchorRef} style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0 }} />
        {!showSessionExpired && !showConnectModal && !showMondayContextTimeout && (
          <Loader size={Loader.sizes.LARGE} />
        )}
        <SessionExpiredModal show={showSessionExpired} triggerElement={modalAnchorRef.current as unknown as HTMLElement} onRefresh={() => { localStorage.removeItem("access_token"); Chat.startOAuth(); }} />
        <SessionExpiredModal
          show={showMondayContextTimeout}
          title="Connecting to monday.com"
          message="Your account context is taking longer than usual. This is usually not a sign-in problem. Try again or reload the page — your Monday session is still active."
          actionLabel="Try again"
          triggerElement={modalAnchorRef.current as unknown as HTMLElement}
          onRefresh={() => { void retryMondayAccountContext(); }}
        />
        <ConnectToWorkspaceModal show={showConnectModal} triggerElement={modalAnchorRef.current as unknown as HTMLElement} onInstall={() => Chat.startOAuth()} onCancel={() => setShowConnectModal(false)} />
      </div>
    );
  }

  if (currentUser && (!mondayAccountId || !workspace?.id || !board?.id)) {
    return (
      <div className="flex justify-center items-center w-full h-screen">
        <Loader size={Loader.sizes.LARGE} />
      </div>
    );
  }

  const onCreateNewRoom = () => {
    setSelectedRoom(null);
    setHeaderState("new-room");
  };

  const onSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    setHeaderState("default");
  };

  const onChatMemberSelected = async (memberUid: string) => {
    const newRoom = await Chat.addChatRoom(
      currentUser.uid,
      memberUid,
      workspace.id
    );
    setSelectedRoom(newRoom);
  };

  const onNewMessage = (roomMessage: ChatMessage) => {
    setNewMessage(roomMessage);
  };

  const onScrollToMessage = (messageId: string) => {
    scrollToMessageListeners.forEach((onScroll) => onScroll(messageId));
  };

  const registerScrollToMessageListener = (
    messageId: string,
    onScrollFn: (messageId: string) => void
  ) => {
    setScrollToMessageListeners(
      (listeners) => new Map([...listeners, [messageId, onScrollFn]])
    );
  };

  return (
    <SnackbarProvider Components={{ userMention: ChatUserMentionNotification }}>
      <ChatContext.Provider
        value={{
          currentUser,
          rooms,
          roomById,
          selectedRoom,
          userById,
          lastMessageByRoom: null,
          statusByUser,
          pausedNotificationsByRoom: null,
          headerState,
          theme: systemTheme,
          appMode: "board",
          onCreateNewRoom,
          onSelectRoom,
          onChatMemberSelected,
          onChatUsersRequested,
          onNewMessage,
          onSearchOpen: null,
          onScrollToMessage,
        }}
      >
        <ThemeProvider systemTheme={getTheme(systemTheme)}>
          <div>
            <div className="chat__container chat__container--board flex h-screen select-none">
              <ChatRoomActionContext.Provider
                value={{ onScrollToMessage: registerScrollToMessageListener }}
              >
                <ChatRoomContainer />
              </ChatRoomActionContext.Provider>
            </div>
            <ChatMessageToast message={newMessage} />
          </div>
        </ThemeProvider>
      </ChatContext.Provider>
    </SnackbarProvider>
  );
}
