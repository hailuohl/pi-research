import type { ResearchApp } from '../research-app.js';
import type { Actor } from '../domain/types.js';
import { type PublicationTemplate, type PublicationTemplateContent } from './templates.js';
export declare const TEMPLATE_ZIP_BYTES: number;
export declare class PublicationTemplateLibrary {
    private app;
    constructor(app: ResearchApp);
    private access;
    private summary;
    list(actor: Actor, pid?: string): PublicationTemplate[];
    inspect(actor: Actor, id: string, pid?: string): PublicationTemplate;
    read(actor: Actor, id: string, path: string, pid?: string): PublicationTemplateContent;
    import(actor: Actor, value: unknown, key: string, validate?: () => void, pid?: string): PublicationTemplate;
}
