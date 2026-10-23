import * as React from 'react';
import {MessageMarkdown} from './message-markdown.js';

interface Props {content:string;onBeforeReveal?:()=> (()=>void)|undefined;}
interface State {target:string;displayed:string;}

export class StreamingText extends React.Component<Props,State> {
    state:State={target:this.props.content,displayed:this.props.content};
    private mounted=false;
    private timer?:ReturnType<typeof setTimeout>;
    private epoch=0;
    private deadline=0;
    private motion?:MediaQueryList;
    static getDerivedStateFromProps(props:Props,state:State){
        if(props.content===state.target)return null;
        return {target:props.content,...(!props.content.startsWith(state.target)?{displayed:props.content}:{})};
    }
    componentDidMount(){
        this.mounted=true;
        if(typeof window!=='undefined')this.motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
        this.motion?.addEventListener?.('change',this.catchUp);
        if(typeof document!=='undefined')document.addEventListener('visibilitychange',this.catchUp);
    }
    getSnapshotBeforeUpdate(_previous:Props,previousState:State){return previousState.displayed!==this.state.displayed?this.props.onBeforeReveal?.()??null:null;}
    componentDidUpdate(previous:Props,_previousState:State,afterReveal:(()=>void)|null){
        if(this.mounted)afterReveal?.();
        if(previous.content===this.props.content)return;
        if(!this.props.content.startsWith(previous.content))this.cancel();
        if(this.immediate())this.catchUp();else this.schedule();
    }
    componentWillUnmount(){
        this.mounted=false;this.cancel();
        this.motion?.removeEventListener?.('change',this.catchUp);
        if(typeof document!=='undefined')document.removeEventListener('visibilitychange',this.catchUp);
    }
    private immediate=()=>!!this.motion?.matches||typeof document!=='undefined'&&document.hidden;
    private cancel=()=>{clearTimeout(this.timer);this.timer=undefined;this.deadline=0;this.epoch++;};
    private catchUp=()=>{this.cancel();if(this.mounted)this.setState({displayed:this.props.content});};
    private schedule=()=>{
        if(!this.mounted||this.timer!==undefined||this.state.displayed===this.props.content)return;
        if(!this.deadline)this.deadline=Date.now()+200;
        const epoch=this.epoch;
        this.timer=setTimeout(()=>{
            this.timer=undefined;
            if(!this.mounted||epoch!==this.epoch)return;
            const remaining=Array.from(this.props.content.slice(this.state.displayed.length));
            const turns=Math.max(1,Math.ceil((this.deadline-Date.now())/32));
            const content=this.state.displayed+remaining.slice(0,Math.ceil(remaining.length/turns)).join('');
            this.setState(()=>this.mounted&&epoch===this.epoch?{displayed:content}:null,()=>{
                if(!this.mounted||epoch!==this.epoch)return;
                if(this.state.displayed===this.props.content)this.deadline=0;
                else this.schedule();
            });
        },Math.min(32,Math.max(0,this.deadline-Date.now())));
    };
    render(){return <MessageMarkdown content={this.state.displayed}/>;}
}
