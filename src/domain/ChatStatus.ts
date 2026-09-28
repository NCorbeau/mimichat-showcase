export enum ChatUserStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    DO_NOT_INTERRUPT = 'DO_NOT_INTERRUPT',
    VACATION = 'VACATION'
}

export const ChatUserStatusDisplay = {
    [ChatUserStatus.ONLINE]: 'Active',
    [ChatUserStatus.OFFLINE]: 'Offline',
    [ChatUserStatus.DO_NOT_INTERRUPT]: 'Do not interrupt',
    [ChatUserStatus.VACATION]: 'Vacation'
};

export const ChatUserStatusColor = {
    [ChatUserStatus.ONLINE]: '#258750',
    [ChatUserStatus.OFFLINE]: '#C4C4C4',
    [ChatUserStatus.DO_NOT_INTERRUPT]: '#D83A52',
    [ChatUserStatus.VACATION]: '#F7CB45'
};