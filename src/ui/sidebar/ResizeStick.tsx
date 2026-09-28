import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

type ResizeStickProps = {
    width: number;
    minWidth: number;
    direction: 'left' | 'right';
    onResize: (width: number) => void;
};

export function ResizeStick({ width, minWidth, direction, onResize }: ResizeStickProps) {

    const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

    useEffect(() => {
        const onPointerMove = (event: PointerEvent) => {
            const drag = dragRef.current;
            if (!drag) return;
            const delta = direction === 'left' ? drag.startX - event.clientX : event.clientX - drag.startX;
            onResize(Math.max(minWidth, drag.startWidth + delta));
        };
        const onPointerUp = () => { dragRef.current = null; };
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
    }, [direction, minWidth, onResize]);

    const onPointerDown = (event: ReactPointerEvent<HTMLSpanElement>) => {
        event.preventDefault();
        dragRef.current = { startX: event.clientX, startWidth: width };
    };

    return (
        <div className="h-full w-px bg-border flex-shrink-0">
            <span onPointerDown={onPointerDown} className="h-full absolute w-3 cursor-ew-resize -translate-x-1.5 z-20"></span>
        </div>
    );

}
