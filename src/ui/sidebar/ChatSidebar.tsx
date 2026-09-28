import './ChatSidebar.scss';
import { ChatSidebarHeader } from './header/ChatSidebarHeader';
import { ChatRooms } from './rooms/ChatRooms';
import { ChatSidebarSearch } from './search/ChatSidebarSearch';
import { ResizeStick } from './ResizeStick';
import { useLocalStorageState } from '../utils/useLocalStorageState';
import { ChatStatus } from './status/ChatStatus';


export function ChatSidebar() {

    const MIN_WIDTH = 240;

    const [sidebarWidth, setSidebarWidth] = useLocalStorageState<number>('mimichat-sidebar-width', MIN_WIDTH);

    return (
        <div style={{ width: sidebarWidth }} className="h-screen flex-shrink-0 flex min-w-60 max-w-xl">
            <div className="chat-sidebar__container flex flex-col">
                <ChatSidebarHeader />
                {import.meta.env.VITE_MOCK_UI !== 'true' && <ChatSidebarSearch />}
                <ChatRooms />
                {import.meta.env.VITE_MOCK_UI !== 'true' && <ChatStatus />}
            </div>
            <ResizeStick direction="right" width={sidebarWidth} minWidth={MIN_WIDTH} onResize={width => setSidebarWidth(width)} />
        </div>
    );

}
