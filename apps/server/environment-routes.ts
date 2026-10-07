import type {ResearchApp} from '../../packages/research-app.js';
import {USER} from '../../packages/domain/types.js';
import {ensure} from '../../packages/domain/errors.js';
import {configureEnvironment,inspectEnvironment} from '../../packages/runtime/environment.js';
export function readEnvironment(app:ResearchApp,url:URL){ensure(url.search==='','INVALID_INPUT','环境变量目录不接受查询参数',400);return inspectEnvironment(app.context,USER);}
export function writeEnvironment(app:ResearchApp,url:URL,method:string,body:unknown,key:string){ensure(method==='POST'&&url.search==='','METHOD_NOT_ALLOWED','环境变量仅接受无查询参数的 POST',405);return configureEnvironment(app.context,USER,body,key);}
