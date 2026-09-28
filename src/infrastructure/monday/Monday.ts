import mondaySdk from "monday-sdk-js";
import { ChatUserSuggestion } from "../../domain/ChatUserSuggestion";
import { MondayWorkspace } from "../../app/MondayWorkspace";
import { MondayBoard } from "../../app/MondayBoard";
import { AccountIdProvider } from "../../app/AccountIdProvider";

type MondayUser = {
    id: string;
    name: string;
    photo_thumb: string;
};

export type MondayContextResult = {
    data?: {
        boardId?: string | number;
        workspaceId?: string | number;
        instanceType?: string;
        appFeature?: { type?: string; name?: string };
        theme?: string;
        account?: { id?: string | number };
        [key: string]: unknown;
    };
};

/** One debounced burst of monday.api for workspace/board names per context churn (avoids rate limits). */
const CONTEXT_API_DEBOUNCE_MS = 300;

const getWorkspaceNameQuery =
    `query ($ids: [ID!]) {
        workspaces(ids: $ids) {
        name
      }
    }`;

const getBoardNameQuery =
    `query ($ids: [ID!]) {
        boards(ids: $ids) {
        name
      }
    }`;

async function fetchWorkspaceById(id: string): Promise<MondayWorkspace> {
    const monday = mondaySdk();
    const response = await monday.api(getWorkspaceNameQuery, { variables: { ids: [id] } });
    const name = response?.data?.["workspaces"]?.[0]?.["name"] ?? "";
    return { id, name };
}

async function fetchBoardById(id: string): Promise<MondayBoard> {
    const monday = mondaySdk();
    const response = await monday.api(getBoardNameQuery, { variables: { ids: [id] } });
    const name = response?.data?.["boards"]?.[0]?.["name"] ?? "";
    return { id, name };
}

/** Account-/app-shell views often omit workspaceId in context; use any accessible board's workspace. */
const fallbackWorkspaceFromBoardQuery = `query {
    boards (limit: 1) {
        workspace_id
        workspace {
            id
            name
        }
    }
}`;

const fallbackWorkspacesListQuery = `query {
    workspaces (limit: 1) {
        id
        name
    }
}`;

async function fetchFallbackWorkspaceFromAccount(): Promise<MondayWorkspace | null> {
    const monday = mondaySdk();
    try {
        const response = await monday.api(fallbackWorkspaceFromBoardQuery);
        const b = response?.data?.["boards"]?.[0] as
            | { workspace_id?: string | number | null; workspace?: { id?: string | number; name?: string } | null }
            | undefined;
        const raw = b?.workspace_id ?? b?.workspace?.id;
        if (raw !== undefined && raw !== null && raw !== "") {
            const id = String(raw);
            const nestedName = b?.workspace?.name;
            if (typeof nestedName === "string" && nestedName.length > 0) {
                return { id, name: nestedName };
            }
            try {
                return await fetchWorkspaceById(id);
            } catch {
                return { id, name: "" };
            }
        }
    } catch {
        /* boards fallback unavailable — try workspaces list */
    }
    try {
        const wResp = await monday.api(fallbackWorkspacesListQuery);
        const w = wResp?.data?.["workspaces"]?.[0] as { id?: string | number; name?: string } | undefined;
        if (!w?.id) {
            return null;
        }
        return { id: String(w.id), name: String(w.name ?? "") };
    } catch {
        return null;
    }
}

/** Board surface only — not dashboard widgets / account views (those may still expose boardIds). */
const isBoardViewSurface = (context: MondayContextResult): boolean => {
    const d = context?.data;
    if (!d) return false;
    if (d.instanceType === "board_view") return true;
    const featureType = d.appFeature?.type;
    if (featureType === "AppFeatureBoardView") return true;
    return false;
};

const getContext = async (): Promise<MondayContextResult> => {
    const monday = mondaySdk();
    const context = await monday.get("context");
    return (context ?? {}) as MondayContextResult;
};

const getAccountId = async () => {
    const monday = mondaySdk();
    const context = await monday.get("context");
    return context?.data?.account?.id;
};

const getWorkspace = async (): Promise<MondayWorkspace | null> => {
    const ctx = await getContext();
    const rawId = ctx?.data?.["workspaceId"];
    if (rawId === undefined || rawId === null || rawId === "") {
        return null;
    }
    const id = String(rawId);
    return fetchWorkspaceById(id);
};

const getBoard = async (): Promise<MondayBoard | null> => {
    const ctx = await getContext();
    const rawId = ctx?.data?.["boardId"];
    if (rawId === undefined || rawId === null || rawId === "") {
        return null;
    }
    const id = String(rawId);
    return fetchBoardById(id);
};

type ContextSubscriber = (ctx: MondayContextResult) => void;
const contextSubscribers = new Set<ContextSubscriber>();
let mondayContextUnsub: (() => void) | null = null;

/** Latest context from listen/get so subscribers that attach later still see it (e.g. waitForAccountId after auth). */
let lastContextSnapshot: MondayContextResult | null = null;

const normalizeContextMessage = (msg: unknown): MondayContextResult =>
    (msg && typeof msg === "object" ? msg : {}) as MondayContextResult;

const broadcastContext = (ctx: MondayContextResult) => {
    lastContextSnapshot = ctx;
    contextSubscribers.forEach((fn) => {
        try {
            fn(ctx);
        } catch {
            /* ignore subscriber errors */
        }
    });
};

/**
 * Single monday.listen('context') + one initial get for the whole app.
 * Handlers must NOT call monday.get('context') again — use the payload only
 * except for debounced GraphQL name fetches.
 */
const subscribeMondayContext = (handler: ContextSubscriber): (() => void) => {
    const monday = mondaySdk();
    if (contextSubscribers.size === 0) {
        mondayContextUnsub = monday.listen("context", (msg: unknown) => {
            broadcastContext(normalizeContextMessage(msg));
        });
        void monday.get("context").then((c: unknown) => {
            broadcastContext(normalizeContextMessage(c));
        });
    }
    contextSubscribers.add(handler);
    if (lastContextSnapshot) {
        try {
            handler(lastContextSnapshot);
        } catch {
            /* ignore */
        }
    }
    return () => {
        contextSubscribers.delete(handler);
        if (contextSubscribers.size === 0) {
            mondayContextUnsub?.();
            mondayContextUnsub = null;
            lastContextSnapshot = null;
        }
    };
};

const subscribeAccountId = (onAccountId: (accountId: string | null) => void): (() => void) => {
    return subscribeMondayContext((ctx) => {
        const raw = ctx?.data?.account?.id;
        if (raw === undefined || raw === null || raw === "") {
            onAccountId(null);
        } else {
            onAccountId(String(raw));
        }
    });
};

const subscribeWorkspace = (onWorkspace: (workspace: MondayWorkspace | null) => void): (() => void) => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const clearTimer = () => {
        if (debounceTimer !== null) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
    };

    const unsub = subscribeMondayContext((ctx) => {
        clearTimer();
        const rawId = ctx?.data?.["workspaceId"];
        debounceTimer = setTimeout(() => {
            debounceTimer = null;
            if (rawId === undefined || rawId === null || rawId === "") {
                void fetchFallbackWorkspaceFromAccount()
                    .then((w) => {
                        if (!cancelled) {
                            onWorkspace(w);
                        }
                    })
                    .catch(() => {
                        if (!cancelled) {
                            onWorkspace(null);
                        }
                    });
                return;
            }
            const id = String(rawId);
            void fetchWorkspaceById(id)
                .then((w) => {
                    if (!cancelled) {
                        onWorkspace(w);
                    }
                })
                .catch(() => {
                    if (!cancelled) {
                        onWorkspace({ id, name: "" });
                    }
                });
        }, CONTEXT_API_DEBOUNCE_MS);
    });

    return () => {
        cancelled = true;
        clearTimer();
        unsub();
    };
};

const subscribeWorkspaceAndBoard = (
    onUpdate: (workspace: MondayWorkspace | null, board: MondayBoard | null) => void
): (() => void) => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const clearTimer = () => {
        if (debounceTimer !== null) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
    };

    const unsub = subscribeMondayContext((ctx) => {
        clearTimer();
        const wRaw = ctx?.data?.["workspaceId"];
        const bRaw = ctx?.data?.["boardId"];
        const workspaceId =
            wRaw === undefined || wRaw === null || wRaw === "" ? null : String(wRaw);
        const boardId =
            bRaw === undefined || bRaw === null || bRaw === "" ? null : String(bRaw);

        if (!workspaceId && !boardId) {
            onUpdate(null, null);
            return;
        }

        debounceTimer = setTimeout(() => {
            debounceTimer = null;
            void Promise.all([
                workspaceId ? fetchWorkspaceById(workspaceId) : Promise.resolve(null),
                boardId ? fetchBoardById(boardId) : Promise.resolve(null),
            ])
                .then(([workspace, board]) => {
                    if (!cancelled) {
                        onUpdate(workspace, board);
                    }
                })
                .catch(() => {
                    if (!cancelled) {
                        onUpdate(
                            workspaceId ? { id: workspaceId, name: "" } : null,
                            boardId ? { id: boardId, name: "" } : null
                        );
                    }
                });
        }, CONTEXT_API_DEBOUNCE_MS);
    });

    return () => {
        cancelled = true;
        clearTimer();
        unsub();
    };
};

const getUsers = async (_workspaceId: string, query: string) => {
    const getUsersQuery =
        `query ($query: String!) {
            users(name: $query) {
                id
                name
                photo_thumb
            }
        }`;

    const monday = mondaySdk();
    const response = await monday.api(getUsersQuery, { variables: { query } });
    const users: MondayUser[] = response?.data?.["users"] ?? [];

    const accountId = AccountIdProvider.getInstance().getAccountId();
    const mondayIdToUid = (mondayId: string) => `monday@${accountId}@${mondayId}`;

    return users.map(user => new ChatUserSuggestion(mondayIdToUid(user.id), user.name, user.photo_thumb));
};

const listenToThemeChange = (onChange: (theme: 'light' | 'dark' | 'black') => void) => {
    return subscribeMondayContext((ctx) => {
        const theme = ctx?.data?.theme;
        if (theme === "light" || theme === "dark" || theme === "black") {
            onChange(theme);
        }
    });
};

export const Monday = {
    getContext,
    isBoardViewSurface,
    getAccountId,
    getWorkspace,
    getBoard,
    subscribeAccountId,
    subscribeWorkspace,
    subscribeWorkspaceAndBoard,
    getUsers,
    listenToThemeChange
};
