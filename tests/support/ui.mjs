// Method-level checks do not mount a DOM. Elements and components use the installed React;
// only this instance's update queue is synchronous. Browser acceptance covers real scheduling.
export function synchronousState(view){
 view.setState=(update,callback)=>{const value=typeof update==='function'?update(view.state,view.props):update;if(value)Object.assign(view.state,value);callback?.();};
 return view;
}
