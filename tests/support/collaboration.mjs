import { USER, approve } from './research.mjs';
export const result = (extra = {}) => ({summary: 'Deterministic test fixture; not an LLM result', outcome: 'completed', artifactIds: [], evidenceIds: [], claims: [], unresolvedQuestions: [], ...extra});
export const actor = c => ({type: 'agent', projectId: c.task.projectId, sessionId: c.attempt.sessionId, role: c.task.role, taskId: c.task.id, attemptId: c.attempt.id, generation: c.attempt.generation});
export const spec = (key, extra = {}) => ({key, role: 'analyst', objective: 'Test '+key, dependencies: [], ...extra});
export function startTeam(s, tasks) {
 const p = s.app.projects.get(USER, s.project.id);
 if(!p.settings.enabled) s.app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});
 const t = s.app.teams.create(USER,s.session.id,{goal:'Regression fixture',tasks,budget:20});
 approve(s.app,t.approvalId);s.app.teams.activate(USER,t.id);return t;
}
export function acceptedSource(s, reviewed = false) {
 const t = startTeam(s,[spec('producer',{role:'implementer',critical:reviewed}),...(reviewed?[spec('reviewer',{role:'reviewer',reviewOf:'producer'})]:[])]);
 const a=s.app.teams.claim(t.id),bytes=Buffer.from('print("fixture evidence")\n');
 const artifact=s.app.evidence.put(s.project.id,'analysis.py',bytes,'text/x-python','fixture',{taskId:a.task.id});
 const evidence=s.app.evidence.register(USER,s.project.id,artifact.id,0,bytes.length,'Literal fixture source');
 s.app.teams.submit(actor(a),result({artifactIds:[artifact.id],evidenceIds:[evidence.id],claims:[{statement:'A claim under the original assumptions',evidenceIds:[evidence.id],limitations:['Fixture only']}]}));
 let review;
 if(reviewed) {review=s.app.teams.claim(t.id);s.app.teams.submit(actor(review),result({verdict:'accept'}));}
 let claim=s.app.store.list('claim',s.project.id).find(c=>c.taskId===a.task.id);
 claim=s.app.evidence.decideClaim(USER,claim.id,claim.version,'accepted');
 return {team:t,producer:a,review,artifact,evidence,claim};
}
export function change(s, source) {
 const p=s.app.changes.prepare(USER,s.project.id,{baseExperimentId:s.baseline.id,expectedRevision:1,title:'Reviewed child',hypothesis:'Fixture',changes:[{path:'analysis.py',artifactId:source.artifact.id,expectedDigest:null}]});
 approve(s.app,p.approvalId);return p;
}
