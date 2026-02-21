export interface Command<P = any> {
    type: string;
    payload: P;
    timestamp: number;
    correlationId: string;
}

export type CommandHandler<P = any> = (command: Command<P>) => Promise<void>;

export class CommandDispatcher {
    private handlers: Map<string, CommandHandler[]> = new Map();
    private middleware: ((command: Command) => Promise<void>)[] = [];

    /**
     * Registra un manejador para un tipo específico de comando.
     */
    public register<P>(type: string, handler: CommandHandler<P>): void {
        const current = this.handlers.get(type) || [];
        current.push(handler);
        this.handlers.set(type, current);
    }

    /**
     * Registra un middleware que se ejecuta antes de cada comando.
     */
    public use(middleware: (command: Command) => Promise<void>): void {
        this.middleware.push(middleware);
    }

    /**
     * Despacha un comando a sus manejadores registrados.
     */
    public async dispatch<P>(type: string, payload: P): Promise<void> {
        const command: Command<P> = {
            type,
            payload,
            timestamp: Date.now(),
            correlationId: Math.random().toString(36).substring(7)
        };

        // Execute Middleware
        for (const mw of this.middleware) {
            await mw(command);
        }

        // Execute Handlers
        const handlers = this.handlers.get(type);
        if (handlers && handlers.length > 0) {
            await Promise.all(handlers.map(h => h(command)));
        } else {
            console.warn(`[CommandDispatcher] No handlers registered for command: ${type}`);
        }
    }
}

// Singleton instance (optional, depending on DI strategy)
export const globalDispatcher = new CommandDispatcher();
