import {USER} from './research.mjs';
import {configureModelManagement} from '../../dist/packages/pi-adapter/model-management.js';
import {readModelState} from '../../dist/packages/pi-adapter/model-connections.js';
import {defaultModelDefinition} from '../../dist/packages/pi-adapter/model-definition.js';
export async function configured(s){
 const edit=(action,fields)=>configureModelManagement(s.app.context,USER,{expectedVersion:readModelState(s.dir).version,action,...fields},crypto.randomUUID());
 await edit('provider.upsert',{provider:'thinking-fixture',value:{name:'Offline fixture',api:'openai-completions',baseUrl:'https://fixture.invalid/v1',apiKey:'!FAKE_only_fixture'}});
 const definition={...defaultModelDefinition('custom-model'),parameters:{temperature:0.25,reasoning_effort:'default'},reasoning:{defaultLevel:'careful',levels:[{id:'careful',label:'Careful',piLevel:'high',parameters:{reasoning_effort:'ultra'}},{id:'quick',label:'Quick',piLevel:'off',parameters:{reasoning_effort:'none'}}]}};
 await edit('model.upsert',{provider:'thinking-fixture',model:'custom-model',value:definition});
 const model={provider:'thinking-fixture',model:'custom-model',thinking:'careful'};
 s.app.store.update('session',s.session.id,s.app.store.get('session',s.session.id).version,{model});
 const policy={schemaVersion:1,provider:model.provider,model:model.model,restoreEpoch:0,candidates:[{id:'quick',purpose:'Bounded direct lookup'},{id:'careful',purpose:'Coupled correctness or independent review'}]};
 const save=(value=policy,expectedPolicyVersion=0)=>edit('model.thinking-policy',{provider:model.provider,model:model.model,expectedPolicyVersion,value});
 return {edit,definition,model,policy,save};
}
