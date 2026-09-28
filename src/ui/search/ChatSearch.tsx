import { useRef } from "react";
import { useKeyDown } from "../utils/useKeyDown";
import { ChatAllSearch } from "./ChatAllSearch";
import { ChatInRoomSearch } from "./ChatInRoomSearch";

export enum ChatSearchMode {
    All = 'All',
    InRoom = 'InRoom'
}

type ChatSearchProps = {
    open: boolean;
    mode: ChatSearchMode;
    roomId?: string;
    onClose: () => void;
};

export function ChatSearch({ open, mode, roomId, onClose }: ChatSearchProps) {

    useKeyDown('Escape', onClose);

    const modalRef = useRef<HTMLDivElement>(null);

    const onClick = (e: React.MouseEvent) => {
        if (modalRef.current?.contains(e.target as Node)) {
            return;
        }

        e.stopPropagation();
        onClose();
    };

    if (!open) {
        return null;
    }

    return (
        <div onClick={(e) => onClick(e)} className="absolute top-0 left-0 h-screen w-screen bg-surface z-30">
            <div className="relative h-full w-full flex justify-center pt-24">
                <div ref={modalRef} className="h-3/4 w-2/3 max-w-2xl bg-primary rounded-lg p-6">
                    {
                        mode === ChatSearchMode.All ?
                            <ChatAllSearch onClose={onClose} />
                            :
                            <ChatInRoomSearch roomId={roomId} onClose={onClose} />
                    }
                </div>
            </div>
        </div>
    );

}