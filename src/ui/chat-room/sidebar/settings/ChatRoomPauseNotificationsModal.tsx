import {
  IconButton,
  Modal,
  ModalContent,
  ModalHeader,
  RadioButton,
  Tooltip,
} from "monday-ui-react-core";
import NotificationsMuted from "monday-ui-react-core/dist/icons/NotificationsMuted.js";
import Notifications from "monday-ui-react-core/dist/icons/Notifications.js";
import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../../../ChatContext";
import { DateTime } from "luxon";
import { Chat } from "../../../../app/chat";

export type ChatRoomPauseNotificationsModalProps = {
  onClose: () => void;
  triggerElement: HTMLElement;
  show: boolean;
};

export function ChatRoomPauseNotificationsModal({
  onClose,
  triggerElement,
  show,
}: ChatRoomPauseNotificationsModalProps) {
  const { pausedNotificationsByRoom, selectedRoom, currentUser } =
    useContext(ChatContext);

  const [currentlyPausedUntil, setCurrentlyPausedUntil] = useState<
    number | null | undefined
  >(undefined);
  const [selectedPauseDuration, setSelectedPauseDuration] = useState<
    number | null | undefined
  >(undefined);

  useEffect(() => {
    if (pausedNotificationsByRoom?.has(selectedRoom?.id)) {
      setCurrentlyPausedUntil(pausedNotificationsByRoom.get(selectedRoom?.id));
    }
  }, [pausedNotificationsByRoom, selectedRoom?.id]);

  useEffect(() => {
    setSelectedPauseDuration(undefined);
  }, [show]);

  const pauseNotifications = (hours: number | null) => {
    setSelectedPauseDuration(hours);
    const pausedUntil =
      hours > 0 ? DateTime.local().plus({ hours }).toMillis() : hours;
    Chat.pauseNotifications(selectedRoom.id, currentUser.uid, pausedUntil);
  };

  const resumeNotifications = () => {
    Chat.resumeNotifications(selectedRoom.id, currentUser.uid);
  };

  const formatDate = (timestamp: number) => {
    if (timestamp === -1) {
      return "further notice.";
    }

    const date = DateTime.fromMillis(timestamp);
    return date.toLocaleString(DateTime.DATETIME_SHORT);
  };

  return (
    <Modal
      show={show}
      triggerElement={triggerElement}
      onClose={onClose}
      contentSpacing={true}
      data-testid="pause-notifications"
    >
      <ModalHeader
        title="Pause notifications"
        icon={NotificationsMuted}
        iconSize={32}
      />
      <ModalContent>
        <div className="flex flex-col gap-4">
          <div className="h-10 flex items-center">
            {currentlyPausedUntil ? (
              <div className="secondary flex items-center gap-1">
                Notifications paused until {formatDate(currentlyPausedUntil)}
                <Tooltip content="Resume notofications" zIndex={99999}>
                  <IconButton
                    icon={Notifications}
                    onClick={() => resumeNotifications()}
                  />
                </Tooltip>
              </div>
            ) : (
              <div className="secondary">Notifications are active.</div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-sm">Set your notification pause time:</div>
            <div className="flex flex-col gap-1">
              <RadioButton
                text="1 hour"
                checked={selectedPauseDuration === 1}
                onSelect={() => pauseNotifications(1)}
              />
              <RadioButton
                text="2 hours"
                checked={selectedPauseDuration === 2}
                onSelect={() => pauseNotifications(2)}
              />
              <RadioButton
                text="4 hours"
                checked={selectedPauseDuration === 4}
                onSelect={() => pauseNotifications(4)}
              />
              <RadioButton
                text="8 hours"
                checked={selectedPauseDuration === 8}
                onSelect={() => pauseNotifications(8)}
              />
              <RadioButton
                text="Until further notice"
                checked={selectedPauseDuration === -1}
                onSelect={() => pauseNotifications(-1)}
              />
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
