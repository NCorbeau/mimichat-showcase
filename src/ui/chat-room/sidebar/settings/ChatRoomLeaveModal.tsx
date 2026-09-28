import { Modal, ModalContent, ModalFooterButtons, ModalHeader } from "monday-ui-react-core";
import { LogOut as Logout } from "monday-ui-react-core/icons";

type ChatRoomLeaveModalProps = {
    onConfirm: () => void;
    onCancel: () => void;
    triggerElement: HTMLElement;
    show: boolean;
};

export function ChatRoomLeaveModal({ onConfirm, onCancel, triggerElement, show }: ChatRoomLeaveModalProps) {

    return (
        <Modal show={show} triggerElement={triggerElement} onClose={onCancel} contentSpacing={true} data-testid="leave-conversation">
            <ModalHeader title="Leave conversation?" icon={Logout} iconSize={32} />
            <ModalContent>You won’t get messages from this group unless someone add you back to the conversation.</ModalContent>
            <ModalFooterButtons primaryButtonText="Leave" secondaryButtonText="Cancel" onPrimaryButtonClick={onConfirm} onSecondaryButtonClick={onCancel} />
        </Modal>
    );

}