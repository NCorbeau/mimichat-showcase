import {
  Accordion,
  AccordionItem,
} from "monday-ui-react-core";
import "./ChatRoomSidebar.scss";

import { ChatRoomLinks } from "./ChatRoomLinks";
import { ChatRoomSettings } from "./ChatRoomSettings";
import { useLocalStorageState } from "../../utils/useLocalStorageState";
import { ResizeStick } from "../../sidebar/ResizeStick";
import { useEffect, type AnimationEvent } from "react";

export type ChatRoomSidebarProps = {
  isExiting?: boolean;
  onExitAnimationEnd?: () => void;
};

export function ChatRoomSidebar({
  isExiting = false,
  onExitAnimationEnd,
}: ChatRoomSidebarProps) {
  const [sidebarWidth, setSidebarWidth] = useLocalStorageState<number>(
    "mimichat-room-sidebar-width",
    288
  );

  useEffect(() => {
    if (!isExiting || !onExitAnimationEnd) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq.matches) return;
    const id = window.setTimeout(() => onExitAnimationEnd(), 0);
    return () => window.clearTimeout(id);
  }, [isExiting, onExitAnimationEnd]);

  const onRootAnimationEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.animationName !== "chat-room-sidebar-exit") return;
    onExitAnimationEnd?.();
  };

  return (
    <div
      style={{ width: sidebarWidth }}
      className={`chat-room-sidebar flex-shrink-0 flex min-w-44 max-w-md${
        isExiting ? " chat-room-sidebar--exiting" : ""
      }`}
      onAnimationEnd={onRootAnimationEnd}
    >
      <ResizeStick
        direction="left"
        width={sidebarWidth}
        minWidth={176}
        onResize={(width) => setSidebarWidth(width)}
      />
      <div className="flex flex-col h-full w-full">
        <Accordion
          allowMultiple={true}
          defaultIndex={[1]}
          className="flex-1 w-full overflow-y-auto border-none accordion"
        >
          <AccordionItem
            title="Settings"
            hideBorder={true}
            contentClassName="p-0"
          >
            <div className="chat-room-sidebar__panel-content">
              <ChatRoomSettings />
            </div>
          </AccordionItem>
          <AccordionItem title="Links" hideBorder={true} contentClassName="p-0">
            <div className="chat-room-sidebar__panel-content">
              <ChatRoomLinks />
            </div>
          </AccordionItem>
        </Accordion>

      </div>
    </div>
  );
}
