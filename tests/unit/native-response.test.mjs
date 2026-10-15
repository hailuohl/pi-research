import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNativeResponse} from '../../dist/packages/pi-adapter/native-response.js';
test('Responses retains actual search call, sources, citations and usage',()=>{
 const result=parseNativeResponse('openai-responses',{id:'resp_fixture',status:'completed',output:[{type:'web_search_call',id:'search_fixture',status:'completed',action:{query:'test query',sources:[{url:'https://example.org/paper',title:'Paper'}]}},{type:'message',content:[{type:'output_text',text:'A source-backed answer',annotations:[{type:'url_citation',url:'https://example.org/paper',title:'Paper',start_index:2,end_index:8}]}]}],usage:{input_tokens:11,output_tokens:4,output_tokens_details:{reasoning_tokens:2}}});
 assert.equal(result.status,'completed');assert.equal(result.searchCalls[0].query,'test query');assert.equal(result.searchCalls[0].sources[0].title,'Paper');assert.equal(result.citations[0].startIndex,2);assert.equal(result.usage.output_reasoning_tokens,2);assert.equal(result.responseId,'resp_fixture');
});
test('Chat preserves citations without claiming a full search transcript',()=>{
 const result=parseNativeResponse('openai-completions',{choices:[{finish_reason:'stop',message:{content:'Answer',annotations:[{type:'url_citation',url_citation:{url:'https://example.org',title:'Example'}}]}}],usage:{prompt_tokens:2}});
 assert.equal(result.status,'completed');assert.equal(result.searchCalls[0].status,'citations-returned');assert.equal(result.usage.prompt_tokens,2);
});
test('multiple Responses text blocks keep citation offsets and modern search queries',()=>{
 const result=parseNativeResponse('openai-responses',{status:'completed',output:[{type:'web_search_call',status:'completed',action:{type:'search',queries:['first','second']}},{type:'message',content:[{type:'output_text',text:'First. ',annotations:[]},{type:'output_text',text:'Second.',annotations:[{type:'url_citation',url:'https://example.org',start_index:0,end_index:6}]}]}]});
 assert.deepEqual(result.searchCalls[0].queries,['first','second']);assert.equal(result.citations[0].startIndex,7);assert.equal(result.citations[0].endIndex,13);
});
test('Anthropic pause preserves exact native continuation and search receipt',()=>{
 const blocks=[{type:'server_tool_use',id:'srv_1',name:'web_search',input:{query:'evidence'}},{type:'web_search_tool_result',tool_use_id:'srv_1',content:[{type:'web_search_result',url:'https://example.org',title:'Example',encrypted_content:'opaque-fixture'}]}];
 const result=parseNativeResponse('anthropic-messages',{id:'msg_fixture',content:blocks,stop_reason:'pause_turn',usage:{input_tokens:3,server_tool_use:{web_search_requests:1}}});
 assert.equal(result.status,'incomplete');assert.deepEqual(result.continuation,blocks);assert.equal(result.searchCalls[0].status,'completed');assert.equal(result.usage.server_web_search_requests,1);
});
test('search tool errors and truncated responses cannot be called complete',()=>{
 const result=parseNativeResponse('anthropic-messages',{content:[{type:'server_tool_use',id:'srv_1',name:'web_search',input:{query:'test'}},{type:'web_search_tool_result',tool_use_id:'srv_1',content:{type:'web_search_tool_result_error',error_code:'max_uses_exceeded'}},{type:'text',text:'Partial',citations:[]}],stop_reason:'end_turn'});
 assert.equal(result.status,'incomplete');assert.equal(result.searchCalls[0].error,'max_uses_exceeded');
 assert.equal(parseNativeResponse('openai-completions',{choices:[{finish_reason:'length',message:{content:'Truncated'}}]}).status,'incomplete');
});
test('unsafe or credential-bearing links are omitted and outputs are redacted',()=>{
 const redact=text=>text.split('fixture-protected-value').join('[hidden]');
 const result=parseNativeResponse('anthropic-messages',{content:[{type:'text',text:'fixture-protected-value',citations:[{url:'javascript:alert(1)'},{url:'https://user:pass@example.org'},{url:'https://example.org/fixture-protected-value'},{url:'https://example.org/safe',title:'fixture-protected-value'}]}],stop_reason:'pause_turn'},redact);
 assert.equal(result.text,'[hidden]');assert.equal(result.citations.length,1);assert.equal(result.citations[0].title,'[hidden]');assert.equal(result.continuation,undefined);assert.ok(result.continuationUnavailable);
});
test('unsupported native server tools are not replayable and remain incomplete',()=>{
 const result=parseNativeResponse('anthropic-messages',{content:[{type:'server_tool_use',name:'code_execution',id:'other',input:{}},{type:'text',text:'Untrusted tool output'}],stop_reason:'pause_turn'});
 assert.equal(result.status,'incomplete');assert.equal(result.continuation,undefined);
});
test('malformed and over-limit replies fail rather than fabricating success',()=>{
 assert.throws(()=>parseNativeResponse('openai-completions',{choices:[]}),/一个答案/);
 assert.throws(()=>parseNativeResponse('openai-responses',{status:'completed',output:[]}),/未返回/);
 assert.throws(()=>parseNativeResponse('openai-completions',{choices:[{finish_reason:'stop',message:{content:'x'.repeat(128001)}}]}),/128000/);
});
