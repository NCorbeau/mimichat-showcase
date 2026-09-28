import { Button } from 'monday-ui-react-core';
import Add from 'monday-ui-react-core/dist/icons/Add.js';
import { useContext } from 'react';
import { ChatContext } from '../../ChatContext';
import { getSize } from '../../mondayUtils';

export function ChatSidebarHeader() {

    const { onCreateNewRoom } = useContext(ChatContext);

    return (
        <div className="h-14 flex flex-row items-center px-4 justify-between">
            <span className="font-medium text-lg">Chats</span>
            {import.meta.env.VITE_MOCK_UI === 'true'
                ? <span className="text-sm secondary" title="Fictional, in-memory demo">Demo mode</span>
                : <Button onClick={onCreateNewRoom} leftIcon={Add} size={getSize("small")}>New chat</Button>}
        </div>
    );

}
