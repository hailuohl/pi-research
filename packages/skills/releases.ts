// Maintainer-generated trusted archive index. Historical text stays in its frozen files.
import {readFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ensure} from '../domain/errors.js';
import type {Role} from '../domain/types.js';
import type {SkillPrerequisite,MethodRequirement} from './types.js';

interface ArchivedSkill {
 id:string;name:string;description:string;path:string;digest:string;roles:readonly Role[];
 resources:readonly {path:string;digest:string;methodRequirements?:readonly MethodRequirement[]}[];
 source?:{repository:string;commit:string;path:string;blob:string};
 prerequisites?:readonly SkillPrerequisite[];
}
interface ArchivedRelease {bundleId:string;manifestDigest:string;skills:readonly ArchivedSkill[]}
const index:readonly {bundleId:string;manifestDigest:string;fileDigest:string}[]=[];
export const BUILTIN_RELEASES:readonly ArchivedRelease[] = index.map(entry=>({
 bundleId:entry.bundleId,
 get skills(){
  const base=new URL('../../../skills/releases/',import.meta.url);
  for(const path of [new URL('../',base),base,new URL(entry.bundleId+'/',base),new URL(entry.bundleId+'/manifest.json',base)])ensure(!lstatSync(path).isSymbolicLink(),'SKILL_PATH_DENIED','技能发行路径不能包含符号链接');
  const bytes=readFileSync(new URL(entry.bundleId+'/manifest.json',base));
  ensure(createHash('sha256').update(bytes).digest('hex')===entry.fileDigest,'SKILL_INTEGRITY_FAILED','内置技能发行元数据摘要不匹配');
  return (JSON.parse(bytes.toString('utf8')) as ArchivedRelease).skills;
 },
 manifestDigest:entry.manifestDigest,
}));
