import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import ts from 'typescript';

test('installed React declarations reject bad component children, props and HTML handlers',()=>{
 const filename=resolve('apps/web/src/__type_probe__.tsx'),source=`import {Badge,Empty} from './ui.js';
const valid=<Empty title="valid"><Badge value="completed"/></Empty>;
const wrongProp=<Badge value={123}/>;
const wrongChild=<Empty title="invalid">{{unsafe:true}}</Empty>;
const wrongHTML=<button onClick="run" href="invalid">bad</button>;`;
 const config=ts.readConfigFile('apps/web/tsconfig.json',ts.sys.readFile),parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,resolve('apps/web'));
 const host=ts.createCompilerHost(parsed.options),read=host.getSourceFile.bind(host);host.getSourceFile=(name,language,...rest)=>resolve(name)===filename?ts.createSourceFile(name,source,language,true,ts.ScriptKind.TSX):read(name,language,...rest);
 const program=ts.createProgram([filename],parsed.options,host),errors=ts.getPreEmitDiagnostics(program).filter(d=>d.category===ts.DiagnosticCategory.Error);
 assert.ok(errors.length>=3);assert.ok(errors.every(d=>resolve(d.file?.fileName??'')===filename),ts.formatDiagnosticsWithColorAndContext(errors,{getCurrentDirectory:ts.sys.getCurrentDirectory,getCanonicalFileName:f=>f,getNewLine:()=> '\n'}));
 assert.deepEqual([...new Set(errors.map(d=>d.file.getLineAndCharacterOfPosition(d.start).line))].sort(),[2,3,4]);
});

test('browser entry uses the bundled local runtime without old globals or CDN scripts',()=>{
 const html=readFileSync('dist/web/index.html','utf8');assert.match(html,/src="\/assets\/main.js"/);assert.doesNotMatch(html,/vendor\/react|https?:\/\//);
 assert.ok(existsSync('dist/web/assets/main.js'));assert.equal(existsSync('dist/web/vendor/react.production.min.js'),false);assert.equal(existsSync('apps/web/src/react-global.d.ts'),false);
 const main=readFileSync('dist/web/assets/main.js','utf8');assert.doesNotMatch(main,/from\s*["']react(?:-dom)?[\/"']/);assert.ok(main.length>10000);
});
