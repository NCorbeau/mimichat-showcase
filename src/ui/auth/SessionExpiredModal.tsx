import { Button } from "monday-ui-react-core";

type SessionExpiredModalProps = {
  show: boolean;
  onRefresh: () => void;
  triggerElement?: HTMLElement;
  title?: string;
  message?: string;
  actionLabel?: string;
};

export function SessionExpiredModal({
  show,
  onRefresh,
  triggerElement: _triggerElement,
  title = 'Session Expired',
  message = 'Your session has expired for security reasons. Please refresh to continue using chat features.',
  actionLabel = 'Refresh now',
}: SessionExpiredModalProps) {
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
  const actionsStyle: React.CSSProperties = { marginTop: 24, display: 'flex', justifyContent: 'flex-end' };

  return (
    <div style={overlayStyle}>
      <div style={backdropStyle} />
      <div style={cardStyle}>
        <div style={titleStyle}>{title}</div>
        <div style={bodyStyle}>{message}</div>
        <div style={actionsStyle}>
          <Button onClick={onRefresh} size={Button.sizes.MEDIUM}>{actionLabel}</Button>
        </div>
      </div>
    </div>
  );
}
