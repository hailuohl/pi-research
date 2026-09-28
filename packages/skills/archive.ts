import {crc32,inflateRawSync} from 'node:zlib';
import {ensure} from '../domain/errors.js';

/** Bounded ZIP reader, never a filesystem extractor. Only ordinary stored/deflated entries. */
export function decodeSkillArchive(zip:Buffer):Array<{path:string;bytes:Buffer}> {
    const valid=(ok:unknown,message='ZIP 结构无效或使用不支持的格式')=>ensure(ok,'SKILL_ARCHIVE_INVALID',message,400);
    valid(zip.length>=22&&zip.length<=2*1024*1024,'ZIP 文件需在 2 MiB 以内');
    let end=-1;
    for(let p=zip.length-22;p>=Math.max(0,zip.length-65557);p--)if(zip.readUInt32LE(p)===0x06054b50&&p+22+zip.readUInt16LE(p+20)===zip.length){end=p;break;}
    valid(end>=0);const count=zip.readUInt16LE(end+10),central=zip.readUInt32LE(end+16),centralSize=zip.readUInt32LE(end+12);
    valid(zip.readUInt16LE(end+4)===0&&zip.readUInt16LE(end+6)===0&&zip.readUInt16LE(end+8)===count&&count>0&&count<=128&&central+centralSize===end,'不支持多卷、ZIP64 或过多条目的 ZIP');
    const extra=(start:number,length:number)=>{let p=start;while(p<start+length){valid(p+4<=start+length);const id=zip.readUInt16LE(p),size=zip.readUInt16LE(p+2);valid(id!==1&&p+4+size<=start+length,'不支持 ZIP64 或损坏的扩展字段');p+=4+size;}};
    const names=new Set<string>(),ranges:Array<[number,number]>=[],files:Array<{path:string;bytes:Buffer}>=[];let p=central,total=0;
    for(let index=0;index<count;index++) {
        valid(p+46<=end&&zip.readUInt32LE(p)===0x02014b50);
        const flags=zip.readUInt16LE(p+8),method=zip.readUInt16LE(p+10),checksum=zip.readUInt32LE(p+16),compressed=zip.readUInt32LE(p+20),size=zip.readUInt32LE(p+24),nameLength=zip.readUInt16LE(p+28),extraLength=zip.readUInt16LE(p+30),commentLength=zip.readUInt16LE(p+32),attributes=zip.readUInt32LE(p+38),local=zip.readUInt32LE(p+42);
        valid(p+46+nameLength+extraLength+commentLength<=end&&nameLength>0&&nameLength<=200);
        valid((flags&~0x080e)===0&&(method===0||method===8)&&zip.readUInt16LE(p+34)===0&&compressed!==0xffffffff&&size<=128*1024,'只支持未加密的 stored/deflate ZIP，每个资源最多 128 KiB');
        const rawName=zip.subarray(p+46,p+46+nameLength);let path='';
        try{valid(!!(flags&0x0800)||rawName.every(b=>b<128),'非 UTF-8 文件名必须仅包含 ASCII');path=new TextDecoder('utf-8',{fatal:true}).decode(rawName);}catch{valid(false,'ZIP 文件名必须是可验证的 UTF-8');}
        const directory=path.endsWith('/'),parts=(directory?path.slice(0,-1):path).split('/');
        valid(!/[\\:\x00-\x1f\x7f]/.test(path)&&parts.every(s=>s&&s!=='.'&&s!=='..'&&!/[. ]$/.test(s)),'ZIP 资源路径不安全');
        const key=parts.join('/').normalize('NFC').toLowerCase();valid(!names.has(key),'ZIP 存在重复或大小写冲突路径');names.add(key);
        const kind=(attributes>>>16)&0xf000;
        valid((kind===0||kind===(directory?0x4000:0x8000))&&!(attributes&0x400)&&(!(attributes&0x10)||directory),'ZIP 不允许链接、设备或特殊文件');
        extra(p+46+nameLength,extraLength);
        valid(local+30<=central&&zip.readUInt32LE(local)===0x04034b50&&zip.readUInt16LE(local+6)===flags&&zip.readUInt16LE(local+8)===method);
        const localNameLength=zip.readUInt16LE(local+26),localExtraLength=zip.readUInt16LE(local+28),start=local+30+localNameLength+localExtraLength,finish=start+compressed;
        valid(finish<=central&&zip.subarray(local+30,local+30+localNameLength).equals(rawName));extra(local+30+localNameLength,localExtraLength);
        if(!(flags&8))valid(zip.readUInt32LE(local+14)===checksum&&zip.readUInt32LE(local+18)===compressed&&zip.readUInt32LE(local+22)===size);
        let rangeEnd=finish;
        if(flags&8){valid(finish+12<=central);const offset=zip.readUInt32LE(finish)===0x08074b50?4:0;rangeEnd=finish+offset+12;valid(rangeEnd<=central&&zip.readUInt32LE(finish+offset)===checksum&&zip.readUInt32LE(finish+offset+4)===compressed&&zip.readUInt32LE(finish+offset+8)===size);}
        valid(!ranges.some(([a,b])=>local<b&&rangeEnd>a),'ZIP 条目数据区重叠');ranges.push([local,rangeEnd]);
        total+=size;valid(total<=2*1024*1024,'ZIP 展开内容超过 2 MiB');
        let bytes:Buffer;
        try{bytes=method===0?Buffer.from(zip.subarray(start,finish)):inflateRawSync(zip.subarray(start,finish),{maxOutputLength:128*1024});}catch{valid(false,'ZIP 解压失败或超过大小上限');throw new Error('unreachable');}
        valid(bytes.length===size&&crc32(bytes)===checksum,'ZIP 资源大小或 CRC 不匹配');
        if(directory)valid(size===0,'目录条目不能包含文件内容');else{valid(files.length<64,'技能包最多 64 个文件');files.push({path,bytes});}
        p+=46+nameLength+extraLength+commentLength;
    }
    valid(p===end&&files.length>0);return files;
}
