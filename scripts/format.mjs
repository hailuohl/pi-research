/** Optional deterministic source formatting; uses the pinned development TypeScript package. */
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
const printer=ts.createPrinter({newLine:ts.NewLineKind.LineFeed});
function walk(root){for(const entry of fs.readdirSync(root,{withFileTypes:true})){const file=path.join(root,entry.name);if(entry.isDirectory())walk(file);else if(/\.(ts|tsx)$/.test(entry.name)){const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);if(source.parseDiagnostics.length)throw new Error(`Parse error: ${file}`);fs.writeFileSync(file,printer.printFile(source));}}}
for(const root of ['packages','apps'])walk(root);
