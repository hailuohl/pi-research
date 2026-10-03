import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { SessionHistory } from "./session-history.js";
const PAGE_SIZE = 20, MAX_MESSAGES = 200, MAX_AUTO_PAGES = 10;
function mergeHistoryMessages(current, incoming, direction) {
  const ordered = direction === "before" ? [...incoming, ...current] : [...current, ...incoming], result = [], positions = /* @__PURE__ */ new Map();
  for (const message of ordered) {
    const index = positions.get(message.id);
    if (index === void 0) {
      positions.set(message.id, result.length);
      result.push(message);
    } else if ((message.version ?? 0) > (result[index].version ?? 0)) result[index] = message;
  }
  return result;
}
function mergeHistoryPage(window2, messages, history, direction) {
  let merged = mergeHistoryMessages(window2.messages, messages, direction), beforeCursor = direction === "before" ? history.beforeMessageId : window2.beforeCursor, afterCursor = direction === "after" ? history.afterMessageId : window2.afterCursor, atLatest = direction === "after" ? history.afterMessageId === null : window2.atLatest;
  if (merged.length > MAX_MESSAGES) {
    if (direction === "before") {
      merged = merged.slice(0, MAX_MESSAGES);
      afterCursor = merged[merged.length - 1]?.id ?? afterCursor;
      atLatest = false;
    } else {
      merged = merged.slice(-MAX_MESSAGES);
      beforeCursor = merged[0]?.id ?? beforeCursor;
    }
  }
  return { messages: merged, beforeCursor, afterCursor, atLatest };
}
function reconcileHistoryWindow(window2, incoming, history, atBottom = false) {
  const ids = new Set(window2.messages.map((message) => message.id)), overlap = incoming.some((message) => ids.has(message.id));
  if (window2.afterCursor !== null) {
    const updates = incoming.filter((message) => ids.has(message.id));
    return { ...window2, messages: mergeHistoryMessages(window2.messages, updates, "after"), afterCursor: overlap ? window2.afterCursor : window2.messages[window2.messages.length - 1]?.id ?? window2.afterCursor };
  }
  if (!overlap) {
    if (atBottom && history?.atLatest) {
      const messages2 = mergeHistoryMessages([], incoming, "after"), trimmed = messages2.length > MAX_MESSAGES ? messages2.slice(-MAX_MESSAGES) : messages2;
      return { messages: trimmed, beforeCursor: messages2.length > MAX_MESSAGES ? trimmed[0]?.id ?? null : history.beforeMessageId, afterCursor: history.afterMessageId, atLatest: history.atLatest };
    }
    return { ...window2, afterCursor: window2.messages[window2.messages.length - 1]?.id ?? null, atLatest: false };
  }
  let messages = mergeHistoryMessages(window2.messages, incoming, "after"), beforeCursor = window2.beforeCursor ?? history?.beforeMessageId ?? null;
  if (!atBottom && messages.length > MAX_MESSAGES) {
    return { ...window2, messages: mergeHistoryMessages(window2.messages, incoming.filter((message) => ids.has(message.id)), "after"), afterCursor: window2.messages[window2.messages.length - 1]?.id ?? null, atLatest: false };
  }
  if (messages.length > MAX_MESSAGES) {
    messages = messages.slice(-MAX_MESSAGES);
    beforeCursor = messages[0]?.id ?? beforeCursor;
  }
  return { messages, beforeCursor, afterCursor: history?.afterMessageId ?? null, atLatest: history?.atLatest ?? window2.atLatest };
}
function initialWindow(messages, history) {
  const merged = mergeHistoryMessages([], messages, "after"), trimmed = merged.length > MAX_MESSAGES ? merged.slice(-MAX_MESSAGES) : merged;
  return { messages: trimmed, beforeCursor: merged.length > MAX_MESSAGES ? trimmed[0]?.id ?? null : history?.beforeMessageId ?? null, afterCursor: history?.afterMessageId ?? null, atLatest: history?.atLatest ?? true };
}
function sameAnchor(left, right) {
  return left?.direction === right?.direction && left?.id === right?.id;
}
function sameWindow(left, right) {
  return left.beforeCursor === right.beforeCursor && left.afterCursor === right.afterCursor && left.atLatest === right.atLatest && left.messages.length === right.messages.length && left.messages.every((message, index) => message === right.messages[index]);
}
function validatePage(page, capturedProjectId, capturedSessionId, direction, cursor, currentIds) {
  if (!page || page.session?.id !== capturedSessionId || page.session?.projectId !== capturedProjectId || !Array.isArray(page.messages) || page.messages.length < 1 || page.messages.length > PAGE_SIZE || !page.history || typeof page.history.atLatest !== "boolean") throw Error("invalid page");
  for (const boundary of [page.history.beforeMessageId, page.history.afterMessageId]) if (boundary !== null && typeof boundary !== "string") throw Error("invalid cursor");
  const ids = /* @__PURE__ */ new Set();
  for (const message of page.messages) {
    if (message.projectId !== capturedProjectId || message.sessionId !== capturedSessionId || typeof message.id !== "string" || !message.id || message.id === cursor || ids.has(message.id)) throw Error("invalid message scope");
    ids.add(message.id);
  }
  if (!page.messages.some((message) => !currentIds.has(message.id))) throw Error("page did not advance");
  if (direction === "before" ? page.history.beforeMessageId === cursor : page.history.afterMessageId === cursor) throw Error("cursor did not advance");
}
class ScrollHistory extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { ...initialWindow(this.props.messages, this.props.history), loading: null, failedDirection: null, error: "" };
    this.root = React.createRef();
    this.controller = null;
    this.requestEpoch = 0;
    this.mounted = false;
    this.scrollElement = null;
    this.scrollEventsBound = false;
    this.loadingDirection = null;
    this.requestCursor = null;
    this.requestEdge = null;
    this.waitingLatest = false;
    this.autoDirection = null;
    this.autoPages = 0;
    this.touchY = null;
    this.onScroll = () => this.checkEdges();
    this.onResize = () => {
      this.bindScrollEvents();
      this.checkEdges();
    };
    this.onWheel = (event) => {
      if (this.isInsideHost(event.target) && event.deltaY) this.userDirection(event.deltaY < 0 ? "before" : "after");
    };
    this.onTouchStart = (event) => {
      if (this.isInsideHost(event.target)) this.touchY = event.touches[0]?.clientY ?? null;
    };
    this.onTouchMove = (event) => {
      if (!this.isInsideHost(event.target)) return;
      const y = event.touches[0]?.clientY;
      if (y === void 0 || this.touchY === null) return;
      const delta = this.touchY - y;
      this.touchY = y;
      if (delta) this.userDirection(delta > 0 ? "after" : "before");
    };
    this.navigate = (anchor) => anchor === null ? this.jumpLatest() : this.props.onNavigate(anchor);
  }
  componentDidMount() {
    this.mounted = true;
    this.bindScrollEvents();
    this.autoDirection = this.state.afterCursor ? "after" : this.state.beforeCursor ? "before" : null;
    if (typeof window !== "undefined") window.addEventListener("resize", this.onResize, { passive: true });
    if (this.isHostVisible() && this.state.atLatest) this.scrollToBottom();
    this.checkEdges();
  }
  getSnapshotBeforeUpdate(_previous, previousState) {
    const root = this.root.current, scrollElement = this.findScrollElement(root), visible = this.isHostVisible(), scrollTop = scrollElement?.scrollTop ?? (typeof window === "undefined" ? 0 : window.scrollY), scrollHeight = scrollElement?.scrollHeight ?? (typeof document === "undefined" ? 0 : document.documentElement.scrollHeight), viewportTop = scrollElement?.getBoundingClientRect().top ?? 0, viewportHeight = scrollElement?.clientHeight ?? (typeof window === "undefined" ? 0 : window.innerHeight), atBottom = scrollElement ? scrollElement.scrollHeight - scrollElement.clientHeight - scrollElement.scrollTop <= 32 : typeof window !== "undefined" && typeof document !== "undefined" && document.documentElement.scrollHeight - window.innerHeight - window.scrollY <= 32;
    let anchorId = null, anchorOffset = 0;
    if (root && visible) {
      const anchor = Array.from(root.querySelectorAll("[data-history-anchor-id]")).find((element) => {
        const rect = element.getBoundingClientRect();
        return rect.height > 0 && rect.bottom > viewportTop && rect.top < viewportTop + viewportHeight;
      });
      if (anchor) {
        anchorId = anchor.dataset.historyAnchorId ?? null;
        anchorOffset = anchor.getBoundingClientRect().top - viewportTop;
      }
    }
    return { visible, atBottom, scrollElement, scrollTop, scrollHeight, anchorId, anchorOffset, firstId: previousState.messages[0]?.id ?? null, lastId: previousState.messages[previousState.messages.length - 1]?.id ?? null };
  }
  componentDidUpdate(previous, previousState, snapshot) {
    const scopeChanged = previous.projectId !== this.props.projectId || previous.sessionId !== this.props.sessionId || !sameAnchor(previous.historyAnchor, this.props.historyAnchor);
    if (scopeChanged) {
      this.cancelRequest();
      this.waitingLatest = previous.projectId === this.props.projectId && previous.sessionId === this.props.sessionId && !!previous.historyAnchor && !this.props.historyAnchor && this.props.messages.length === 0;
      const next = this.waitingLatest ? initialWindow([], null) : initialWindow(this.props.messages, this.props.history);
      this.autoPages = 0;
      this.autoDirection = this.waitingLatest ? null : next.afterCursor ? "after" : next.beforeCursor ? "before" : null;
      this.setState({ ...next, loading: null, failedDirection: null, error: "" }, () => {
        if (!this.waitingLatest) {
          if (this.isHostVisible()) this.scrollToBottom();
          this.checkEdges();
        }
      });
      return;
    }
    if (this.waitingLatest) {
      if (!this.props.history?.atLatest || this.props.messages.length === 0 && previous.history === this.props.history) return;
      this.waitingLatest = false;
      const next = initialWindow(this.props.messages, this.props.history);
      this.autoDirection = next.afterCursor ? "after" : next.beforeCursor ? "before" : null;
      this.setState({ ...next, loading: null, failedDirection: null, error: "" }, () => {
        if (this.isHostVisible()) this.scrollToBottom();
        this.checkEdges();
      });
      return;
    }
    if (previous.messages !== this.props.messages) {
      const next = reconcileHistoryWindow(this.state, this.props.messages, this.props.history, snapshot?.atBottom ?? false);
      const direction = this.loadingDirection, cursor = direction === "before" ? next.beforeCursor : next.afterCursor, edge = direction === "before" ? next.messages[0]?.id ?? null : next.messages[next.messages.length - 1]?.id ?? null;
      const cancelled = !!direction && (cursor !== this.requestCursor || edge !== this.requestEdge);
      if (cancelled) this.cancelRequest();
      if (cancelled || !sameWindow(this.state, next)) {
        this.setState({ ...next, loading: cancelled ? null : this.state.loading });
        return;
      }
    }
    const messagesChanged = previousState.messages !== this.state.messages, liveChanged = previous.liveKey !== this.props.liveKey;
    if (snapshot?.visible && this.isHostVisible()) {
      if (liveChanged && snapshot.atBottom) this.scrollToBottom();
      else if (messagesChanged) {
        const last = this.state.messages[this.state.messages.length - 1]?.id ?? null, appended = last !== snapshot.lastId && this.state.messages.some((message) => message.id === snapshot.lastId);
        if (snapshot.atBottom && this.state.atLatest && (appended || !this.state.messages.some((message) => message.id === snapshot.lastId))) this.scrollToBottom();
        else this.restorePosition(snapshot);
      }
    }
    this.checkEdges();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.cancelRequest();
    if (typeof window !== "undefined") window.removeEventListener("resize", this.onResize);
    this.unbindScrollEvents();
  }
  cancelRequest() {
    this.requestEpoch++;
    this.controller?.abort();
    this.controller = null;
    this.loadingDirection = null;
    this.requestCursor = null;
    this.requestEdge = null;
  }
  bindScrollEvents() {
    const next = this.findScrollElement(this.root.current);
    if (this.scrollEventsBound && next === this.scrollElement) return;
    this.unbindScrollEvents();
    this.scrollElement = next;
    if (next) {
      next.addEventListener("scroll", this.onScroll, { passive: true });
      next.addEventListener("wheel", this.onWheel, { passive: true });
      next.addEventListener("touchstart", this.onTouchStart, { passive: true });
      next.addEventListener("touchmove", this.onTouchMove, { passive: true });
    } else if (typeof window !== "undefined") {
      window.addEventListener("scroll", this.onScroll, { passive: true });
      window.addEventListener("wheel", this.onWheel, { passive: true });
      window.addEventListener("touchstart", this.onTouchStart, { passive: true });
      window.addEventListener("touchmove", this.onTouchMove, { passive: true });
    }
    this.scrollEventsBound = !!next || typeof window !== "undefined";
  }
  unbindScrollEvents() {
    if (!this.scrollEventsBound) return;
    if (this.scrollElement) {
      this.scrollElement.removeEventListener("scroll", this.onScroll);
      this.scrollElement.removeEventListener("wheel", this.onWheel);
      this.scrollElement.removeEventListener("touchstart", this.onTouchStart);
      this.scrollElement.removeEventListener("touchmove", this.onTouchMove);
    } else if (typeof window !== "undefined") {
      window.removeEventListener("scroll", this.onScroll);
      window.removeEventListener("wheel", this.onWheel);
      window.removeEventListener("touchstart", this.onTouchStart);
      window.removeEventListener("touchmove", this.onTouchMove);
    }
    this.scrollEventsBound = false;
  }
  isInsideHost(target) {
    if (!this.isHostVisible() || typeof Node === "undefined" || !(target instanceof Node)) return false;
    const root = this.root.current, host = root?.closest(".conversation");
    return !!root && (root.contains(target) || !!host && host.contains(target));
  }
  userDirection(direction) {
    this.autoDirection = direction;
    this.autoPages = 0;
    this.checkEdges();
  }
  jumpLatest() {
    const anchored = !!this.props.historyAnchor;
    this.cancelRequest();
    const next = initialWindow(this.props.messages, this.props.history);
    this.autoPages = 0;
    this.autoDirection = next.afterCursor ? "after" : next.beforeCursor ? "before" : null;
    this.setState({ ...next, loading: null, failedDirection: null, error: "" }, () => {
      if (this.isHostVisible()) this.scrollToBottom();
      this.checkEdges();
    });
    if (anchored) this.props.onNavigate(null);
  }
  findScrollElement(root) {
    if (!root || typeof window === "undefined") return null;
    const conversation = root.closest(".conversation");
    if (!conversation) return null;
    const overflow = window.getComputedStyle(conversation).overflowY;
    return overflow === "auto" || overflow === "scroll" ? conversation : null;
  }
  isHostVisible() {
    const root = this.root.current;
    if (!root || typeof window === "undefined" || typeof document === "undefined" || root.getClientRects().length === 0 || root.clientHeight <= 0) return false;
    const conversation = root.closest(".conversation");
    if (conversation && (conversation.getClientRects().length === 0 || conversation.clientHeight <= 0)) return false;
    return this.findScrollElement(root) ? this.findScrollElement(root).clientHeight > 0 : window.innerHeight > 0;
  }
  scrollToBottom() {
    if (!this.isHostVisible()) return;
    const element = this.findScrollElement(this.root.current);
    if (element) element.scrollTop = element.scrollHeight;
    else if (typeof window !== "undefined" && typeof document !== "undefined") window.scrollTo(0, document.documentElement.scrollHeight);
  }
  restorePosition(snapshot) {
    const root = this.root.current, scrollElement = this.findScrollElement(root), viewportTop = scrollElement?.getBoundingClientRect().top ?? 0;
    if (snapshot.anchorId && root) {
      const element = Array.from(root.querySelectorAll("[data-history-anchor-id]")).find((item) => item.dataset.historyAnchorId === snapshot.anchorId);
      if (element) {
        const delta = element.getBoundingClientRect().top - viewportTop - snapshot.anchorOffset;
        if (delta) this.adjustScroll(scrollElement, delta);
        return;
      }
    }
    const oldFirst = snapshot.firstId, newFirst = this.state.messages[0]?.id ?? null;
    if (oldFirst !== newFirst && this.state.messages.some((message) => message.id === oldFirst)) {
      const height = (scrollElement?.scrollHeight ?? (typeof document === "undefined" ? 0 : document.documentElement.scrollHeight)) - snapshot.scrollHeight;
      if (height) this.adjustScroll(scrollElement, height);
    }
  }
  adjustScroll(element, delta) {
    if (element) element.scrollTop += delta;
    else if (typeof window !== "undefined") window.scrollTo(0, window.scrollY + delta);
  }
  checkEdges() {
    if (!this.mounted || this.waitingLatest || !this.isHostVisible() || this.state.loading || this.loadingDirection || this.state.error) return;
    const root = this.root.current;
    if (!root) return;
    const scrollElement = this.findScrollElement(root), viewportHeight = scrollElement?.clientHeight ?? window.innerHeight, rootRect = root.getBoundingClientRect();
    const nearTop = scrollElement ? scrollElement.scrollTop <= 96 : rootRect.top >= -96 && rootRect.top <= viewportHeight, nearBottom = scrollElement ? scrollElement.scrollHeight - scrollElement.clientHeight - scrollElement.scrollTop <= 96 : rootRect.bottom >= -96 && rootRect.bottom <= viewportHeight + 96;
    if (this.autoPages >= MAX_AUTO_PAGES) return;
    if (nearTop && nearBottom) {
      const direction = this.autoDirection ?? (this.state.afterCursor ? "after" : "before");
      if (direction === "after" && this.state.afterCursor || direction === "before" && this.state.beforeCursor) {
        this.autoDirection = direction;
        void this.load(direction, true);
      }
    } else if (nearTop && this.state.beforeCursor) {
      this.autoDirection = "before";
      void this.load("before", true);
    } else if (nearBottom && this.state.afterCursor) {
      this.autoDirection = "after";
      void this.load("after", true);
    }
  }
  async load(direction, automatic = false) {
    const cursor = direction === "before" ? this.state.beforeCursor : this.state.afterCursor;
    if (!cursor || this.waitingLatest || this.loadingDirection) return;
    this.loadingDirection = direction;
    this.requestCursor = cursor;
    this.requestEdge = direction === "before" ? this.state.messages[0]?.id ?? null : this.state.messages[this.state.messages.length - 1]?.id ?? null;
    const epoch = ++this.requestEpoch, projectId = this.props.projectId, sessionId = this.props.sessionId, anchor = this.props.historyAnchor, controller = new AbortController();
    this.controller = controller;
    this.setState({ loading: direction, failedDirection: null, error: "" });
    const query = direction === "before" ? "beforeMessageId" : "afterMessageId", path = `/sessions/${encodeURIComponent(sessionId)}/view?${query}=${encodeURIComponent(cursor)}&limit=${PAGE_SIZE}`;
    try {
      const page = await api(path, void 0, "GET", controller.signal);
      if (epoch !== this.requestEpoch || controller.signal.aborted || projectId !== this.props.projectId || sessionId !== this.props.sessionId || !sameAnchor(anchor, this.props.historyAnchor)) return;
      const currentCursor = direction === "before" ? this.state.beforeCursor : this.state.afterCursor, currentEdge = direction === "before" ? this.state.messages[0]?.id ?? null : this.state.messages[this.state.messages.length - 1]?.id ?? null;
      if (currentCursor !== cursor || currentEdge !== this.requestEdge) {
        this.cancelRequest();
        this.setState({ loading: null });
        return;
      }
      validatePage(page, projectId, sessionId, direction, cursor, new Set(this.state.messages.map((message) => message.id)));
      const next = mergeHistoryPage(this.state, page.messages, page.history, direction);
      if (automatic) this.autoPages++;
      this.loadingDirection = null;
      this.controller = null;
      this.requestCursor = null;
      this.requestEdge = null;
      this.setState({ ...next, loading: null, failedDirection: null, error: "" }, () => this.checkEdges());
    } catch {
      if (epoch === this.requestEpoch && !controller.signal.aborted && projectId === this.props.projectId && sessionId === this.props.sessionId && sameAnchor(anchor, this.props.historyAnchor)) this.setState({ loading: null, failedDirection: direction, error: "\u5386\u53F2\u8BFB\u53D6\u5931\u8D25\uFF0C\u5F53\u524D\u6D88\u606F\u5DF2\u4FDD\u7559\u3002" });
    } finally {
      if (epoch === this.requestEpoch) {
        this.controller = null;
        this.loadingDirection = null;
        this.requestCursor = null;
        this.requestEdge = null;
      }
    }
  }
  render() {
    const { projectId, sessionId, historyAnchor, perform, activeGeneration } = this.props, { loading, failedDirection, error } = this.state, history = this.props.history ? { ...this.props.history, beforeMessageId: this.state.beforeCursor, afterMessageId: this.state.afterCursor, atLatest: this.state.atLatest } : null, retry = failedDirection ? /* @__PURE__ */ jsxs("div", { className: "scroll-history-error", role: "alert", children: [
      /* @__PURE__ */ jsx("span", { children: error }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
        this.autoDirection = failedDirection;
        this.autoPages = 0;
        void this.load(failedDirection);
      }, children: "\u91CD\u8BD5" })
    ] }) : null;
    return /* @__PURE__ */ jsxs("div", { className: "scroll-history", ref: this.root, children: [
      loading === "before" ? /* @__PURE__ */ jsx("div", { className: "scroll-history-loading", "aria-live": "polite", children: "\u6B63\u5728\u52A0\u8F7D\u66F4\u65E9\u6D88\u606F\u2026" }) : null,
      failedDirection === "before" ? retry : null,
      /* @__PURE__ */ jsx(SessionHistory, { projectId, sessionId, messages: this.state.messages, history, historyAnchor, onNavigate: this.navigate, perform, activeGeneration }),
      loading === "after" ? /* @__PURE__ */ jsx("div", { className: "scroll-history-loading", "aria-live": "polite", children: "\u6B63\u5728\u52A0\u8F7D\u66F4\u65B0\u6D88\u606F\u2026" }) : null,
      failedDirection === "after" ? retry : null
    ] });
  }
}
export {
  ScrollHistory,
  mergeHistoryMessages,
  mergeHistoryPage,
  reconcileHistoryWindow
};
