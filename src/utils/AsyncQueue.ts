export class AsyncQueue {
    private queue: Promise<void> = Promise.resolve();

    /**
     * Enqueues a task to be executed sequentially.
     * @param task A function that returns a promise.
     * @returns A promise that resolves with the result of the task.
     */
    public enqueue<T>(task: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue = this.queue.then(async () => {
                try {
                    const result = await task();
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }
}
