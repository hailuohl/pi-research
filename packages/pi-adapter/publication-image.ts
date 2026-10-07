import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ensure} from '../domain/errors.js';
import {PI_VERSION} from './runtime.js';
export const PUBLICATION_IMAGE_TOOL='publication_page_image_read';
export const PAGE_IMAGE_BYTES=4*1024*1024,CONTEXT_IMAGE_BYTES=16*1024*1024;
export interface PublicationImageReference {actionId:string;publicationResultId:string;pageNumber:number;digest:string;bytes:number;width:number;height:number;}
const hash=(value:Buffer|string)=>createHash('sha256').update(value).digest('hex');
/** Only a digest leaves the credential-bearing catalog. Missing catalog means SDK built-ins. */
export function publicationImageCatalog(path:string){return hash(JSON.stringify({sdk:PI_VERSION,catalog:existsSync(path)?hash(readFileSync(path)):null}));}
export function assertPublicationPng(bytes:Buffer,width:number,height:number){
 ensure(bytes.length>=33&&bytes.length<=PAGE_IMAGE_BYTES&&Number.isInteger(width)&&Number.isInteger(height)&&width>=1&&height>=1&&width<=1600&&height<=1600,'MODEL_IMAGE_LIMIT','固定页须为不超过4 MiB、1600px的PNG');
 ensure(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&bytes.toString('ascii',12,16)==='IHDR'&&bytes.readUInt32BE(16)===width&&bytes.readUInt32BE(20)===height,'MODEL_IMAGE_INVALID','固定PNG头或尺寸不符');
}
export function imageReference(value:unknown):PublicationImageReference {
 ensure(value&&typeof value==='object'&&!Array.isArray(value),'MODEL_IMAGE_UNBOUND','图片缺少固定引用');const r=value as PublicationImageReference;
 ensure(Object.keys(r).sort().join(',')==='actionId,bytes,digest,height,pageNumber,publicationResultId,width'&&[r.actionId,r.publicationResultId].every(v=>typeof v==='string'&&v.length>0&&v.length<=100)&&typeof r.digest==='string'&&/^[a-f0-9]{64}$/.test(r.digest)&&Number.isInteger(r.pageNumber)&&r.pageNumber>=1&&r.pageNumber<=100&&Number.isInteger(r.bytes)&&r.bytes>=33&&r.bytes<=PAGE_IMAGE_BYTES&&[r.width,r.height].every(v=>Number.isInteger(v)&&v>=1&&v<=1600),'MODEL_IMAGE_UNBOUND','图片引用字段无效');return r;
}
export function publicationImageResult(value:unknown){
 ensure(value&&typeof value==='object'&&!Array.isArray(value),'MODEL_IMAGE_INVALID','无效图片结果');const r=value as {reference:unknown;data:string;mimeType:string};
 ensure(Object.keys(r).sort().join(',')==='data,mimeType,reference'&&r.mimeType==='image/png','MODEL_IMAGE_INVALID','图片结果字段无效');const reference=imageReference(r.reference);
 const content=[{type:'text' as const,text:`固定文稿 ${reference.publicationResultId} 第 ${reference.pageNumber} 页；PNG SHA256 ${reference.digest}。仅观察布局，不证明科学结论。`},{type:'image' as const,data:r.data,mimeType:r.mimeType}];
 imageContextReferences({messages:[{role:'toolResult',toolName:PUBLICATION_IMAGE_TOOL,isError:false,content,details:{publicationPage:reference}}]},true,true);
 return {content,details:{publicationPage:reference}};
}
/** Inspect every actual block before provider conversion; repeated images count toward the byte limit. */
export function imageContextReferences(context:{messages:readonly unknown[]},supportsImages:boolean,managed:boolean):PublicationImageReference[]{
 const refs:PublicationImageReference[]=[];let total=0;
 for(const raw of context.messages){const m=raw as {role?:string;toolName?:string;isError?:boolean;content?:unknown;details?:{publicationPage?:unknown}};if(!Array.isArray(m.content))continue;const images=m.content.filter(b=>b?.type==='image');if(!images.length)continue;
  ensure(managed,'MODEL_IMAGE_UNMANAGED','图片只可通过受管模型HTTP发送');ensure(supportsImages,'MODEL_IMAGE_UNSUPPORTED','当前模型目录未声明图片输入能力');
  ensure(m.role==='toolResult'&&m.toolName===PUBLICATION_IMAGE_TOOL&&m.isError===false&&images.length===1,'MODEL_IMAGE_UNBOUND','图片不是获准固定页工具的单页结果');const r=imageReference(m.details?.publicationPage),image=images[0];
  ensure(image.mimeType==='image/png'&&typeof image.data==='string'&&image.data.length<=4*Math.ceil(PAGE_IMAGE_BYTES/3)&&image.data.length%4===0&&/^[A-Za-z0-9+/]*={0,2}$/.test(image.data),'MODEL_IMAGE_INVALID','图片数据或类型无效');
  const bytes=Buffer.from(image.data,'base64');ensure(bytes.toString('base64')===image.data&&bytes.length===r.bytes&&hash(bytes)===r.digest,'MODEL_IMAGE_INVALID','图片与固定字节摘要不符');assertPublicationPng(bytes,r.width,r.height);total+=bytes.length;ensure(total<=CONTEXT_IMAGE_BYTES,'MODEL_IMAGE_LIMIT','会话实际图片总量超过16 MiB');refs.push({...r});
 }return refs;
}
