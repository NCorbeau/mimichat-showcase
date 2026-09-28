import { FirebaseApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import axios from "axios";

const MONDAY_OAUTH_AUTHORIZE = "https://auth.monday.com/oauth2/authorize";

/** Redirect URL for Monday OAuth: main view and board view use their own origin unless overridden. */
export function getMondayOAuthRedirectUrl(): string {
    const explicit = import.meta.env.VITE_MONDAY_OAUTH_REDIRECT_URL;
    if (explicit && String(explicit).trim() !== "") {
        if (import.meta.env.DEV && typeof window !== "undefined") {
            try {
                const explicitOrigin = new URL(explicit).origin;
                if (explicitOrigin !== window.location.origin) {
                    // eslint-disable-next-line no-console
                    console.warn(
                        "[MimiChat] VITE_MONDAY_OAUTH_REDIRECT_URL is",
                        explicitOrigin,
                        "but this page is",
                        window.location.origin,
                        "— after Authorize, Monday will send users to the redirect host (often production). Remove VITE_MONDAY_OAUTH_REDIRECT_URL so /auth stays on this origin, or set it to this origin for local dev.",
                    );
                }
            } catch {
                /* ignore invalid URL */
            }
        }
        return explicit;
    }
    return `${window.location.origin}/auth`;
}

function buildMondayOAuthUrl(): string {
    const redirectUrl = getMondayOAuthRedirectUrl();
    const clientId = import.meta.env.VITE_MONDAY_CLIENT_ID;
    if (clientId) {
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUrl,
        });
        return `${MONDAY_OAUTH_AUTHORIZE}?${params.toString()}`;
    }
    return `${import.meta.env.VITE_MONDAY_OAUTH_URL}${encodeURIComponent(redirectUrl)}`;
}

const authStart = async () => {
    const oauthUrl = buildMondayOAuthUrl();
    window.location.href = oauthUrl;
};

const authenticate = async (app: FirebaseApp, token?: string) => {
    if (!token) {
        return authStart();
    }

    const data = { token };
    const authUrl = import.meta.env.VITE_AUTH_FUNCTION_URL;

    const res = await axios.post(authUrl, data);
    const mimiToken = res.data.mimiToken;

    return signInWithCustomToken(getAuth(app), mimiToken);
};

export const FirebaseAuth = {
    authenticate,
    startOAuth: authStart
};