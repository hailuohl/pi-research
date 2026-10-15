/** Display traffic gets one IPC credit; HTTP control never waits for that credit. */
export declare function workerDeltaSender(send: (message: {
    type: 'delta';
    deltaId: number;
    text: string;
}) => void): {
    push(text: string): void;
    acknowledge(deltaId: number): void;
    clear(): void;
};
