import { useSearchParams } from 'react-router-dom';
import './ChatRoot.scss';
import { ChatRoomContainer } from '../../chat-room/ChatRoomContainer';
import { ChatSidebar } from '../../sidebar/ChatSidebar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Chat } from '../../../app/chat';
import { ChatMessage, ChatRoom, ChatUser } from '../../../domain';
import { UserCredential } from 'firebase/auth';
import { MondayWorkspace } from '../../../app/MondayWorkspace';
import { ChatMessageToast } from '../../toast/ChatMessageToast';
import { ChatSearch, ChatSearchMode } from '../../search/ChatSearch';
import { useKeyDown } from '../../utils/useKeyDown';
import { ChatContext } from '../../ChatContext';
import { ChatRoomActionContext } from '../../chat-room/ChatRoomActionContext';
import { Loader, ThemeProvider } from 'monday-ui-react-core';
import { SessionExpiredModal } from '../../auth/SessionExpiredModal';
import { ConnectToWorkspaceModal } from '../../auth/ConnectToWorkspaceModal';
import { ChatUserStatus } from '../../../domain/ChatStatus';
import { SnackbarProvider } from 'notistack';
import { ChatUserMentionNotification } from '../../notifications/ChatUserMentionNotification';
import { ChatNotifier } from '../../notifications/ChatNotifier';
import { AccountIdProvider } from '../../../app/AccountIdProvider';
import { getTheme } from '../../mondayUtils';

export function ChatRoot() {

  const [searchParams] = useSearchParams();

  const [authorized, setAuthorized] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<ChatUser>(null);
  const [mondayAccountId, setMondayAccountId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<MondayWorkspace>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [roomById, setRoomById] = useState<Map<string, ChatRoom>>(new Map());
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom>(null);
  const [userById, setUserById] = useState<Map<string, ChatUser>>(new Map());
  const [newUsersRequest, setNewUsersRequest] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState<ChatMessage>(null);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [chatSearchMode, setChatSearchMode] = useState<ChatSearchMode>(ChatSearchMode.All);
  const [chatSearchRoomId, setChatSearchRoomId] = useState<string>(null);
  const [scrollToMessageListeners, setScrollToMessageListeners] = useState<Map<string, ((messageId: string) => void)>>(new Map());
  const [lastMessageByRoom, setLastMessageByRoom] = useState<Map<string, ChatMessage>>(new Map());
  const lastMessageByRoomRef = useRef<Map<string, ChatMessage>>(new Map());
  const [statusByUser, setStatusByUser] = useState<Map<string, ChatUserStatus>>(new Map());
  const [pausedNotificationsByRoom, setPausedNotificationsByRoom] = useState<Map<string, number | null>>(new Map());
  const [headerState, setHeaderState] = useState<'default' | 'new-room'>('default');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark' | 'black'>('light');
  const [showSessionExpired, setShowSessionExpired] = useState<boolean>(false);
  const [showMondayContextTimeout, setShowMondayContextTimeout] = useState<boolean>(false);
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const modalAnchorRef = useRef<HTMLDivElement>(null);
  const pendingMondayAuthRef = useRef<{ token: string; credential: UserCredential } | null>(null);
  const workspaceRef = useRef<MondayWorkspace | null>(null);
  workspaceRef.current = workspace;

  useKeyDown('k', () => {
    if (import.meta.env.VITE_MOCK_UI !== 'true') setSearchOpen(true);
  }, true);

  const isMockUi = import.meta.env.VITE_MOCK_UI === 'true';

  useEffect(() => {
    if (!authorized) {
      let storedToken = searchParams?.get('access_token') ?? localStorage.getItem('access_token');
      if (isMockUi && !storedToken) {
        storedToken = 'mock-token';
        localStorage.setItem('access_token', storedToken);
        setShowConnectModal(false);
      }
      if (!storedToken) {
        setShowConnectModal(true);
        return;
      }
      Chat.authenticate(storedToken).then(async (userCredential: UserCredential) => {
        localStorage.setItem('access_token', storedToken);
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
      }).catch(() => {
        pendingMondayAuthRef.current = null;
        localStorage.removeItem('access_token');
        setShowSessionExpired(true);
      });
    }
  }, [isMockUi]);

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
    const unsubscribeWorkspace = Chat.subscribeWorkspace((nextWorkspace) => {
      setWorkspace(nextWorkspace);
    });
    return () => {
      unsubscribeAccountId();
      unsubscribeWorkspace();
    };
  }, [authorized]);

  useEffect(() => {
    if (!authorized || !mondayAccountId) {
      return;
    }
    const unsubscribeLastMessages = Chat.streamLastMessageByRoom((lastMessageByRoom) => {
      const previous = lastMessageByRoomRef.current;
      lastMessageByRoom.forEach((message, roomId) => {
        if (previous.size > 0 && previous.get(roomId)?.id !== message.id) {
          setNewMessage(message);
        }
      });
      lastMessageByRoomRef.current = lastMessageByRoom;
      setLastMessageByRoom(lastMessageByRoom);
    });
    return () => {
      unsubscribeLastMessages();
    };
  }, [authorized, mondayAccountId]);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }
    if (!authorized || !currentUser) {
      return;
    }
    if (mondayAccountId && workspace?.id) {
      return;
    }
    const tid = window.setTimeout(() => {
      // eslint-disable-next-line no-console
      console.warn('[MimiChat][dev] Stuck waiting for Monday account/workspace context', {
        mondayAccountId,
        workspaceId: workspace?.id ?? null,
        viteMockUi: import.meta.env.VITE_MOCK_UI,
      });
    }, 4000);
    return () => window.clearTimeout(tid);
  }, [authorized, currentUser, mondayAccountId, workspace?.id]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    const unsubscribe = Chat.streamPausedNotificationsByRoom(currentUser.uid, (pausedNotificationsByRoom) => {
      setPausedNotificationsByRoom(pausedNotificationsByRoom);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const unsubscribe = Chat.streamUserMentionMessageIds(currentUser.uid, (messageIds) => {
      messageIds.forEach(async (messageId) => {
        setTimeout(async () => {
          const message = await Chat.getChatMessageById(messageId);
          ChatNotifier.notifyMention({ chatMessage: message, roomById, userById, onChatUsersRequested, onSelectRoom });
          Chat.removeUserMentions(currentUser.uid);
        }, 1000);
      });
    });

    return () => unsubscribe();
  }, [currentUser, roomById, userById]);

  // Depend only on workspace id + user id — the `workspace` object reference changes often (debounced
  // Monday API name updates) and would cancel this effect before ensureDefaultPublicRoom finishes.
  useEffect(() => {
    const workspaceId = workspace?.id;
    const userId = currentUser?.uid;
    if (!workspaceId || !userId) {
      return;
    }
    let cancelled = false;
    let unsubscribeRooms: (() => void) | undefined;

    void (async () => {
      const ws = workspaceRef.current;
      if (!ws?.id || ws.id !== workspaceId) {
        return;
      }
      try {
        const rooms = await Chat.getChatRooms(ws, userId);
        if (cancelled) {
          return;
        }
        updateRooms(rooms);
        onChatUsersRequested(rooms.map((room) => room.members).flat());
        if (rooms.length > 0) {
          setSelectedRoom(rooms[0]);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('MimiChat: failed to load chat rooms', e);
        return;
      }
      if (cancelled) {
        return;
      }
      unsubscribeRooms = await Chat.streamChatRooms(workspaceId, userId, (changedRooms) => {
        if (cancelled) {
          return;
        }
        onChatUsersRequested(changedRooms.map((room) => room.members).flat());
        updateRooms(changedRooms);
      });
    })();

    return () => {
      cancelled = true;
      unsubscribeRooms?.();
    };
  }, [workspace?.id, currentUser?.uid]);

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
      const newUsersById = new Map<string, ChatUser>(newUsers.map((user) => [user.uid, user]));
      setUserById((prev) => new Map([...(prev ?? []), ...newUsersById]));
    });
  }, [newUsersRequest]);

  useEffect(() => {
    if (!rooms.some(room => room.id === selectedRoom?.id)) {
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
    const unsubscribe = Chat.streamStatusByUser(Array.from(userIds), (statusByUser) => {
      setStatusByUser(statusByUser);
    });
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
      localStorage.removeItem('access_token');
      setShowSessionExpired(true);
    }
  };

  if (!authorized) {
    return (
      <ThemeProvider systemTheme={getTheme(systemTheme)}>
        <div className="flex justify-center items-center w-full h-screen">
          <div ref={modalAnchorRef} style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0 }} />
          {!showSessionExpired && !showConnectModal && !showMondayContextTimeout && <Loader size={Loader.sizes.LARGE} />}
          <SessionExpiredModal show={showSessionExpired} triggerElement={modalAnchorRef.current as unknown as HTMLElement} onRefresh={() => { localStorage.removeItem('access_token'); Chat.startOAuth(); }} />
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
      </ThemeProvider>
    );
  }

  if (!currentUser?.uid || !mondayAccountId || !workspace?.id) {
    return (
      <ThemeProvider systemTheme={getTheme(systemTheme)}>
        <div className="flex justify-center items-center w-full h-screen">
          <Loader size={Loader.sizes.LARGE} />
        </div>
      </ThemeProvider>
    );
  }

  const onCreateNewRoom = () => {
    setSelectedRoom(null);
    setHeaderState('new-room');
  };

  const onSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    setHeaderState('default');
  };

  const onChatMemberSelected = async (memberUid: string) => {
    const newRoom = await Chat.addChatRoom(currentUser.uid, memberUid, workspace.id);
    setSelectedRoom(newRoom);
  };

  const getSortedRooms = (chatRooms: ChatRoom[], workspaceId: string | undefined): ChatRoom[] => {
    const copy = [...chatRooms];
    if (!workspaceId) {
      return copy.sort((a, b) => (a.id.length === b.id.length ? a.id.localeCompare(b.id) : a.id.length > b.id.length ? 1 : -1));
    }
    const defaultId = ChatRoom.getDefaultPublicRoomId(workspaceId);
    const rank = (r: ChatRoom): number => {
      if (!r.isPrivate && r.id === defaultId) {
        return 0;
      }
      if (!r.isPrivate && !r.isBoardRoom()) {
        return 1;
      }
      if (!r.isPrivate) {
        return 2;
      }
      return 3;
    };
    return copy.sort((a, b) => {
      const d = rank(a) - rank(b);
      if (d !== 0) {
        return d;
      }
      return a.id.localeCompare(b.id);
    });
  };

  const onNewMessage = (roomMessage: ChatMessage) => {
    setNewMessage(roomMessage);
  };

  const onSearchOpen = (mode: ChatSearchMode, roomId?: string) => {
    setChatSearchMode(mode);
    setChatSearchRoomId(roomId);
    setSearchOpen(true);
  };

  const onScrollToMessage = (messageId: string) => {
    scrollToMessageListeners.forEach(onScroll => onScroll(messageId));
  };

  const registerScrollToMessageListener = (messageId: string, onScrollFn: (messageId: string) => void) => {
    setScrollToMessageListeners(listeners => new Map([...listeners, [messageId, onScrollFn]]));
  };

  const updateRooms = (chatRooms: ChatRoom[]) => {
    const rooms = getSortedRooms(chatRooms, workspaceRef.current?.id);
    setRooms(rooms);
    setRoomById(new Map(rooms.map(room => [room.id, room])));
  };

  return (
    <SnackbarProvider Components={{ userMention: ChatUserMentionNotification }}>
      <ChatContext.Provider value={{ currentUser, rooms, roomById, selectedRoom, userById, lastMessageByRoom, statusByUser, pausedNotificationsByRoom, headerState, theme: systemTheme, appMode: 'main', onCreateNewRoom, onSelectRoom, onChatMemberSelected, onChatUsersRequested, onNewMessage, onSearchOpen, onScrollToMessage }}>
        <ThemeProvider systemTheme={getTheme(systemTheme)}>
          <div>
            <div className="chat__container flex w-full h-screen select-none">
              <ChatSidebar />
              <ChatRoomActionContext.Provider value={{ onScrollToMessage: registerScrollToMessageListener }}>
                <ChatRoomContainer />
              </ChatRoomActionContext.Provider>
            </div>
            <ChatMessageToast message={newMessage} />
            {!isMockUi && <ChatSearch open={searchOpen} mode={chatSearchMode} roomId={chatSearchRoomId} onClose={() => setSearchOpen(false)} />}
            <div ref={modalAnchorRef} style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0 }} />
            <SessionExpiredModal show={showSessionExpired} triggerElement={modalAnchorRef.current as unknown as HTMLElement} onRefresh={() => { localStorage.removeItem('access_token'); Chat.startOAuth(); }} />
            <ConnectToWorkspaceModal show={showConnectModal} triggerElement={modalAnchorRef.current as unknown as HTMLElement} onInstall={() => Chat.startOAuth()} onCancel={() => setShowConnectModal(false)} />
          </div>
        </ThemeProvider>
      </ChatContext.Provider>
    </SnackbarProvider>
  );

}
