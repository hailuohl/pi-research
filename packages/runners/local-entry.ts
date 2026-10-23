import type {ResearchContract} from '../domain/types.js';
import {ensure} from '../domain/errors.js';
import type {LocalRuntime} from './local-runtime.js';

export const LOCAL_ENTRY_HINT='入口必须准确对应已批准源码清单中的脚本。Python 仅支持独立前置 -I、-S；Node 使用直接脚本入口。修正固定契约或整合源码后重新准备运行，不改写旧审批或失败记录。';

export function assertLocalEntry(contract:Pick<ResearchContract,'command'>,runtime:Pick<LocalRuntime,'runtimeVersion'>,files:Array<{path:string}>) {
    const python=/^Python\s/.test(runtime.runtimeVersion);
    if(!python&&!/^v\d/.test(runtime.runtimeVersion))return;
    let entryIndex=1;
    if(python)while(['-I','-S'].includes(contract.command[entryIndex]))entryIndex++;
    const entry=contract.command[entryIndex];
    ensure(entry&&!entry.startsWith('-')&&files.some(file=>file.path===entry),'LOCAL_ENTRY_INVALID',LOCAL_ENTRY_HINT,400);
}
