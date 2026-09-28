import { useContext, useEffect, useMemo, useState } from "react";
import { ChatContext } from "../../ChatContext";
import { ChatUserAvatar } from "../../user/ChatUserAvatar";
import { Dropdown } from "monday-ui-react-core";
import { ChatUserStatus, ChatUserStatusDisplay } from "../../../domain/ChatStatus";
import { Chat } from "../../../app/chat";
import { DoNotInterruptStatusSymbol, OfflineStatusSymbol, OnlineStatusSymbol, VacationStatusSymbol } from "./StatusSymbols";

type StatusOption = {
    value: ChatUserStatus,
    symbol: () => JSX.Element;
};

export function ChatStatus() {

    const { currentUser, statusByUser } = useContext(ChatContext);
    const [currentStatus, setCurrentStatus] = useState<ChatUserStatus>(null);

    const statusOptions = useMemo<StatusOption[]>(() => [
        {
            value: ChatUserStatus.ONLINE,
            symbol: OnlineStatusSymbol
        },
        {
            value: ChatUserStatus.OFFLINE,
            symbol: OfflineStatusSymbol
        },
        {
            value: ChatUserStatus.DO_NOT_INTERRUPT,
            symbol: DoNotInterruptStatusSymbol
        },
        {
            value: ChatUserStatus.VACATION,
            symbol: VacationStatusSymbol
        }
    ], []);

    useEffect(() => {
        if (currentUser && statusByUser) {
            setCurrentStatus(statusByUser.get(currentUser.uid));
        }
    }, [statusByUser, currentUser]);

    const getStatusDisplay = (status: ChatUserStatus) => {
        return ChatUserStatusDisplay[status];
    };

    const onStatusChange = (option: StatusOption) => {
        Chat.updateUserStatus(currentUser.uid, option.value);
    };

    const renderOption = (option: StatusOption) => {
        return (
            <div key={option.value} className="flex gap-2">
                {option.symbol()}
                <span>{getStatusDisplay(option.value)}</span>
            </div>
        );
    };

    const renderValue = (option: StatusOption) => {
        return (
            <div className="placeholder">
                {getStatusDisplay(option.value)}
            </div>
        );
    };

    const getCurrentOption = () => {
        return statusOptions.find(option => option.value === currentStatus);
    };

    return (
        <div className="pl-4 pr-6 pt-3 pb-6 gap-6 text-sm flex items-start secondary">
            <ChatUserAvatar user={currentUser} showStatus={true} />
            <Dropdown value={getCurrentOption()} onChange={onStatusChange} clearable={false} searchable={false} className="w-full chat-status-dropdown" singleValueWrapperClassName="placeholder" menuPlacement="top" options={statusOptions} optionRenderer={renderOption} valueRenderer={renderValue} />
        </div>
    );

}