import { useEffect, useRef } from "react";

export const useKeyDown = (key: string, callback: () => void, controlKey?: boolean) => useKeysDown([key], callback, controlKey);

export const useKeysDown = (keys: string[], callback: () => void, controlKey?: boolean) => {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;
    const keyList = keys.join('\0');
    useEffect(() => {
        const activeKeys = keyList.split('\0');
        const onKeyDown = (event: KeyboardEvent) => {
            if (activeKeys.includes(event.key) && (!controlKey || event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                callbackRef.current();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [keyList, controlKey]);
};
