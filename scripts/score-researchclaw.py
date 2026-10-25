import argparse,hashlib,json,os,sys,threading
from pathlib import Path
from structai import LLMAgent
ADAPTER_SHA256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()

def max_request(create,audit):
 def request(*args,**kwargs):
  assert kwargs.get('model')=='deepseek-flash'
  kwargs['max_tokens']=32768
  kwargs['extra_body']={**kwargs.get('extra_body',{}),'thinking':{'type':'enabled'},'reasoning_effort':'max'}
  response=create(*args,**kwargs)
  usage=response.usage.model_dump() if response.usage else None
  audit.append({'requested_model':kwargs['model'],'reasoning_effort':kwargs['extra_body']['reasoning_effort'],'max_tokens':kwargs['max_tokens'],'response_model':response.model,'usage':usage,'finish_reasons':[c.finish_reason for c in response.choices]})
  for choice in response.choices:
   if hasattr(choice.message,'reasoning_content'):choice.message.reasoning_content=None
  return response
 return request

class MaxJudge(LLMAgent):
 calls=[]
 def __init__(self,*args,**kwargs):
  kwargs['max_tokens']=32768;kwargs['time_limit']=300
  super().__init__(*args,**kwargs)
  self.client.chat.completions.create=max_request(self.client.chat.completions.create,self.calls)

def self_check():
 from types import SimpleNamespace
 calls=[];seen=[]
 def fake(**kwargs):
  seen.append(kwargs);return SimpleNamespace(model='echo-model',usage=None,choices=[SimpleNamespace(finish_reason='stop',message=SimpleNamespace(content='{"score":2}',reasoning_content='{"score":99}'))])
 response=max_request(fake,calls)(model='deepseek-flash',max_tokens=500,messages=[])
 assert seen[0]['extra_body']=={'thinking':{'type':'enabled'},'reasoning_effort':'max'}
 assert seen[0]['max_tokens']==32768 and calls[0]['response_model']=='echo-model'
 assert response.choices[0].message.content=='{"score":2}' and response.choices[0].message.reasoning_content is None
 print('MAX_JUDGE_SELF_CHECK_OK')

if __name__=='__main__':
 if '--self-check' in sys.argv:self_check();sys.exit(0)
 p=argparse.ArgumentParser();p.add_argument('--benchmark-root',required=True);p.add_argument('--model-config',required=True);p.add_argument('--workspace');p.add_argument('--probe',action='store_true');a=p.parse_args()
 root=Path(a.benchmark_root)
 config=json.loads(Path(a.model_config).read_text('utf-8'));connection=next(c for c in config['connections'] if c['provider']=='deepseek' and c.get('enabled',True) and not c.get('deletedAt'))
 os.environ.update(JUDGE_API_KEY=connection['apiKey'],JUDGE_API_BASE=connection['baseUrl'],JUDGE_MODEL_NAME='deepseek-flash')
 if a.probe:
  agent=MaxJudge(api_key=connection['apiKey'],api_base=connection['baseUrl'],model_version='deepseek-flash',temperature=0,max_tokens=500,max_try=1)
  result=agent('API configuration self-check. Read the image then return JSON {"reasoning":"red square","score":7}.',image_paths=['judge-probe.png'],return_example={'reasoning':'str','score':0},max_try=1)
  assert isinstance(result,dict) and result.get('score')==7
  Path('judge-max-probe.json').write_text(json.dumps({'parsed':result,'requests':MaxJudge.calls},indent=2),encoding='utf-8');print(json.dumps({'probe':'pass','requests':MaxJudge.calls}));sys.exit(0)
 workspace=Path(a.workspace)
 report_path=workspace/'report'/'report.md'
 report_hash_before=hashlib.sha256(report_path.read_bytes()).hexdigest() if report_path.is_file() else None
 sys.path.insert(0,str(root));import evaluation.score as official
 official.LLMAgent=MaxJudge
 try:
  result=official.score_workspace(workspace)
  failures=[x['index'] for x in result.get('items',[]) if x.get('reasoning') in ('Scoring failed.','Failed to parse scoring response.')]
  clipped=any('length' in c['finish_reasons'] for c in MaxJudge.calls)
  status='failed' if result.get('error') or failures or clipped else 'completed'
  meta={'status':status,'requested_model':'deepseek-flash','requested_reasoning_effort':'max','official_scorer_sha256':hashlib.sha256((root/'evaluation'/'score.py').read_bytes()).hexdigest(),'adapter':'LLMAgent max request parameters and final-content-only parsing; official rubric, criteria, weights, image selection and aggregation unchanged','max_tokens':32768,'item_count':len(result.get('items',[])),'failed_items':failures,'score':result.get('total_score') if status=='completed' else None,'error':result.get('error'),'requests':MaxJudge.calls}
 except Exception as e:
  meta={'status':'failed','requested_model':'deepseek-flash','requested_reasoning_effort':'max','error_type':type(e).__name__,'score':None,'requests':MaxJudge.calls}
 meta['adapter_sha256']=ADAPTER_SHA256
 meta['report_sha256']=report_hash_before
 meta['scored_at']=__import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat()
 if report_hash_before is not None and hashlib.sha256(report_path.read_bytes()).hexdigest()!=report_hash_before:
  meta.update(status='failed',score=None,error='REPORT_CHANGED_DURING_SCORING')
 (workspace/'_score-status.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
 evaluation_path=workspace.parent/'evaluation.json'
 if evaluation_path.is_file():
  evaluation=json.loads(evaluation_path.read_text('utf-8'));evaluation['officialScoring']={k:v for k,v in meta.items() if k!='requests'}
  evaluation_path.write_text(json.dumps(evaluation,indent=2),encoding='utf-8')
 run_meta_path=workspace/'_meta.json'
 if run_meta_path.is_file():
  run_meta=json.loads(run_meta_path.read_text('utf-8'));run_meta['scoring_status']=meta['status'];run_meta_path.write_text(json.dumps(run_meta,indent=2),encoding='utf-8')
 print(json.dumps({'workspace':str(workspace),'judge_status':meta['status'],'score':meta['score'],'item_count':meta.get('item_count')}))
