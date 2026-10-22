import * as React from 'react';
import type {ModelConfig,ModelManagementView,Row,Session} from './models.js';
import {Icon} from './ui.js';
const key=(model?:ModelConfig)=>JSON.stringify(model?[model.provider,model.model,model.thinking,model.restoreEpoch??0]:null);
interface Props {
    sessionId:string;current?:ModelConfig;management?:ModelManagementView|null;error?:string;
    disabled:boolean;busy:boolean;locked:boolean;onSelect:(model:ModelConfig)=>Promise<Row<Session>|undefined>;
}
interface State {open:boolean;modelsOpen:boolean;saving:boolean;preview:number|null;visual:number|null;dragging:boolean;pointer:boolean;error:string;}
export class ComposerModelMenu extends React.Component<Props,State> {
    state:State={open:false,modelsOpen:false,saving:false,preview:null,visual:null,dragging:false,pointer:false,error:''};
    private alive=true;private trigger=React.createRef<HTMLButtonElement>();private menu=React.createRef<HTMLDivElement>();
    private range=React.createRef<HTMLInputElement>();
    private pointerStart?:{id:number;x:number};private pending?:{sessionId:string;selection:ModelConfig};private confirmedSelection?:ModelConfig;
    componentDidMount(){window.addEventListener('resize',this.position);window.addEventListener('scroll',this.position,true);}
    componentWillUnmount(){this.alive=false;window.removeEventListener('resize',this.position);window.removeEventListener('scroll',this.position,true);}
    private models=()=>this.props.management?.providers.filter(p=>p.enabled&&!p.deletedAt&&!p.requiresCredential).flatMap(provider=>provider.models.filter(m=>m.enabled&&!m.deletedAt).map(model=>({provider,model})))??[];
    private selected=()=>this.models().find(row=>row.provider.provider===this.props.current?.provider&&row.model.model===this.props.current?.model&&(row.model.restoreEpoch??0)===(this.props.current?.restoreEpoch??0));
    private unavailable=()=>!this.props.management||!!this.props.error;
    private blocked=()=>!this.alive||this.props.disabled||this.props.locked||this.props.busy||this.state.saving||!!this.pending||this.unavailable();
    componentDidUpdate(previous:Readonly<Props>){
        const changed=previous.sessionId!==this.props.sessionId,currentChanged=key(previous.current)!==key(this.props.current),expected=this.pending?.selection??this.confirmedSelection;
        if(changed){this.pending=undefined;this.confirmedSelection=undefined;this.setState({saving:false,error:''});this.close();}
        else if(this.props.disabled||this.props.locked||this.unavailable()||this.props.busy&&!this.state.saving)this.close();
        else if(currentChanged&&(!expected||key(expected)!==key(this.props.current)))this.close();
        if(currentChanged)this.confirmedSelection=undefined;
        if(previous.management!==this.props.management&&this.state.open){
            const target=this.pending?.selection??this.props.current;
            if(target&&!this.models().some(row=>row.provider.provider===target.provider&&row.model.model===target.model&&(row.model.restoreEpoch??0)===(target.restoreEpoch??0)&&row.model.reasoning.levels.some(level=>level.id===target.thinking)))this.close();
            const old=previous.management?.providers.find(p=>p.provider===this.props.current?.provider)?.models.find(m=>m.model===this.props.current?.model);
            if(JSON.stringify(old?.reasoning.levels.map(level=>level.id))!==JSON.stringify(this.selected()?.model.reasoning.levels.map(level=>level.id)))this.resetPreview();
        }
        if(this.state.open)this.position();
    }
    private position=()=>{
        const menu=this.menu.current,trigger=this.trigger.current;if(!menu?.matches(':popover-open')||!trigger)return;
        const width=document.documentElement.clientWidth,height=window.innerHeight;menu.style.width=Math.max(0,Math.min(320,width-32))+'px';
        const r=trigger.getBoundingClientRect(),m=menu.getBoundingClientRect();menu.style.left=Math.max(16,Math.min(r.left+r.width/2-m.width/2,width-m.width-16))+'px';
        menu.style.top=Math.max(16,Math.min(r.top-m.height-8,height-m.height-16))+'px';
    };
    private resetPreview=()=>{this.pointerStart=undefined;if(this.state.preview!==null||this.state.visual!==null||this.state.pointer||this.state.dragging)this.setState({preview:null,visual:null,pointer:false,dragging:false});};
    private close=()=>{this.resetPreview();if(this.menu.current?.matches(':popover-open'))this.menu.current.hidePopover();if(this.state.open)this.setState({open:false,modelsOpen:false});};
    private keys=(event:React.KeyboardEvent<HTMLDivElement>)=>{
        if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.close();this.trigger.current?.focus({preventScroll:true});return;}
        if((event.target as HTMLElement).tagName==='INPUT'||!this.state.modelsOpen||!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
        event.preventDefault();const items=Array.from(this.menu.current?.querySelectorAll<HTMLButtonElement>('button[role="menuitemradio"]:not(:disabled)')??[]);if(!items.length)return;
        const current=items.indexOf(document.activeElement as HTMLButtonElement),next=event.key==='Home'?0:event.key==='End'?items.length-1:(current+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next].focus({preventScroll:true});
    };
    private choose=async(model:ModelConfig)=>{
        if(this.blocked()||!this.models().some(row=>row.provider.provider===model.provider&&row.model.model===model.model&&(row.model.restoreEpoch??0)===(model.restoreEpoch??0)&&row.model.reasoning.levels.some(level=>level.id===model.thinking)))return;
        this.pointerStart=undefined;this.setState({modelsOpen:false,error:'',pointer:false,dragging:false});if(key(model)===key(this.props.current)){this.resetPreview();return;}
        if(this.state.preview!==null)this.setState({preview:Math.round(this.state.preview)});
        const request={sessionId:this.props.sessionId,selection:model};this.pending=request;this.confirmedSelection=undefined;this.setState({saving:true});
        let saved=false;
        try{
            const confirmed=await this.props.onSelect(model);
            if(!this.alive||this.pending!==request||this.props.sessionId!==request.sessionId)return;
            saved=confirmed?.id===request.sessionId&&key(confirmed.model)===key(model);
            // React may deliver the parent's confirmed props after this promise finishes.
            if(saved&&key(this.props.current)!==key(model))this.confirmedSelection=model;
            if(!saved)this.setState({error:'模型选择未保存，请核对当前会话后重试。'});
        }catch(error){if(this.alive&&this.pending===request)this.setState({error:error instanceof Error?error.message:String(error)});}
        finally{if(this.alive&&this.pending===request){this.pending=undefined;if(!saved)this.resetPreview();this.setState({saving:false});}}
    };
    private chooseModel=(provider:string,model:string)=>{
        if(this.blocked())return;const row=this.models().find(row=>row.provider.provider===provider&&row.model.model===model);if(!row)return;
        const levels=row.model.reasoning.levels,current=this.props.current,same=current?.provider===provider&&current.model===model;
        const thinking=same&&levels.some(level=>level.id===current.thinking)?current.thinking:row.model.reasoning.defaultLevel;
        if(levels.some(level=>level.id===thinking)){this.resetPreview();return this.choose({provider,model,thinking,...(row.model.restoreEpoch?{restoreEpoch:row.model.restoreEpoch}:{})});}
    };
    private preview=(value:number)=>{
        const levels=this.selected()?.model.reasoning.levels??[];if(this.blocked()||levels.length<2||!Number.isFinite(value))return;
        const bounded=Math.max(0,Math.min(value,levels.length-1)),index=this.state.dragging?bounded:Math.round(bounded);
        this.setState({preview:index,visual:index});
    };
    private confirmedIndex=()=>this.selected()?.model.reasoning.levels.findIndex(level=>level.id===this.props.current?.thinking)??-1;
    private commit=()=>{
        const row=this.selected(),index=this.state.preview;if(!row||index===null)return;const level=row.model.reasoning.levels[Math.round(index)];
        if(level)return this.choose({provider:row.provider.provider,model:row.model.model,thinking:level.id,...(row.model.restoreEpoch?{restoreEpoch:row.model.restoreEpoch}:{})});
    };
    private pointerDown=(event:React.PointerEvent<HTMLInputElement>)=>{
        if(this.blocked()||event.button!==0)return;this.pointerStart={id:event.pointerId,x:event.clientX};event.currentTarget.setPointerCapture?.(event.pointerId);this.setState({pointer:true,dragging:false});
    };
    private pointerMove=(event:React.PointerEvent<HTMLInputElement>)=>{
        if(!this.pointerStart||event.pointerId!==this.pointerStart.id||this.blocked())return;
        if(!this.state.dragging&&Math.abs(event.clientX-this.pointerStart.x)<=3)return;
        const rect=event.currentTarget.getBoundingClientRect(),count=this.selected()?.model.reasoning.levels.length??0;if(rect.width<=36||count<2)return;
        const value=Math.max(0,Math.min(1,(event.clientX-rect.left-18)/(rect.width-36)))*(count-1);this.setState({dragging:true,preview:value,visual:value});
    };
    private pointerEnd=(event:React.PointerEvent<HTMLInputElement>,cancel=false)=>{
        if(!this.pointerStart||event.pointerId!==this.pointerStart.id)return;this.pointerStart=undefined;
        event.currentTarget.releasePointerCapture?.(event.pointerId);this.setState({pointer:false,dragging:false,visual:this.state.dragging&&this.state.preview!==null?Math.round(this.state.preview):this.state.visual});if(cancel)this.resetPreview();else void this.commit();
    };
    private toggle=(event:React.ToggleEvent<HTMLDivElement>)=>{
        const open=event.newState==='open';if(open&&this.blocked()){this.close();return;}this.resetPreview();this.setState({open,modelsOpen:open&&!this.selected(),error:''},()=>{
            if(open){this.position();(this.range.current&&!this.range.current.disabled?this.range.current:this.menu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)'))?.focus({preventScroll:true});}
        });
    };
    render(){
        const {current,disabled,busy,locked,sessionId,management}=this.props,models=this.models(),selected=this.selected(),levels=selected?.model.reasoning.levels??[];
        const scope=()=>this.props.sessionId===sessionId&&key(this.props.current)===key(current)&&this.props.management===management;
        const confirmedIndex=this.confirmedIndex(),valid=confirmedIndex>=0,configured=!!current?.provider&&!!current.model,label=valid?levels[confirmedIndex].label:configured?'不可用':'';
        const index=this.state.preview??confirmedIndex,level=levels[Math.round(index)],visual=this.state.visual??confirmedIndex,progress=levels.length>1&&visual>=0?visual/(levels.length-1)*100:0;
        const blocked=this.blocked(),id='composer-model-menu-'+sessionId,error=this.props.error||this.state.error;
        const style={'--thinking-progress':progress+'%','--thinking-fill-width':progress>=100?'100%':`calc(18px + (100% - 36px) * ${progress/100})`,'--thinking-violet':progress/100} as React.CSSProperties;
        return <div className="composer-model-control composer-model-picker">
            <button ref={this.trigger} type="button" className="composer-model-trigger" popoverTarget={id} aria-haspopup="dialog" aria-controls={id} aria-expanded={this.state.open} aria-label="会话模型与思考等级" disabled={disabled||locked||busy||this.state.saving||!!this.pending||this.unavailable()||!models.length} title={locked?'当前会话已绑定固定授权，模型不能更改':error||(!models.length?'请先在设置中保存供应商、模型与思考档位':current?current.provider+' / '+current.model+' · '+label:'请先在设置中配置模型')}>
                {this.state.open&&!this.state.modelsOpen?<span className="composer-thinking-value">选择强度</span>:<><span className="composer-model-name">{selected?.model.name||current?.model||'选择模型'}</span>{label?<span className="composer-thinking-value">{label}</span>:null}</>}<Icon name="chevron" size={11}/>
            </button>
            {this.unavailable()&&error?<span className="composer-model-error" role="status">{error}</span>:null}
            <div ref={this.menu} id={id} popover="auto" role="dialog" aria-label="选择会话模型与思考强度" className="composer-model-menu" onKeyDown={this.keys} onToggle={this.toggle}>
                <div className="composer-model-strength" data-expanded={!this.state.modelsOpen} inert={this.state.modelsOpen} aria-hidden={this.state.modelsOpen}>
                    <div className="composer-model-heading"><strong className="composer-thinking-level">{level?.label||(current?'当前配置不可用':'选择模型')}</strong><button type="button" className="composer-model-name" aria-expanded={this.state.modelsOpen} aria-controls={id+'-models'} disabled={blocked} onClick={()=>{if(!scope()||this.blocked())return;this.resetPreview();this.setState({modelsOpen:!this.state.modelsOpen});}}>{selected?.model.name||current?.model||'选择模型'}<Icon name="chevron" size={11}/></button></div>
                    <div className="composer-thinking-picker" data-dragging={this.state.dragging} data-pointer={this.state.pointer} data-ultra={levels.length>1&&Math.round(index)===levels.length-1} style={style}>
                        <div className="composer-thinking-range-wrap">
                            <div className="composer-thinking-rail" aria-hidden="true"><span className="composer-thinking-fill"/><span className="composer-thinking-gradient"/></div>
                            <div className="composer-thinking-ticks" aria-hidden="true">{levels.map((level,i)=><span key={level.id} style={{left:(levels.length>1?i/(levels.length-1)*100:0)+'%'}}/>)}</div>
                            <span className="composer-thinking-stars" aria-hidden="true">{Array.from({length:12},(_,index)=><span key={index}/>)}</span>
                            <span className="composer-thinking-thumb-lane" aria-hidden="true"><span className="composer-thinking-thumb"/></span>
                            <input ref={this.range} className="composer-thinking-input" type="range" min={0} max={Math.max(0,levels.length-1)} step={this.state.pointer?'any':1} value={Math.max(0,index)} disabled={blocked||levels.length<2||!valid} aria-label="思考强度" aria-valuetext={level?.label||'当前配置不可用'} onChange={event=>{if(scope())this.preview(Number(event.currentTarget.value));}} onPointerDown={event=>{if(scope())this.pointerDown(event);}} onPointerMove={event=>{if(scope())this.pointerMove(event);}} onPointerUp={event=>this.pointerEnd(event,!scope())} onPointerCancel={event=>this.pointerEnd(event,true)} onKeyUp={event=>{if(scope()&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key))void this.commit();}} onBlur={()=>{if(scope()&&!this.state.pointer)void this.commit();}}/>
                        </div>
                    </div>
                    {!valid?<p className="composer-model-error" role="status">当前模型或思考等级不可用，请明确选择已配置模型。</p>:null}
                </div>
                <div id={id+'-models'} className="composer-model-models-view" data-expanded={this.state.modelsOpen} inert={!this.state.modelsOpen} aria-hidden={!this.state.modelsOpen}>
                    <div role="group" aria-label="已配置模型">{models.map(row=><button type="button" key={JSON.stringify([row.provider.provider,row.model.model])} role="menuitemradio" aria-checked={current?.provider===row.provider.provider&&current.model===row.model.model&&(current.restoreEpoch??0)===(row.model.restoreEpoch??0)} disabled={blocked||!row.model.reasoning.levels.some(level=>level.id===row.model.reasoning.defaultLevel)} className="composer-model-option" onClick={()=>{if(scope())void this.chooseModel(row.provider.provider,row.model.model);}}><span><strong>{row.model.name}</strong><small>{row.provider.name}</small></span>{current?.provider===row.provider.provider&&current.model===row.model.model&&(current.restoreEpoch??0)===(row.model.restoreEpoch??0)?<Icon name="check" size={15}/>:null}</button>)}</div>
                </div>
                <p className={'composer-model-status '+(error?'composer-model-error':'composer-model-note')} role={error?'alert':'status'} aria-live="polite">{this.state.saving?'正在保存…':error||(!models.length?'还没有可用模型，请先在设置中添加。':'\u00a0')}</p>
            </div>
        </div>;
    }
}
