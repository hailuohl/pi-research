import {resolve} from 'node:path';
import {ensure} from '../../packages/domain/errors.js';
import {readPurgeStatus,runOfflinePurge} from '../../packages/storage/project-purge.js';
export function projectCli(args:string[],dataDir:string){
 if(args[0]!=='project')return false;const action=args[1];ensure(action==='purge'||action==='purge-status','INVALID_INPUT','使用 project purge 或 project purge-status');
 const values=new Map<string,string>(),flags=new Set<string>();for(let i=2;i<args.length;i++){const key=args[i];if(['--offline','--resume','--json'].includes(key)){ensure(!flags.has(key),'INVALID_INPUT','参数重复');flags.add(key);}else{ensure(['--project','--data','--confirm-name'].includes(key)&&!values.has(key)&&!!args[i+1]&&(key==='--confirm-name'||!args[i+1].startsWith('--')),'INVALID_INPUT','项目维护参数无效');values.set(key,args[++i]);}}
 dataDir=values.has('--data')?resolve(values.get('--data')!):dataDir;
 const projectId=values.get('--project');ensure(projectId,'PROJECT_REQUIRED','需要 --project 项目标识');
 if(action==='purge-status'){ensure(!flags.has('--resume')&&!values.has('--confirm-name'),'INVALID_INPUT','状态查看不接受清理参数');console.log(JSON.stringify(readPurgeStatus(dataDir,projectId),null,2));return true;}
 ensure(values.has('--confirm-name'),'PURGE_NAME_REQUIRED','需要 --confirm-name 精确项目名称');console.log(JSON.stringify(runOfflinePurge(dataDir,projectId,{offline:flags.has('--offline'),confirmName:values.get('--confirm-name')!,resume:flags.has('--resume')}),null,2));return true;
}
