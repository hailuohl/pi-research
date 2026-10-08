import type {NativeRequestService} from '../../packages/pi-adapter/native-requests.js';
import {USER} from '../../packages/domain/types.js';
import {ensure} from '../../packages/domain/errors.js';
import {integer} from '../../packages/contracts/validation.js';

export function readNativeRoute(service:NativeRequestService,path:string,url:URL){
 const list=path.match(/^\/sessions\/([^/]+)\/native-requests$/),one=path.match(/^\/native-requests\/([^/]+)$/);
 if(list){ensure([...url.searchParams.keys()].every(k=>['cursor','limit'].includes(k))&&['cursor','limit'].every(k=>url.searchParams.getAll(k).length<=1),'INVALID_INPUT','原生请求目录只接受cursor/limit',400);return service.list(USER,list[1],{...(url.searchParams.has('cursor')?{cursor:integer(Number(url.searchParams.get('cursor')),'cursor',0,Number.MAX_SAFE_INTEGER)}:{}),...(url.searchParams.has('limit')?{limit:integer(Number(url.searchParams.get('limit')),'limit',1,50)}:{})});}
 if(one){ensure(url.search==='','INVALID_INPUT','原生请求详情不接受查询参数',400);return service.inspect(USER,one[1]);}
 return undefined;
}
export function writeNativeRoute(service:NativeRequestService,path:string,value:unknown,key:string,signal:AbortSignal,method:string,query:string){
 const prepare=path.match(/^\/sessions\/([^/]+)\/native-requests$/),media=path.match(/^\/sessions\/([^/]+)\/native-media$/),action=path.match(/^\/native-requests\/([^/]+)\/(decide|execute|cancel)$/);if(!prepare&&!media&&!action)return undefined;
 ensure(method==='POST'&&query==='','METHOD_NOT_ALLOWED','原生请求仅接受无查询参数POST',405);
 ensure(action?.[2]==='cancel','NATIVE_REQUEST_RETIRED','独立原生分析与原生联网已停用，请通过当前会话附件发送支持的文件。',410);
 return {result:service.cancel(USER,action[1],value)};
}
