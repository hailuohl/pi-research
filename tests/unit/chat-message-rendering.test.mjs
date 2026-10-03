import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';

const {SessionHistory,ConversationActivity}=await import('../../dist/web/assets/session-history.js');
const {MessageMarkdown}=await import('../../dist/web/assets/message-markdown.js');
const history=messages=>renderToStaticMarkup(new SessionHistory({projectId:'p',sessionId:'s',messages,history:null,historyAnchor:null,onNavigate(){},perform(){}}).render());
const message=(id,content,extra={})=>({id,projectId:'p',sessionId:'s',version:1,createdAt:'2026-10-03T00:00:00.000Z',updatedAt:'2026-10-03T00:00:00.000Z',role:'assistant',mode:'prompt',status:'completed',content,...extra});

test('assistant commentary folds into work details while final Markdown stays visible and empty success leaves no bubble',()=>{
    const html=history([
        message('commentary','先检查输入。',{generation:4,phase:'commentary',toolCalls:['read','bash --token=private']}),
        message('answer','# 答案标题\n\n**结论**：可以继续。',{generation:4,phase:'final_answer'}),
        message('empty','',{generation:5,phase:'final_answer'}),
    ]);
    assert.match(html,/<details class="workflow-history">/);
    assert.match(html,/工作详情 · 1 条过程消息/);
    assert.match(html,/涉及工具：读取文件、工具调用/);
    assert.match(html,/<h1>答案标题<\/h1>/);
    assert.match(html,/<strong>结论<\/strong>/);
    assert.doesNotMatch(html,/答案标题[\s\S]*?<\/details>/);
    assert.doesNotMatch(html,/本次响应没有可展示的文本/);
    assert.doesNotMatch(html,/message-assistant"[^>]*>[\s\S]*?private/);
});

test('generations and user messages stop assistant grouping; legacy turns keep the last nonempty answer',()=>{
    const html=history([
        message('old-work','旧过程'),message('old-answer','旧答案'),
        message('new-work','新过程',{generation:2,phase:'commentary'}),
        message('new-answer','新答案',{generation:2,phase:'final_answer'}),
        { ...message('user','用户插话'),role:'user' },
        message('after-user','插话后的过程',{generation:2,phase:'commentary'}),
    ]);
    assert.equal((html.match(/<details class="workflow-history"/g)??[]).length,3);
    assert.match(html,/<strong>你<\/strong>/);
    assert.match(html,/旧答案/);
    assert.match(html,/新答案/);
    const legacy=html.match(/<details class="workflow-history">([\s\S]*?)<\/details>/)?.[1]??'';
    assert.match(legacy,/旧过程/);
    assert.doesNotMatch(legacy,/旧答案/);
});

test('failed, cancelled, and errored messages stay visible outside collapsed work details',()=>{
    const html=history([
        message('work','普通过程',{generation:1,phase:'commentary'}),
        message('failure','工具调用失败',{generation:1,phase:'commentary',status:'failed',error:'权限不足'}),
        message('cancelled','已取消',{generation:2,phase:'commentary',status:'cancelled'}),
        message('errored','有诊断',{generation:3,phase:'commentary',error:'unexpected'}),
        message('empty-failure','',{generation:4,phase:'final_answer',status:'failed'}),
        message('empty-running','',{generation:5,phase:'final_answer',status:'running'}),
    ]);
    assert.match(html,/工具调用失败/);
    assert.match(html,/权限不足/);
    assert.match(html,/已取消/);
    assert.match(html,/unexpected/);
    assert.match(html,/运行中/);
    assert.equal((html.match(/<details class="workflow-history"/g)??[]).length,1);
    assert.equal((html.match(/<article class="message message-assistant"/g)??[]).length,6);
});

test('known project tool prefixes get concise Chinese labels and unknown safe names stay parameter-free',()=>{
    const html=history([message('tools','过程',{generation:1,phase:'commentary',toolCalls:['project_inspect','workspace_list','research_brief_read','run_execute','publication_build','literature_search','custom.lookup','bash --token=secret']})]);
    assert.match(html,/项目查看、浏览项目文件、研究计划、实验操作、论文操作、文献查询、custom\.lookup、工具调用/);
    assert.doesNotMatch(html,/--token=secret/);
});

test('unsafe Markdown URLs and raw HTML remain inert while normal links and tables render',()=>{
    const html=renderToStaticMarkup(MessageMarkdown({content:[
        '[正常链接](https://example.org/path) [站内](\/docs?q=1) [锚点](#section) [邮件](mailto:team@example.org)',
        '[脚本](javascript:alert%281%29) [协议相对](//evil.example/x) [文件](file:///secret) [反斜线](\\\\evil.example/path)',
        '![远程图片](https://evil.example/image.png)',
        '<img src=x onerror=alert(1)>',
        '<script>alert(1)</script>',
        '| 名称 | 值 |\n| --- | ---: |\n| A | 3 |',
    ].join('\n\n')}));
    assert.match(html,/href="https:\/\/example\.org\/path"/);
    assert.match(html,/href="\/docs\?q=1"/);
    assert.match(html,/href="#section"/);
    assert.match(html,/href="mailto:team@example\.org"/);
    assert.doesNotMatch(html,/href="(?:javascript|data|file):|href="\/\/|src="https:\/\/evil/i);
    assert.match(html,/图片：远程图片（未自动加载）/);
    assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.match(html,/class="message-table-scroll"/);
    assert.match(html,/<table>/);
});

test('system notifications fold to one-line summaries unless they report failure or an error',()=>{
    const html=history([
        {...message('notice','任务已经结束。后面还有详情。',{role:'system'}),wakeupId:'w1'},
        {...message('notice-error','任务未完成。请检查。',{role:'system',status:'failed',error:'worker failed'}),wakeupId:'w2'},
    ]);
    assert.match(html,/<details class="notification-history"><summary><span>状态通知<\/span><span>任务已经结束。…<\/span><\/summary>/);
    assert.match(html,/worker failed/);
    assert.equal((html.match(/<details class="notification-history"/g)??[]).length,1);
    assert.match(html,/持久化结果通知/);
});

test('live activity shows the current tool and stream, then disappears when inactive',()=>{
    const active=renderToStaticMarkup(ConversationActivity({content:'正在整理 **结果**',active:true,activity:{tool:'bash',status:'running'},truncated:true}));
    assert.match(active,/正在调用 运行命令/);
    assert.match(active,/<strong>结果<\/strong>/);
    assert.match(active,/较早部分已省略/);
    const thinking=renderToStaticMarkup(ConversationActivity({content:'',active:true}));
    assert.match(thinking,/正在思考…/);
    assert.equal(renderToStaticMarkup(ConversationActivity({content:'已结束的流',active:false,activity:{tool:'bash',status:'completed'}})),'');
});
