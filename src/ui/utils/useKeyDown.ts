import { useEffect } from "react";

export const useKeyDown = (key: string, callback: () => void, controlKey?: boolean) => useKeysDown([key], callback, controlKey);

export const useKeysDown = (keys: string[], callback: () => void, controlKey?: boolean) => {
    const onKeyDown = (event: KeyboardEvent) => {
        const wasAnyKeyPressed = keys.some((key) => event.key === key);
        if (wasAnyKeyPressed && (controlKey ? (event.metaKey || event.ctrlKey) : true)) {
            event.preventDefault();
            callback();
        }
    };
    useEffect(() => {
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    }, []);
};