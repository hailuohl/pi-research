import {performance} from 'node:perf_hooks';
import {checkCitations} from '../../dist/packages/publications/citations.js';

const [kind,countText]=process.argv.slice(2),count=Number(countText);
if(!Number.isInteger(count)||count<1||count>40000)throw Error('Invalid parser fixture count');
const tex=kind==='dense-cites'?'\\cite{one}\n'.repeat(count)+'\\bibliography{refs}':kind==='dense-ignored'?'\\relax\n'.repeat(count):['duplicate-keys','author-whitespace'].includes(kind)?'\\bibliography{refs}':null;
if(tex===null)throw Error('Unknown parser fixture');
const bib=kind==='duplicate-keys'?Array.from({length:count},()=>`@misc{one,title={${'Same title '.repeat(50)}}}`).join('\n'):kind==='author-whitespace'?Array.from({length:count},(_,i)=>`@article{k${i},title={One},author={${' '.repeat(2000)}},year=2024,doi={10.1000/one}}`).join('\n'):'@misc{one,title={One}}';
const metadata=kind==='author-whitespace'?[{artifactId:'a',paperReadId:'p',doi:'10.1000/one',title:['One'],author:[{given:'Jane',family:'Doe'}],years:[2024]}]:[];
const start=performance.now(),report=checkCitations([{path:'main.tex',content:tex},{path:'refs.bib',content:bib}],'main.tex',metadata);
console.log(JSON.stringify({kind,count,inputBytes:Buffer.byteLength(tex)+Buffer.byteLength(bib),elapsedMs:performance.now()-start,entries:report.entries.length,citations:report.citations.length,diagnostics:report.diagnostics.length,undefinedKeys:report.diagnostics.filter(d=>d.code==='UNDEFINED_KEY').length,truncated:report.truncated,literalStructure:report.literalStructure,filesScanned:report.filesScanned,limits:report.limits}));
