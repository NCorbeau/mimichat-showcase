export type StoredMessage = { id: string };

/** Small in-memory store used only by the portfolio demo. */
export class MockMessageStore<T extends StoredMessage> {
  private readonly messages: Record<string, T[]>;
  private readonly roomListeners = new Map<string, Set<(messages: T[]) => void>>();
  private readonly latestListeners = new Set<(latest: Map<string, T>) => void>();

  constructor(seed: Record<string, T[]>) {
    this.messages = Object.fromEntries(
      Object.entries(seed).map(([roomId, messages]) => [roomId, [...messages]])
    );
  }

  get(roomId: string): T[] {
    return [...(this.messages[roomId] ?? [])];
  }

  add(roomId: string, message: T): boolean {
    const messages = this.messages[roomId];
    if (!messages || messages.some((existing) => existing.id === message.id)) return false;
    messages.push(message);
    this.roomListeners.get(roomId)?.forEach((listener) => listener(this.get(roomId)));
    this.latestListeners.forEach((listener) => listener(this.latest()));
    return true;
  }

  subscribe(roomId: string, listener: (messages: T[]) => void): () => void {
    const listeners = this.roomListeners.get(roomId) ?? new Set();
    listeners.add(listener);
    this.roomListeners.set(roomId, listeners);
    listener(this.get(roomId));
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) this.roomListeners.delete(roomId);
    };
  }

  subscribeLatest(listener: (latest: Map<string, T>) => void): () => void {
    this.latestListeners.add(listener);
    listener(this.latest());
    return () => this.latestListeners.delete(listener);
  }

  latest(): Map<string, T> {
    const latest = new Map<string, T>();
    Object.entries(this.messages).forEach(([roomId, messages]) => {
      if (messages.length > 0) latest.set(roomId, messages[messages.length - 1]);
    });
    return latest;
  }
}
