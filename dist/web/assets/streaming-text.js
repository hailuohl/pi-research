import { jsx } from "react/jsx-runtime";
import * as React from "react";
import { MessageMarkdown } from "./message-markdown.js";
class StreamingText extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { target: this.props.content, displayed: this.props.content };
    this.mounted = false;
    this.epoch = 0;
    this.deadline = 0;
    this.immediate = () => !!this.motion?.matches || typeof document !== "undefined" && document.hidden;
    this.cancel = () => {
      clearTimeout(this.timer);
      this.timer = void 0;
      this.deadline = 0;
      this.epoch++;
    };
    this.catchUp = () => {
      this.cancel();
      if (this.mounted) this.setState({ displayed: this.props.content });
    };
    this.schedule = () => {
      if (!this.mounted || this.timer !== void 0 || this.state.displayed === this.props.content) return;
      if (!this.deadline) this.deadline = Date.now() + 200;
      const epoch = this.epoch;
      this.timer = setTimeout(() => {
        this.timer = void 0;
        if (!this.mounted || epoch !== this.epoch) return;
        const remaining = Array.from(this.props.content.slice(this.state.displayed.length));
        const turns = Math.max(1, Math.ceil((this.deadline - Date.now()) / 32));
        const content = this.state.displayed + remaining.slice(0, Math.ceil(remaining.length / turns)).join("");
        this.setState(() => this.mounted && epoch === this.epoch ? { displayed: content } : null, () => {
          if (!this.mounted || epoch !== this.epoch) return;
          if (this.state.displayed === this.props.content) this.deadline = 0;
          else this.schedule();
        });
      }, Math.min(32, Math.max(0, this.deadline - Date.now())));
    };
  }
  static getDerivedStateFromProps(props, state) {
    if (props.content === state.target) return null;
    return { target: props.content, ...!props.content.startsWith(state.target) ? { displayed: props.content } : {} };
  }
  componentDidMount() {
    this.mounted = true;
    if (typeof window !== "undefined") this.motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    this.motion?.addEventListener?.("change", this.catchUp);
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", this.catchUp);
  }
  getSnapshotBeforeUpdate(_previous, previousState) {
    return previousState.displayed !== this.state.displayed ? this.props.onBeforeReveal?.() ?? null : null;
  }
  componentDidUpdate(previous, _previousState, afterReveal) {
    if (this.mounted) afterReveal?.();
    if (previous.content === this.props.content) return;
    if (!this.props.content.startsWith(previous.content)) this.cancel();
    if (this.immediate()) this.catchUp();
    else this.schedule();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.cancel();
    this.motion?.removeEventListener?.("change", this.catchUp);
    if (typeof document !== "undefined") document.removeEventListener("visibilitychange", this.catchUp);
  }
  render() {
    return /* @__PURE__ */ jsx(MessageMarkdown, { content: this.state.displayed });
  }
}
export {
  StreamingText
};
