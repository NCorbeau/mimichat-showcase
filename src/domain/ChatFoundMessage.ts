export type ChatFoundMessage = {
    id: string;
    roomId: string;
    text: string;
    userId: string;
    createdAt: number;
    highlightSnippet: string;
};