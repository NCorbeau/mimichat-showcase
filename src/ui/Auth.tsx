import axios from "axios";
import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Loader } from "monday-ui-react-core";
import { getMondayOAuthRedirectUrl } from "../infrastructure/firebase/auth/FirebaseAuth";

export function Auth() {
    const [searchParams] = useSearchParams();
    const [accessToken, setAccessToken] = useState<string | null>(null);

    const code = searchParams.get('code');

    const authenticateToMonday = async (code: string) => {
        const url = import.meta.env.VITE_MONDAY_AUTH_FUNCTION_URL;
        if (!url) {
            throw new Error("VITE_MONDAY_AUTH_FUNCTION_URL is not set. Set it to your mondayAuth Cloud Function URL (e.g. https://<region>-<project>.cloudfunctions.net/mondayAuth), not the auth URL.");
        }
        if (url === import.meta.env.VITE_AUTH_FUNCTION_URL) {
            throw new Error("VITE_MONDAY_AUTH_FUNCTION_URL must be the mondayAuth function URL, not the auth function URL. You get 'Missing token' when the auth endpoint receives the OAuth code.");
        }
        const data = { code, redirectUri: getMondayOAuthRedirectUrl() };
        const res = await axios.post(url, data);
        return res.data;
    };

    useEffect(() => {
        if (code) {
            authenticateToMonday(code).then((data) => {
                setAccessToken(data.access_token);
            });
        }
    }, [code]);

    if (accessToken) {
        return <Navigate to={`/?access_token=${accessToken}`} />;
    }

    return (
        <div className="flex justify-center items-center w-full h-screen">
          <Loader size={Loader.sizes.LARGE} />
        </div>
      );
}