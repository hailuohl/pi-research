import {ensure,DomainError} from '../domain/errors.js';
import {digest} from '../storage/store.js';
import {atPointer,type PairedPlanQuantitative,type ClosedPairedQuantitative} from './method-contracts.js';

const MAX_BYTES=2*1024*1024,MAX_ROWS=100000,DISTINCT_LIMIT=32;
type Decimal={coefficient:bigint;exponent:number;key:string;};
function decimal(cell:string):Decimal|'missing'|'nonNumeric'|'nonFinite' {
    const v=cell.trim();if(!v)return 'missing';if(/^[+-]?(?:nan|inf(?:inity)?)$/i.test(v))return 'nonFinite';
    const m=/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/.exec(v);if(!m)return 'nonNumeric';
    const digits=(m[2]??'')+(m[3]??m[4]??''),exp=Number(m[5]??0)-(m[3]??m[4]??'').length;
    ensure(digits.length<=100&&Number.isSafeInteger(exp)&&Math.abs(exp)<=400,'FORMAL_INPUT_NUMERIC_UNSUPPORTED','数值精度/指数超出受支持范围');
    const n=Number(v);if(!Number.isFinite(n))return 'nonFinite';let coefficient=BigInt(digits)*(m[1]==='-'?-1n:1n),exponent=exp;
    ensure(coefficient===0n||n!==0,'FORMAL_INPUT_NUMERIC_UNSUPPORTED','非零十进制数超出有限数值范围');
    if(coefficient===0n)exponent=0;else while(coefficient%10n===0n){coefficient/=10n;exponent++;}
    return {coefficient,exponent,key:exponent===0?String(coefficient):`${coefficient}e${exponent}`};
}
function compare(a:Decimal,b:Decimal){const exponent=Math.min(a.exponent,b.exponent),left=a.coefficient*10n**BigInt(a.exponent-exponent),right=b.coefficient*10n**BigInt(b.exponent-exponent);return left<right?-1:left>right?1:0;}
function cells(line:string,delimiter:string):string[] {
    const result:string[]=[];let cell='',quoted=false,closed=false;
    for(let i=0;i<line.length;i++){const c=line[i];if(quoted){if(c==='"'){if(line[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;}
        else if(c===delimiter){result.push(cell);cell='';closed=false;}else if(c==='"'){ensure(!cell&&!closed,'FORMAL_INPUT_FORMAT_UNSUPPORTED','不支持未转义引号');quoted=true;}else{ensure(!closed,'FORMAL_INPUT_FORMAT_UNSUPPORTED','闭合引号后只能是分隔符');cell+=c;}}
    ensure(!quoted,'FORMAL_INPUT_FORMAT_UNSUPPORTED','不支持跨行/未闭合的引号字段');result.push(cell);return result;
}
function table(bytes:Buffer,predictor:string,outcome:string) {
    ensure(bytes.length<=MAX_BYTES&&!bytes.includes(0),'FORMAL_INPUT_FORMAT_UNSUPPORTED','固定数值表须为最多2MiB的UTF-8文本');
    let content:string;try{content=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new DomainError('FORMAL_INPUT_FORMAT_UNSUPPORTED','固定数值表不是UTF-8');}
    const lines=content.replaceAll('\r\n','\n').split('\n');if(lines.at(-1)==='')lines.pop();ensure(lines.length>=2&&lines.length<=MAX_ROWS+1&&!lines.some(l=>l.includes('\r')||l===''),'FORMAL_INPUT_FORMAT_UNSUPPORTED','表格含空行/不支持的换行或超出100000行');
    const candidates:Array<{delimiter:string;headers:string[];rows:string[][]}>=[];
    for(const delimiter of [',',';','\t'])try{const headers=cells(lines[0],delimiter),rows=lines.slice(1).map(line=>cells(line,delimiter));if(headers.length>=2&&headers.every(h=>h.length>0)&&new Set(headers).size===headers.length&&headers.includes(predictor)&&headers.includes(outcome)&&rows.every(r=>r.length===headers.length))candidates.push({delimiter,headers,rows});}catch(error){if(!(error instanceof DomainError))throw error;}
    ensure(candidates.length===1,'FORMAL_INPUT_FORMAT_UNSUPPORTED','需要唯一可确定表头/字段及全行列数的逗号、分号或tab方言；歧义/复杂格式不支持');return candidates[0];
}
function statistics(headers:string[],rows:string[][]) {
    return headers.map((name,index)=>{let missing=0,nonNumeric=0,nonFinite=0,finiteCount=0,integerCount=0;let min:Decimal|undefined,max:Decimal|undefined;const values=new Map<string,Decimal>();
        for(const row of rows){const d=decimal(row[index]);if(typeof d==='string'){if(d==='missing')missing++;else if(d==='nonNumeric')nonNumeric++;else nonFinite++;continue;}finiteCount++;if(d.coefficient===0n||d.exponent>=0)integerCount++;if(!min||compare(d,min)<0)min=d;if(!max||compare(d,max)>0)max=d;values.set(d.key,d);}
        return {name,missing,nonNumeric,nonFinite,finiteCount,integerCount,nonIntegerCount:finiteCount-integerCount,min:min?.key??null,max:max?.key??null,distinctCount:values.size,distinctValues:values.size<=DISTINCT_LIMIT?[...values.values()].sort(compare).map(d=>d.key):null};});
}
export interface FormalFactsBinding {runId:string;manifestDigest:string;sourceDigest:string;inputPath:string;inputDigest:string;methodContractDigest:string;ledgerDigest:string;witnessArtifactRefs:Array<{id:string;path:string;digest:string;size:number}>;}
export function computeFormalInputFacts(bytes:Buffer,q:PairedPlanQuantitative|ClosedPairedQuantitative,binding:FormalFactsBinding,witness:unknown,fit:unknown) {
    ensure(digest(bytes)===binding.inputDigest&&binding.inputPath===q.plan.formalInput.path&&binding.inputDigest===q.plan.formalInput.digest,'FORMAL_INPUT_CHANGED','事实输入不是原Run固定的正式输入');
    const {delimiter,headers,rows}=table(bytes,q.plan.formalInput.predictorField,q.plan.formalInput.outcomeField),seen=new Set<string>(),unique=rows.filter(row=>{const key=JSON.stringify(row);if(seen.has(key))return false;seen.add(key);return true;}),deduplicated=q.plan.preprocessing.duplicates==='drop-exact'?unique:rows;
    const included=deduplicated.filter(row=>!row.some(cell=>decimal(cell)==='missing')),missingRows=deduplicated.length-included.length,processed=q.plan.preprocessing.missing==='drop-complete-case'?included:deduplicated;
    const rawColumns=statistics(headers,rows),processedColumns=statistics(headers,processed),policySatisfied=(q.plan.preprocessing.missing!=='reject'||missingRows===0)&&processedColumns.every(c=>c.nonNumeric===0&&c.nonFinite===0&&c.missing===0);
    const records=atPointer(witness,q.witness.recordsPointer);ensure(Array.isArray(records)&&records.every(r=>r&&typeof r==='object'&&typeof r[q.witness.idField]==='string'),'FORMAL_INPUT_WITNESS_INVALID','正式见证缺少稳定test ID');
    const train=(fit as {trainRowIds?:unknown})?.trainRowIds;ensure(Array.isArray(train)&&train.every(id=>typeof id==='string'),'FORMAL_INPUT_WITNESS_INVALID','正式拟合见证缺少trainRowIds');const test=records.map(r=>r[q.witness.idField] as string),trainIds=new Set(train),testIds=new Set(test);
    return {factsVersion:'formal-input-facts-v1' as const,...binding,parserProfile:{id:'simple-numeric-table-v1',delimiter,decimalEncoding:'exact-normalized-decimal-string-v1',distinctLimit:DISTINCT_LIMIT},columnNames:headers,raw:{source:'fixed-input-cells' as const,rows:rows.length,columns:rawColumns,response:rawColumns.find(c=>c.name===q.plan.formalInput.outcomeField)!},processed:{source:'fixed-input-and-frozen-preprocessing' as const,preprocessing:q.plan.preprocessing,duplicateEquality:'decoded-complete-cell-text-tuple' as const,uniqueRows:unique.length,duplicateRows:rows.length-unique.length,rows:processed.length,excludedMissingRows:q.plan.preprocessing.missing==='drop-complete-case'?missingRows:0,policySatisfied,columns:processedColumns,response:processedColumns.find(c=>c.name===q.plan.formalInput.outcomeField)!},runWitness:{source:'actual-run-archived-witness' as const,trainRows:train.length,testRows:test.length,trainUnique:trainIds.size===train.length,testUnique:testIds.size===test.length,disjoint:train.every(id=>!testIds.has(id)),countsMatchProcessed:train.length+test.length===processed.length,membership:'not-reconstructed' as const},limitation:'只读固定输入的质量统计、冻结预处理计数和实际归档见证计数；不训练、不重fit、不证明完整membership、IID或报告自由文字正确。采集方式不等于实际观测值。'};
}
export type FormalInputFacts=ReturnType<typeof computeFormalInputFacts>;
export function renderFormalInputFacts(f:FormalInputFacts){return `# 正式输入数据质量事实\n\nRun: ${f.runId}\n固定输入: ${f.inputPath} / ${f.inputDigest}\n事实版本: ${f.factsVersion}\n\n原始输入（fixed-input-cells）：rows=${f.raw.rows}；响应 ${JSON.stringify(f.raw.response)}。\n\n预处理（fixed-input-and-frozen-preprocessing）：uniqueRows=${f.processed.uniqueRows}；duplicateRows=${f.processed.duplicateRows}；rows=${f.processed.rows}；响应 ${JSON.stringify(f.processed.response)}。完全相同记录按解码后的完整cell文本tuple，3与3.0不自动合并。\n\n实际Run见证：${JSON.stringify(f.runWitness)}\n\n十进制事实值使用精确规范字符串，不经浮点舍入判整数。${f.limitation}\n`;}
