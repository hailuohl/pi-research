import {crc32,deflateRawSync} from 'node:zlib';
import {mkdtempSync,realpathSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {USER} from '../../dist/packages/domain/types.js';
export function templateFixture(){const dir=mkdtempSync(join(realpathSync.native(tmpdir()),'pi-template-')),app=new ResearchApp(dir,process.cwd()),project=app.projects.create(USER,{name:'Template fixture'}),session=app.sessions.create(USER,project.id,{});return {dir,app,project,session,close(){this.app.close();rmSync(dir,{recursive:true,force:true});}};}
export const templateInput=(content='% 中文🙂\n\\documentclass{article}\n\\begin{document}Template\\end{document}')=>({title:'Reusable template',engine:'xelatex',mainFile:'main.tex',bibliography:'none',files:[{path:'main.tex',contentBase64:Buffer.from(content).toString('base64')}]});
export function templateZip(entries){const locals=[],directory=[];let offset=0;
 for(const e of entries){const name=Buffer.from(e.path),raw=Buffer.from(e.bytes??e.content??''),body=deflateRawSync(raw),checksum=crc32(raw),local=Buffer.alloc(30),central=Buffer.alloc(46);
  local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(8,8);local.writeUInt32LE(checksum,14);local.writeUInt32LE(body.length,18);local.writeUInt32LE(raw.length,22);local.writeUInt16LE(name.length,26);
  central.writeUInt32LE(0x02014b50);central.writeUInt16LE(0x314,4);central.writeUInt16LE(20,6);central.writeUInt16LE(0x800,8);central.writeUInt16LE(8,10);central.writeUInt32LE(checksum,16);central.writeUInt32LE(body.length,20);central.writeUInt32LE(raw.length,24);central.writeUInt16LE(name.length,28);central.writeUInt32LE(e.attributes??0o100644*65536,38);central.writeUInt32LE(offset,42);
  locals.push(local,name,body);directory.push(central,name);offset+=30+name.length+body.length;
 }
 const cd=Buffer.concat(directory),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(cd.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...locals,cd,end]);
}
