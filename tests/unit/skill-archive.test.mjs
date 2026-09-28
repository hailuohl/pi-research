import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateRawSync,crc32} from 'node:zlib';
import {decodeSkillArchive} from '../../dist/packages/skills/archive.js';

function archive(entries){
 const locals=[],directory=[];let offset=0;
 for(const e of entries){const name=Buffer.from(e.path),raw=Buffer.from(e.content??''),method=e.method??8,body=method===0?raw:deflateRawSync(raw),crc=crc32(raw),flags=e.flags??0x800;
  const local=Buffer.alloc(30),central=Buffer.alloc(46);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(flags,6);local.writeUInt16LE(method,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(body.length,18);local.writeUInt32LE(e.size??raw.length,22);local.writeUInt16LE(name.length,26);
  central.writeUInt32LE(0x02014b50);central.writeUInt16LE(3*256+20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(flags,8);central.writeUInt16LE(method,10);central.writeUInt32LE(crc,16);central.writeUInt32LE(body.length,20);central.writeUInt32LE(e.size??raw.length,24);central.writeUInt16LE(name.length,28);central.writeUInt32LE(e.attributes??(0o100644*65536),38);central.writeUInt32LE(offset,42);
  locals.push(local,name,body);directory.push(central,name);offset+=local.length+name.length+body.length;
 }
 const cd=Buffer.concat(directory),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(cd.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...locals,cd,end]);
}

test('ZIP reads exact stored/deflated UTF8 resources in memory, including explicit directories',()=>{
 const zip=archive([{path:'SKILL.md',content:'# 中文\r\n',method:0},{path:'references/',attributes:0o040755*65536+16,content:'',method:0},{path:'references/方法.md',content:'中😀 reference'}]);
 const files=decodeSkillArchive(zip);assert.deepEqual(files.map(f=>[f.path,f.bytes.toString()]),[['SKILL.md','# 中文\r\n'],['references/方法.md','中😀 reference']]);
});
test('ZIP rejects traversal, duplicate names, links, encrypted/unsupported entries, corrupt lengths and CRC',()=>{
 for(const entries of [
  [{path:'../SKILL.md'}],[{path:'/SKILL.md'}],[{path:'a\\SKILL.md'}],[{path:'C:/SKILL.md'}],
  [{path:'SKILL.md'},{path:'skill.md'}],[{path:'SKILL.md',attributes:0o120777*65536}],
  [{path:'SKILL.md',flags:0x801}],[{path:'SKILL.md',method:12}],[{path:'SKILL.md',content:'changed',size:2}]
 ])assert.throws(()=>decodeSkillArchive(archive(entries)),{code:'SKILL_ARCHIVE_INVALID'});
 const zip=archive([{path:'SKILL.md',content:'original',method:0}]);zip[30+'SKILL.md'.length]^=1;assert.throws(()=>decodeSkillArchive(zip),{code:'SKILL_ARCHIVE_INVALID'});
 const localMismatch=archive([{path:'SKILL.md'}]);localMismatch[30]='X'.charCodeAt(0);assert.throws(()=>decodeSkillArchive(localMismatch),{code:'SKILL_ARCHIVE_INVALID'});
 assert.throws(()=>decodeSkillArchive(Buffer.from('not a zip')),{code:'SKILL_ARCHIVE_INVALID'});
});
test('ZIP bomb expansion and file-count bounds are enforced before returning any package',()=>{
 assert.throws(()=>decodeSkillArchive(archive([{path:'SKILL.md',content:'x'.repeat(129*1024),size:1}])),{code:'SKILL_ARCHIVE_INVALID'});
 assert.throws(()=>decodeSkillArchive(archive(Array.from({length:65},(_,i)=>({path:i+'.md'})))),{code:'SKILL_ARCHIVE_INVALID'});
 assert.throws(()=>decodeSkillArchive(archive(Array.from({length:17},(_,i)=>({path:i+'.md',content:'x'.repeat(128*1024)})))),{code:'SKILL_ARCHIVE_INVALID'});
 const zip64=archive([{path:'SKILL.md'}]);zip64.writeUInt32LE(0xffffffff,zip64.length-6);assert.throws(()=>decodeSkillArchive(zip64),{code:'SKILL_ARCHIVE_INVALID'});
});
