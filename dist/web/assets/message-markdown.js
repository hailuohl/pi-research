import { jsx, jsxs } from "react/jsx-runtime";
import { marked } from "marked";
const record = (token) => token;
const value = (source) => typeof source === "string" ? source : "";
function safeHref(value2) {
  const href = value2.trim();
  if (!href || /[\u0000-\u0020\u007f\\]/.test(href) || /%5c/i.test(href)) return null;
  if (href.startsWith("#") || href.startsWith("/") && !href.startsWith("//")) return href;
  try {
    const url = new URL(href);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? href : null;
  } catch {
    return null;
  }
}
function tokens(value2) {
  return Array.isArray(value2) ? value2 : [];
}
function inlineChildren(value2) {
  return tokens(value2).map((token, index) => renderInline(token, index));
}
function renderInline(token, key) {
  const t = record(token), type = value(t.type), children = inlineChildren(t.tokens), text = value(t.text) || value(t.raw);
  switch (type) {
    case "text":
    case "escape":
      return text;
    case "strong":
      return /* @__PURE__ */ jsx("strong", { children }, key);
    case "em":
      return /* @__PURE__ */ jsx("em", { children }, key);
    case "del":
      return /* @__PURE__ */ jsx("del", { children }, key);
    case "codespan":
      return /* @__PURE__ */ jsx("code", { children: text }, key);
    case "br":
      return /* @__PURE__ */ jsx("br", {}, key);
    case "link": {
      const href = safeHref(value(t.href)), body = children.length ? children : text;
      return href ? /* @__PURE__ */ jsx("a", { href, title: value(t.title), children: body }, key) : /* @__PURE__ */ jsx("span", { children: body }, key);
    }
    case "image":
      return /* @__PURE__ */ jsxs("span", { className: "message-image-alt", children: [
        "\u56FE\u7247\uFF1A",
        value(t.text) || "\u672A\u547D\u540D",
        "\uFF08\u672A\u81EA\u52A8\u52A0\u8F7D\uFF09"
      ] }, key);
    case "html":
      return /* @__PURE__ */ jsx("span", { className: "message-raw-html", children: value(t.raw) || value(t.text) }, key);
    default:
      return text;
  }
}
function renderBlocks(list, prefix = "b") {
  return list.map((token, index) => {
    const t = record(token), type = value(t.type), key = `${prefix}-${index}`, children = tokens(t.tokens);
    switch (type) {
      case "space":
      case "def":
        return null;
      case "paragraph":
        return /* @__PURE__ */ jsx("p", { children: inlineChildren(children) }, key);
      case "text":
        return /* @__PURE__ */ jsx("p", { children: children.length ? inlineChildren(children) : value(t.text) || value(t.raw) }, key);
      case "heading": {
        const depth = Math.min(6, Math.max(1, Number(t.depth) || 1));
        const Tag = `h${depth}`;
        return /* @__PURE__ */ jsx(Tag, { children: inlineChildren(children) }, key);
      }
      case "code": {
        const language = value(t.lang).split(/[\s,]/, 1)[0];
        const className = /^[\w+-]{1,32}$/.test(language) ? `language-${language}` : void 0;
        return /* @__PURE__ */ jsx("pre", { children: /* @__PURE__ */ jsx("code", { className, children: value(t.text) }) }, key);
      }
      case "list": {
        const items = Array.isArray(t.items) ? t.items : [];
        const content = items.map((item, itemIndex) => /* @__PURE__ */ jsx("li", { children: renderBlocks(tokens(item.tokens), `${key}-${itemIndex}`) }, `${key}-${itemIndex}`));
        return t.ordered ? /* @__PURE__ */ jsx("ol", { start: typeof t.start === "number" && t.start !== 1 ? t.start : void 0, children: content }, key) : /* @__PURE__ */ jsx("ul", { children: content }, key);
      }
      case "blockquote":
        return /* @__PURE__ */ jsx("blockquote", { children: renderBlocks(children, key) }, key);
      case "hr":
        return /* @__PURE__ */ jsx("hr", {}, key);
      case "table": {
        const cells = (row, tag, rowKey) => /* @__PURE__ */ jsx("tr", { children: row.map((cell, index2) => {
          const item = cell, align = item.align, style = align === "left" || align === "center" || align === "right" ? { textAlign: align } : void 0;
          const Cell = tag;
          return /* @__PURE__ */ jsx(Cell, { style, children: inlineChildren(tokens(item.tokens)) }, `${rowKey}-${index2}`);
        }) }, rowKey);
        const header = Array.isArray(t.header) ? t.header : [], rows = Array.isArray(t.rows) ? t.rows : [];
        return /* @__PURE__ */ jsx("div", { className: "message-table-scroll", role: "region", "aria-label": "Markdown \u8868\u683C", tabIndex: 0, children: /* @__PURE__ */ jsxs("table", { children: [
          /* @__PURE__ */ jsx("thead", { children: cells(header, "th", `${key}-head`) }),
          /* @__PURE__ */ jsx("tbody", { children: rows.map((row, index2) => cells(row, "td", `${key}-${index2}`)) })
        ] }) }, key);
      }
      case "html":
        return /* @__PURE__ */ jsx("pre", { className: "message-raw-html", children: value(t.raw) || value(t.text) }, key);
      default:
        return value(t.text) || value(t.raw) || "";
    }
  });
}
function MessageMarkdown({ content }) {
  if (!content) return null;
  let parsed;
  try {
    parsed = marked.lexer(content);
  } catch {
    return /* @__PURE__ */ jsx("div", { className: "message-markdown", children: content });
  }
  return /* @__PURE__ */ jsx("div", { className: "message-markdown", children: renderBlocks(parsed) });
}
export {
  MessageMarkdown
};
