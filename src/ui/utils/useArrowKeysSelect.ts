import { useEffect, useState } from "react";
import { useKeyDown } from "./useKeyDown";

export const useArrowKeysSelect = (onSelect: (index: number) => void) => {

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [confirmed, setConfirmed] = useState<boolean>(false);

    useEffect(() => {
        if (confirmed) {
            onSelect(selectedIndex);
            setConfirmed(false);
        }
    }, [confirmed, onSelect, selectedIndex]);

    useKeyDown('ArrowDown', () => {
        setSelectedIndex((prev) => {
            return prev + 1;
        });
    });

    useKeyDown('ArrowUp', () => {
        setSelectedIndex((prev) => {
            return prev - 1;

        });
    });

    useKeyDown('Enter', () => {
        setConfirmed(true);
    });

    return selectedIndex;

};

export function isSelectedByArrowKeys(index: number, selectedIndex: number, arrayLength: number): boolean {
    if (selectedIndex < 0) {
        return arrayLength + (selectedIndex % arrayLength) === index;
    }

    return index === selectedIndex % arrayLength;
}
