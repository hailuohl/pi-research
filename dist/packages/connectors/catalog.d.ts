export declare const CONNECTOR_CAPABILITIES: ({
    id: string;
    category: string;
    operations: string[];
    implementation: string;
    verification: string;
    credential: string;
    content: string;
    limitation?: undefined;
} | {
    id: string;
    category: string;
    operations: string[];
    implementation: string;
    verification: string;
    credential: string;
    content?: undefined;
    limitation?: undefined;
} | {
    id: string;
    category: string;
    operations: string[];
    implementation: string;
    verification: string;
    limitation: string;
    credential?: undefined;
    content?: undefined;
} | {
    id: string;
    category: string;
    operations: string[];
    implementation: string;
    verification: string;
    credential: string;
    limitation: string;
    content?: undefined;
})[];
