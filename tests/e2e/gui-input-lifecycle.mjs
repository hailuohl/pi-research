// Isolated owner-HTTP/Chrome regression; no model invocation or user data.
// PI_PLAYWRIGHT_MODULE may point to an installed Playwright module; no dependency install is needed.
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
import {configureModelManagement} from '../../dist/packages/pi-adapter/model-management.js';
import {readModelState} from '../../dist/packages/pi-adapter/model-connections.js';
import {defaultModelDefinition} from '../../dist/packages/pi-adapter/model-definition.js';

const {chromium}=await import(process.env.PI_PLAYWRIGHT_MODULE||'playwright');
const parent=resolve(process.env.PI_TEST_OUTPUT||tmpdir());mkdirSync(parent,{recursive:true});
const output=mkdtempSync(join(parent,'pi-gui-lifecycle-')),root=resolve(import.meta.dirname,'../..');
const server=createHttpServer({dataDir:join(output,'data'),repoRoot:root,port:0,computeMonitoring:false});
const evidence={console:[],pageErrors:[],httpErrors:[],requests:[],steps:[],passed:false};
let browser,page,phase='boot';
try{
 const app=server.app,edit=(action,fields)=>configureModelManagement(app.context,USER,{expectedVersion:readModelState(app.context.dataDir).version,action,...fields},crypto.randomUUID());
 await edit('provider.upsert',{provider:'gui-fixture',value:{name:'GUI fixture',baseUrl:'https://fixture.invalid/v1',api:'openai-completions',apiKey:'!FAKE_browser_fixture_key'}});
 await edit('model.upsert',{provider:'gui-fixture',model:'fixture',value:defaultModelDefinition('fixture')});
 app.sessions.configure(USER,{provider:'gui-fixture',model:'fixture',thinking:'off'});
 app.projects.create(USER,{name:'回归母项目',template:'empty'});
 const project=app.projects.create(USER,{name:'生命周期回归项目',template:'empty'}),session=app.sessions.create(USER,project.id,{title:'生命周期回归会话'});
 const artifact=app.evidence.put(project.id,'history.txt',Buffer.from('retained history'));
 const base=`http://127.0.0.1:${await server.listen()}`;
 browser=await chromium.launch({headless:true,...(process.env.PI_CHROMIUM_EXECUTABLE?{executablePath:process.env.PI_CHROMIUM_EXECUTABLE}:{})});
 page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(20000);
 page.on('console',message=>{if(message.type()==='error')evidence.console.push({phase,text:message.text()});});
 page.on('pageerror',error=>evidence.pageErrors.push(String(error)));
 page.on('request',request=>{if(/\/(permissions|attachment-types)$/.test(request.url()))evidence.requests.push({phase,url:request.url(),method:request.method()});});
 page.on('response',response=>{if(response.status()>=400)evidence.httpErrors.push({phase,url:response.url(),status:response.status()});});
 const selection={projectId:project.id,sessionId:session.id,tab:'chat'};
 await page.addInitScript(value=>{if(!localStorage.getItem('pi-research-ui-v1'))localStorage.setItem('pi-research-ui-v1',JSON.stringify(value));},selection);
 await page.goto(base);await page.getByRole('heading',{name:session.title,exact:true}).waitFor();

 phase='provider';await page.locator('summary').filter({hasText:/^管理$/}).click();
 await page.locator('.nav-list button').filter({hasText:'模型与模板'}).click();
 const providers=page.locator('nav[aria-label="模型提供商"]');await providers.getByRole('button',{name:'添加',exact:true}).click();
 const editor=page.locator('dialog.management-editor'),id=editor.getByLabel('连接提供商 ID');
 for(const value of ['bad provider','提供商','-provider','.provider','_provider']){await id.fill(value);assert.equal(await id.evaluate(input=>input.checkValidity()),false,value);}
 await id.fill('Gui.1_valid-id');assert.equal(await id.evaluate(input=>input.checkValidity()),true);
 await editor.getByLabel('连接名称').fill('回归提供商');await editor.getByLabel('连接 Base URL').fill('https://fixture.invalid/v1');await editor.getByLabel('连接 API Key').fill('!FAKE_new_provider_key');
 await editor.getByRole('button',{name:'保存连接',exact:true}).click();await providers.getByRole('button',{name:/回归提供商/}).waitFor();
 assert.equal(readModelState(app.context.dataDir).connections.some(row=>row.provider==='Gui.1_valid-id'),true);
 await page.screenshot({path:join(output,'provider.png')});await editor.getByRole('button',{name:'关闭配置编辑栏'}).click();
 assert.deepEqual(evidence.console.filter(row=>/Pattern attribute value|Invalid regular expression/.test(row.text)),[]);
 evidence.steps.push('native provider validation, save and console assertion');
 await page.evaluate(value=>localStorage.setItem('pi-research-ui-v1',JSON.stringify(value)),selection);await page.reload();
 await page.getByRole('heading',{name:session.title,exact:true}).waitFor();

 const management=page.locator('section.modal').last(),row=group=>management.locator(`section[aria-label="${group}"] li`).filter({hasText:project.name});
 phase='management';await page.getByRole('button',{name:'项目管理',exact:true}).click();await row('活动项目').waitFor();
 const reads=evidence.requests.length;await page.waitForTimeout(1700);assert.equal(evidence.requests.length,reads,'management view must suspend background permission reads');
 await row('活动项目').getByRole('button',{name:'归档',exact:true}).click();await management.getByRole('button',{name:'确认归档',exact:true}).click();
 await row('已归档项目').waitFor();phase='archived-history';await row('已归档项目').getByRole('button',{name:'打开历史',exact:true}).click();
 await page.locator('.project-readonly-notice').waitFor();await page.getByRole('heading',{name:session.title,exact:true}).waitFor();
 await page.waitForTimeout(1700);
 assert.deepEqual(evidence.requests.filter(item=>item.phase==='archived-history'&&item.url.endsWith('/attachment-types')),[]);
 assert.equal(await page.locator('.composer-control-error').count(),0,'archived history must not show a capability read failure');
 assert.equal(await page.getByRole('textbox',{name:'研究问题',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'查看历史资料',exact:true}).click();await page.locator('section[aria-label="归档项目历史"]').waitFor();
 await page.screenshot({path:join(output,'archived-history.png')});evidence.steps.push('archived read-only history without attachment request or alert');

 phase='management';await page.getByRole('button',{name:'项目管理',exact:true}).click();await row('已归档项目').waitFor();
 await row('已归档项目').getByRole('button',{name:'取消归档',exact:true}).click();await management.getByRole('button',{name:'确认取消归档',exact:true}).click();await row('活动项目').waitFor();
 await row('活动项目').getByRole('button',{name:'移入回收站',exact:true}).click();await management.getByRole('button',{name:'确认移入回收站',exact:true}).click();await row('回收站').waitFor();
 await row('回收站').getByRole('button',{name:'还原',exact:true}).click();await management.getByRole('button',{name:'确认还原',exact:true}).click();await row('活动项目').waitFor();
 phase='restored';await row('活动项目').getByRole('button',{name:'打开',exact:true}).click();await page.getByRole('heading',{name:session.title,exact:true}).waitFor();
 await page.waitForTimeout(1700);
 assert.ok(evidence.requests.some(item=>item.phase==='restored'&&item.url.endsWith('/attachment-types')),'restored project must resume capability reads');
 assert.equal(app.sessions.get(USER,session.id).projectId,project.id);assert.equal(app.store.get('artifact',artifact.id).projectId,project.id);
 assert.equal(app.store.get('project',project.id).status,'active');await page.screenshot({path:join(output,'restored.png')});
 assert.deepEqual(evidence.pageErrors,[]);assert.deepEqual(evidence.httpErrors,[]);assert.deepEqual(evidence.console,[]);
 evidence.steps.push('unarchive, trash and restore retain history and resume reads');evidence.passed=true;
}catch(error){evidence.error=error.stack||String(error);throw error;}
finally{
 if(page&&!evidence.passed)await page.screenshot({path:join(output,'failure.png')}).catch(()=>{});
 await browser?.close();await server.close();writeFileSync(join(output,'evidence.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify({passed:evidence.passed,output,steps:evidence.steps,error:evidence.error}));
}
