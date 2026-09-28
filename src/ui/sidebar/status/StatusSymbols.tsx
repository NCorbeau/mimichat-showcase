import { ChatUserStatus, ChatUserStatusColor } from "../../../domain/ChatStatus";

const className = 'w-4 h-4 rounded-full flex-shrink-0';

export const OnlineStatusSymbol = () => {
    return (
        <div style={{ background: ChatUserStatusColor[ChatUserStatus.ONLINE] }} className={className}></div>
    );
};

export const OfflineStatusSymbol = () => {
    return (
        <div style={{ background: ChatUserStatusColor[ChatUserStatus.OFFLINE] }} className={className}></div>
    );
}

export const DoNotInterruptStatusSymbol = () => {
    return (
        <div style={{ background: ChatUserStatusColor[ChatUserStatus.DO_NOT_INTERRUPT] }} className={className}></div>
    );
}

export const VacationStatusSymbol = () => {
    return (
        <div style={{ background: ChatUserStatusColor[ChatUserStatus.VACATION] }} className={className}></div>
    );
}

export const SymbolByStatus = {
    [ChatUserStatus.ONLINE]: OnlineStatusSymbol,
    [ChatUserStatus.OFFLINE]: OfflineStatusSymbol,
    [ChatUserStatus.DO_NOT_INTERRUPT]: DoNotInterruptStatusSymbol,
    [ChatUserStatus.VACATION]: VacationStatusSymbol
};