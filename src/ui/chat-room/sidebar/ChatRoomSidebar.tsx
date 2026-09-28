import {
  Accordion,
  AccordionItem,
  IconButton,
  Dialog,
  DialogContentContainer,
  Tooltip,
} from "monday-ui-react-core";
import Announcement from "monday-ui-react-core/dist/icons/Announcement.js";
import "./ChatRoomSidebar.scss";

import { ChatRoomLinks } from "./ChatRoomLinks";
import { ChatRoomSettings } from "./ChatRoomSettings";
import useLocalStorage from "beautiful-react-hooks/useLocalStorage";
import { ResizeStick } from "../../sidebar/ResizeStick";
import { useState, useEffect, type AnimationEvent } from "react";
import { getPosition } from "../../mondayUtils";

export type ChatRoomSidebarProps = {
  isExiting?: boolean;
  onExitAnimationEnd?: () => void;
};

export function ChatRoomSidebar({
  isExiting = false,
  onExitAnimationEnd,
}: ChatRoomSidebarProps) {
  const [sidebarWidth, setSidebarWidth] = useLocalStorage<number>(
    "mimichat-room-sidebar-width",
    288
  );
  const [showSupportPopover, setShowSupportPopover] = useState<boolean>(false);

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

        <div className="p-4 border-t ui-border w-full flex justify-end">
          <Dialog
            position={getPosition("top")}
            open={showSupportPopover}
            onClickOutside={() => setShowSupportPopover(false)}
            showTrigger={[]}
            content={
              <DialogContentContainer>
                <div className="p-4 flex flex-col gap-3">
                  <div className="text-sm font-medium text-gray-800 mb-3">
                    How can we help you?
                  </div>
                  <a
                    href="https://example.invalid/support"
                    className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-200 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                    onClick={() => setShowSupportPopover(false)}
                    target="_blank"
                  >
                    Tell us about the problem you're experiencing
                  </a>
                  <a
                    href="https://example.invalid/support"
                    className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-200 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                    onClick={() => setShowSupportPopover(false)}
                  >
                    Request an enhancement or new feature
                  </a>
                </div>
              </DialogContentContainer>
            }
          >
            <Tooltip
              content="Raise a support ticket"
              position={getPosition("top")}
            >
              <IconButton
                icon={Announcement}
                onClick={() => setShowSupportPopover(true)}
                size="medium"
              />
            </Tooltip>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
