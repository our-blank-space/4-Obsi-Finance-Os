export interface Event<P = any> {
    type: string;
    payload: P;
    timestamp: number;
    source: string;
}

export type EventHandler<P = any> = (event: Event<P>) => void;

export class EventBus {
    private listeners: Map<string, EventHandler[]> = new Map();

    public subscribe<P>(type: string, handler: EventHandler<P>): () => void {
        const current = this.listeners.get(type) || [];
        current.push(handler);
        this.listeners.set(type, current);

        // Return unsubscribe function
        return () => {
            const list = this.listeners.get(type);
            if (list) {
                this.listeners.set(type, list.filter(h => h !== handler));
            }
        };
    }

    public emit<P>(type: string, payload: P, source: string = 'system'): void {
        const event: Event<P> = {
            type,
            payload,
            timestamp: Date.now(),
            source
        };

        const handlers = this.listeners.get(type);
        if (handlers) {
            handlers.forEach(h => {
                try {
                    h(event);
                } catch (e) {
                    console.error(`[EventBus] Error handling event ${type}:`, e);
                }
            });
        }
    }
}

export const globalEventBus = new EventBus();
