import {randomUUID} from 'node:crypto';
import type {Actor,Row,Task} from '../domain/types.js';
import type {Store} from '../storage/store.js';
import {digest} from '../storage/store.js';
import {ensure,asError} from '../domain/errors.js';

export interface FixedReadTarget {targetId:string;kind:string;path:string;digest:string;artifactId?:string;required:boolean;read:()=>string;}
export interface FixedReviewRead {reviewId:string;reviewDigest:string;taskId:string;attemptId:string;sessionId:string;generation:number;targetId:string;readKind:string;digest:string;start:number;end:number;total:number;chunkDigest:string;callId:string;}
export interface ReadReviewIdentity {id:string;digest:string;taskId:string;}
export function fixedReviewReceipts(store:Store,pid:string,kind:string,r:ReadReviewIdentity,task:Row<Task>) {
    return store.list<FixedReviewRead>(kind,pid).filter(read=>read.reviewId===r.id&&read.reviewDigest===r.digest&&read.taskId===task.id&&read.attemptId===task.attemptId&&read.sessionId===task.sessionId&&read.generation===task.generation);
}
export function recordFixedRead(store:Store,pid:string,kind:string,actor:Actor,r:ReadReviewIdentity,target:FixedReadTarget,start:number,end:number,chunk:unknown,callId:string,errorCode:string) {
    const content=target.read();
    ensure(typeof chunk==='string'&&Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&start>=0&&end>=start&&end<=content.length&&chunk===content.slice(start,end),errorCode,'实际返回片段与固定审查目标不符');
    const id=randomUUID();store.create<FixedReviewRead>(kind,pid,{reviewId:r.id,reviewDigest:r.digest,taskId:r.taskId,attemptId:actor.attemptId!,sessionId:actor.sessionId!,generation:actor.generation!,targetId:target.targetId,readKind:target.kind,digest:target.digest,start,end,total:content.length,chunkDigest:digest(chunk),callId},id);return {reviewReadId:id};
}
export function fixedReadingChecks(targets:FixedReadTarget[],reads:Array<Row<FixedReviewRead>>) {
    return targets.filter(t=>t.required).map(target=>{
        try {
            const content=target.read(),matching=reads.filter(read=>read.targetId===target.targetId&&read.readKind===target.kind&&read.digest===target.digest&&read.total===content.length&&read.start>=0&&read.end>=read.start&&read.end<=content.length&&read.chunkDigest===digest(content.slice(read.start,read.end))).sort((a,b)=>a.start-b.start);
            const missingIntervals:Array<{start:number;end:number}>=[];let covered=0;for(const read of matching){if(read.start>covered)missingIntervals.push({start:covered,end:read.start});covered=Math.max(covered,read.end);}if(covered<content.length)missingIntervals.push({start:covered,end:content.length});
            return {targetId:target.targetId,kind:target.kind,path:target.path,digest:target.digest,total:content.length,readComplete:matching.length>0&&missingIntervals.length===0,missingIntervals};
        }catch(error){return {targetId:target.targetId,kind:target.kind,path:target.path,digest:target.digest,total:null,readComplete:false,missingIntervals:[],blockedReason:asError(error).code};}
    });
}
export function locateFixedReference(targets:FixedReadTarget[],reads:Array<Row<FixedReviewRead>>,reference:{readId:string;quote:string},label:string,prefix:string) {
    const read=reads.find(r=>r.id===reference.readId),target=read?targets.find(t=>t.targetId===read.targetId&&t.kind===read.readKind&&t.digest===read.digest):undefined;
    ensure(read&&target,`${prefix}_REFERENCE_INVALID`,`${label}: readId不属于当前attempt的成功读取`);
    const content=target.read(),chunk=content.slice(read.start,read.end),at=chunk.indexOf(reference.quote);
    ensure(content.length===read.total&&digest(chunk)===read.chunkDigest,`${prefix}_REFERENCE_INVALID`,`${label}: target=${target.targetId}固定片段已变化`);
    ensure(reference.quote.length>0&&at>=0,`${prefix}_QUOTE_INVALID`,`${label}: target=${target.targetId} quote未逐字匹配`);
    ensure(chunk.indexOf(reference.quote,at+1)<0,`${prefix}_QUOTE_INVALID`,`${label}: target=${target.targetId} quote不唯一`);return target;
}
