import assert from 'node:assert/strict';

/** UNIT state-machine fixture only: this is not proof of the SDK tool_execution_end transport. */
export function acknowledgeWorkspaceRead(app,actor,result){
 const id=result?.draftReadId??result?.sourceInputReadId;if(!id)return result;
 const kind=result.draftReadId?'workspace-draft-read':'research-input-read',service=result.draftReadId?app.draftReads:app.sourceInputs,row=app.store.get(kind,id,actor.projectId);
 if(row.delivery==='pending'&&!row.replayed&&!row.offered)app.store.transaction(()=>{assert.equal(service.offer(actor,id,row.callId),true);service.deliver(actor,id,row.callId);});
 return result;
}
