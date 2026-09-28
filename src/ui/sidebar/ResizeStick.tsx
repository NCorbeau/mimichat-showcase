import useMouseEvents from "beautiful-react-hooks/useMouseEvents";
import { useState } from "react";

type ResizeStickProps = {
    width: number;
    minWidth: number;
    direction: 'left' | 'right';
    onResize: (width: number) => void;
};

export function ResizeStick({ width, minWidth, direction, onResize }: ResizeStickProps) {

    const { onMouseMove, onMouseUp } = useMouseEvents();

    const [dragInProgress, setDragInProgress] = useState<boolean>(false);
    const [dragStartX, setDragStartX] = useState<number>(0);
    const [dragStartWidth, setDragStartWidth] = useState<number>(0);

    onMouseMove((e) => {
        if (dragInProgress) {
            const newWidth = dragStartWidth + (direction === 'left' ? dragStartX - e.clientX : e.clientX - dragStartX);
            onResize(newWidth > minWidth ? newWidth : minWidth);
        }
    });

    onMouseUp(() => {
        setDragInProgress(false);
    });

    const onMouseDown = (e: React.MouseEvent) => {
        setDragInProgress(true);
        setDragStartX(e.clientX);
        setDragStartWidth(width);
    };

    return (
        <div className="h-full w-px bg-border flex-shrink-0">
            <span onMouseDown={onMouseDown} className="h-full absolute w-3 cursor-ew-resize -translate-x-1.5 z-20"></span>
        </div>
    );

}