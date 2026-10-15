import type {ResearchApp} from '../../packages/research-app.js';
import {USER} from '../../packages/domain/types.js';
import {ensure} from '../../packages/domain/errors.js';
import {object,text} from '../../packages/contracts/validation.js';
import {attachmentTypes} from '../../packages/pi-adapter/attachments.js';
import {assertProjectWritable} from '../../packages/policy/lifecycle.js';
export function attachmentRoute(app:ResearchApp,path:string,url:URL,method:string,value?:unknown,key?:string){
 const match=path.match(/^\/sessions\/([^/]+)\/(attachment-types|attachments)$/);if(!match)return undefined;
 ensure(url.search===''&&method===(match[2]==='attachment-types'?'GET':'POST'),'METHOD_NOT_ALLOWED','附件类型只接受GET，上传只接受无查询参数POST',405);
 const session=app.sessions.get(USER,match[1]);ensure(session.role==='coordinator'&&!session.taskId&&!session.teamId&&session.state!=='archived','ATTACHMENT_SCOPE_DENIED','附件上传只支持当前交互主会话',403);assertProjectWritable(app.store,session.projectId!);
 const available=attachmentTypes(app.context.dataDir,session);if(match[2]==='attachment-types')return {result:available};
 const input=object(value);ensure(Object.keys(input).every(k=>['title','mediaType','contentBase64'].includes(k)),'INVALID_INPUT','附件上传字段无效',400);
 const type=available.types.find(t=>t.mediaType===input.mediaType);ensure(type,'MODEL_ATTACHMENT_UNSUPPORTED','当前模型或适配器不支持此附件类型',409);
 const encoded=text(input.contentBase64,'contentBase64',Math.ceil(type.maxBytes/3)*4);ensure(Buffer.from(encoded,'base64').length<=type.maxBytes,'MODEL_ATTACHMENT_LIMIT','附件超过当前类型大小限制',413);
 return {result:app.documents.import(USER,session.projectId!,input as unknown as Parameters<typeof app.documents.import>[2],key!)};
}
