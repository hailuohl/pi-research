// Deterministic IPC fixture; no model requests or scientific conclusions.
import {writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
process.on('message',input=>{
 if(input.type!=='start')return;
 mkdirSync(input.sessionDir,{recursive:true});const sessionFile=join(input.sessionDir,'analysis-fixture.jsonl');
 writeFileSync(sessionFile,JSON.stringify({type:'session',version:3,id:'fixture',cwd:input.workspace,timestamp:new Date().toISOString()})+'\n');
 process.send({type:'ready',sessionFile,model:{provider:input.model.provider,id:input.model.model}});
 process.send({type:'assistant_message',content:JSON.stringify({fixture:true,history:input.history,piSessionPath:input.piSessionPath,hostMessages:input.hostMessages,sessionDir:input.sessionDir,tools:input.tools.map(t=>t.name)}),stopReason:'stop'});
 process.send({type:'done',sessionFile});
});
