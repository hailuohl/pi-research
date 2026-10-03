# Pi Research UI 设计方案

日期：2026-10-03。范围：项目/会话选择 → 阅读会话 → 输入消息。交付可点击的设计预览与 shadcn 组件选型，尚未接入正式前端。

打开 [交互预览](preview.html)。默认推荐「浅色中性」，也可切换「深色专注」和「酒红延续」；三种外观共用同一信息架构。预览使用合成内容和原生 HTML/CSS/JavaScript，不调用 Pi、供应商、文献服务或项目 API，不保存正式项目设置，刷新后恢复演示初态。

## 现状与设计判断

项目是 React 19.3.0 + esbuild + 原生 CSS，不需要换成 Next.js 或 Vite。`shadcn info --json` 确认尚无 `components.json`、Tailwind、组件基础库和已安装 shadcn 组件。

当前页面实际由 `styles.css`、`workbench-theme.css`、`experiment-graph.css`、`chat-messages.css` 依次覆盖。主题已有暖白和酒红，但最后的消息样式把 Markdown 正文降至 12px、部分过程摘要降至 10px。现有布局有会话主区与固定上下文栏；进一步简化应让常态阅读和输入占据主要空间，辅助工具保持可发现。

本次检查了当前源码、2026-10-02 已入库的会话验收截图和本机服务登录页。当前浏览器未登录正式工作台，未把历史截图当作本次实时画面；没有读取认证文件或研究数据库。

## 可用 UI 与取舍

| UI 来源/组件 | 适合的位置 | 本项目建议 |
| --- | --- | --- |
| [官方 Sidebar Blocks](https://ui.shadcn.com/blocks/sidebar)：sidebar-07 | 可折叠导航、项目切换、会话目录 | 推荐参考其导航组合与折叠能力；移除示例中的账号、商业菜单与占位卡片 |
| 同一官方库：sidebar-08 | 内容内嵌、次级导航 | 可作为延续现有三栏工作台的较保守方向 |
| [Command](https://ui.shadcn.com/docs/components/base/command) | Ctrl+K 查找会话与工具 | 与现有服务端会话搜索/分页接线，不能把本地显示的会话误当全部记录 |
| [Sheet](https://ui.shadcn.com/docs/components/base/sheet) / [Resizable](https://ui.shadcn.com/docs/components/base/resizable) | 移动导航、辅助上下文、可调宽面板 | 首批优先 Sheet；已有实际需要时再加可调宽，避免把聊天空间切得过碎 |
| [Input Group](https://ui.shadcn.com/docs/components/base/input-group) + Select / Popover / Switch | 消息输入、来源、模型、协作开关 | 控件高度、文字层级和焦点统一，保留现有业务处理 |
| [Message](https://ui.shadcn.com/docs/components/base/message) / [Bubble](https://ui.shadcn.com/docs/components/base/bubble) / [Attachment](https://ui.shadcn.com/docs/components/base/attachment) | 消息、附件和过程记录 | 适合整理呈现层；具体安装路径与接口需在接入时复核 |
| [Empty](https://ui.shadcn.com/docs/components/base/empty) + Alert / Skeleton / Badge | 空态、错误、加载和状态 | 错误与批准要求持续可见；成功提示才用短暂通知 |

已用 npm runner 的 shadcn CLI 4.21.1 查询官方 registry，并通过 `view` 确认 sidebar-07/08 的文件与依赖组合。Sidebar、Command、Resizable、Sheet、Input Group、Empty 的 CLI 文档链接可解析。聊天组件的官方文档可读取，但该 CLI 的 `docs` 暂未返回其链接；这不是已验证安装。一次 Windows CLI 搜索在输出结果后退出异常，未进行安装或修改项目。

组件基础以官方 shadcn 为首选。当前需求是研究工作台，现成营销页面的装饰、动效和卡片不适合作为整页模板。可以采用基础组件的源码，再按项目功能组合；不同时引入第二套完整 UI 系统。

## 推荐的信息架构

- 左侧：项目选择、新建会话、会话目录、实验入口；管理入口靠下，减少与当前研究争夺注意力。
- 顶部：项目/会话位置、全局查找、工作区工具、上下文开关。文件、文献、证据和成果延续现有辅助入口。
- 中间：会话标题、状态、可阅读的消息与固定输入区。正文 15px、辅助文字 12px、约 1.8 行高。
- 右侧：当前计划、资料和待批准事项。可收起；窄屏按需打开侧抽屉。正式接入时，即使收起上下文也须在主区保留待批准和阻断状态摘要。

视觉采用清晰的平直分区、轻分隔线、有限圆角和稳定间距；主要按钮明确，弱操作简化。状态用图标/文字辅助，不能只依赖颜色。默认灰白与近黑主操作便于长时间阅读；酒红作为保留原品牌的备选，深色适合低亮环境。

## 演示与验收条件

1. 新建/选择会话、阅读与模拟发送形成完整主流程，发送与回复显式标注演示。
2. 项目和会话作用域、普通/引导/后续消息、归档禁发及正式批准语义清晰，无真实后端请求。
3. 正常、空会话、加载、读取失败/重试、归档和搜索无结果可查看；320/390/768/1024/1440px 无外层横向溢出，键盘主要路径与抽屉焦点可用。
4. 明确区分设计预览与正式组件接入；既有在途修改保留，不新增生产依赖，不改变历史或科研数据。

## 正式接入边界

第一批只落地会话主流程：新增必要的 shadcn 配置与样式编译，保留 React/esbuild；迁移导航、工具菜单、输入控件、消息表面与反馈。遵循实际选定的 registry、组件基础和命名约定，不直接覆盖已有组件或套用整站 preset。

现有 `ScrollHistory` 已处理前后游标、20 条分页、200 条窗口、去重、来源校验和阅读位置恢复。[Message Scroller](https://ui.shadcn.com/docs/components/base/message-scroller) 可列为后续候选，不能在未验证这些契约前整体替换历史控制。草稿在同一会话切换工具时保留，切换项目/会话的生命周期沿用现有实现。

项目级文献来源与多智能体开关仍是项目设置；模型选择仍遵循会话绑定与授权限制。附件上传、冻结来源、正式 Run、文稿编译与成果验收继续使用原业务边界。实验图与其他页面待该主流程验收后再按需推进。

## 交付证据

本次浏览器验证与独立复核状态见 [evidence.json](evidence.json)。预览验证仅证明上述设计演示，不能替代正式前端集成、真实 Pi/Docker 或科研流程验证。
