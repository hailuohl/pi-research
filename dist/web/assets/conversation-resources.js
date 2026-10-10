import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Icon } from "./ui.js";
const resourceViews = [["literature", "\u6587\u732E\u4E0E\u539F\u6587", "search"], ["evidence", "\u8D44\u6599\u4E0E\u8BC1\u636E", "evidence"], ["reports", "\u62A5\u544A\u4E0E\u6210\u679C", "report"]];
function resourceView(value) {
  return resourceViews.some(([id]) => id === value) ? value : "";
}
class ConversationResources extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { visited: this.props.view ? [this.props.view] : [] };
  }
  static getDerivedStateFromProps(props, state) {
    return props.view && !state.visited.includes(props.view) ? { visited: [...state.visited, props.view] } : null;
  }
  render() {
    const { view, onView, views } = this.props;
    return /* @__PURE__ */ jsxs("details", { className: "workflow-history conversation-resources", "aria-label": "\u9879\u76EE\u8D44\u6599\u4E0E\u6210\u679C", "aria-live": "off", open: !!view, onToggle: (event) => {
      if (event.target !== event.currentTarget) return;
      if (event.newState === "closed" && view) onView("");
      else if (event.newState === "open" && !view) onView("literature");
    }, children: [
      /* @__PURE__ */ jsx("summary", { children: "\u9879\u76EE\u8D44\u6599\u4E0E\u6210\u679C" }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u67E5\u770B\u9879\u76EE\u5386\u53F2\uFF0C\u6838\u5BF9\u539F\u6587\u3001\u6388\u6743\u8303\u56F4\u548C\u7ED3\u8BBA\uFF1B\u7814\u7A76\u4EFB\u52A1\u7EE7\u7EED\u5728\u5F53\u524D\u5BF9\u8BDD\u4E2D\u63A8\u8FDB\u3002" }),
      /* @__PURE__ */ jsx("div", { className: "actions wrap", "aria-label": "\u8D44\u6599\u5206\u7C7B", children: resourceViews.map(([id, title, icon]) => /* @__PURE__ */ jsxs("button", { type: "button", className: "secondary compact", "aria-pressed": view === id, onClick: () => onView(id), children: [
        /* @__PURE__ */ jsx(Icon, { name: icon, size: 15 }),
        /* @__PURE__ */ jsx("span", { children: title })
      ] }, id)) }),
      this.state.visited.map((id) => /* @__PURE__ */ jsx("section", { hidden: view !== id, "aria-label": resourceViews.find(([value]) => value === id)[1], children: views[id] }, id))
    ] });
  }
}
export {
  ConversationResources,
  resourceView
};
