import { Button } from "monday-ui-react-core";

type ConnectToWorkspaceModalProps = {
  show: boolean;
  onInstall: () => void;
  onCancel?: () => void;
  triggerElement?: HTMLElement;
};

export function ConnectToWorkspaceModal({
  show,
  onInstall,
  onCancel,
  triggerElement: _triggerElement,
}: ConnectToWorkspaceModalProps) {
  if (!show) return null;
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
  const backdropStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.5)'
  };
  const cardStyle: React.CSSProperties = {
    position: 'relative',
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
    width: 560,
    maxWidth: '90vw',
    padding: 24,
    border: '1px solid #e6e9ef'
  };
  const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 600, marginBottom: 8 };
  const bodyStyle: React.CSSProperties = { marginBottom: 16 };
  const actionsStyle: React.CSSProperties = { marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 8 };

  return (
    <div style={overlayStyle}>
      <div style={backdropStyle} onClick={onCancel} />
      <div style={cardStyle}>
        <div style={titleStyle}>Connect to your workspace</div>
        <div style={bodyStyle}>
          MimiChat needs access to your monday.com workspace to enable communication within your boards.
        </div>
        <div style={actionsStyle}>
          {onCancel && (
            <Button kind={Button.kinds.SECONDARY} onClick={onCancel} size={Button.sizes.MEDIUM}>Cancel</Button>
          )}
          <Button onClick={onInstall} size={Button.sizes.MEDIUM}>Install</Button>
        </div>
      </div>
    </div>
  );
}
