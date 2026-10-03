# Pi Research：参考 AI 桌面软件的视觉方案

日期：2026-10-03。范围：项目/会话选择 → 阅读 → 输入消息的设计预览。当前用户约束优先：保留已确认的布局、栏宽、导航分组、工具入口和输入框控件位置，只改视觉样式。正式前端未接入这次样式方案。

打开 [交互预览](preview.html)。默认「简洁浅色」，可在「设计预览」中切换「专注深色」「酒红延续」及演示状态。三种外观使用同一布局。内容为合成数据，发送明确为本地模拟；不调用模型、文献服务或项目 API，不保存正式项目设置。

## 参考依据与自己的设计判断

| 参考软件 | 已核实的官方证据 | 本项目借鉴 |
| --- | --- | --- |
| [Codex](https://openai.com/index/introducing-the-codex-app/) | 官方介绍将项目、独立会话、工作进展及变更审查组织在同一工作环境中 | 让当前会话、过程信息与下一步操作具有清楚的主次。这是我们对工作流的设计提炼，未声称获得当前 Codex 精确视觉参数 |
| [ZCode](https://zcode.network/cn/docs/task-management/) | 官方任务管理文档，以及[新任务界面图](https://zcode.network/content/docs/v2/screenshots/20260802-glm53/zcode-glm53-new-task-cn.png)：深石墨画布、稍浅的输入区、细边界、底部紧凑控件 | 深色皮肤用较小明暗差区分区域；输入框边框与聚焦态明确，控制栏保持原位 |
| [MiMo Desktop](https://mimo.mi.com/docs/en-US/news/latest/mimo-desktop) | 官方介绍及[实际产品界面图](https://aistudio-cdn.xiaomimimo.com/xiaomimimo-static/mimo-docs-figures/display/YPfhblZmnoQPcOxhivwcWCLXnNh.png)：灰白导航、白色会话、轻灰过程文本与输入面板 | 浅色皮肤突出正文，弱化时间、来源和过程记录；借鉴既有区域内的阅读层级 |

已在浏览器查看 ZCode 与 MiMo 图片像素。MiMo 文档第一张“Unified AI Orchestration”图片是架构图，不作为软件界面证据。官方未提供完整字体、色值、圆角与交互状态参数；本预览为 Pi Research 自己的样式方案，不是逐像素复制，也不复制它们的导航结构或新增其功能。

## 保留的布局

以当前 `apps/web/src/app.tsx`、`workbench.tsx`、`session-list.tsx`、`composer-controls.tsx` 及现有 CSS 为准，不沿用上一版探索预览的重排。

- 桌面保留项目和会话目录、中间研究会话、右侧协作空间；原有外边距、栏间距、面板圆角、滚动区域和断点保持。
- 1280/1440px 保留 252px 左栏及 320px 右栏；小于等于 1200px 为 228/285px，761–980px 为 208/245px，大于等于 1600px 为 264/350px。
- 「研究」仍为新建会话、实验与运行；「管理」仍为技能与连接器、资源与调度、设置与能力；会话目录仍保留分类、查找筛选和分页位置。
- 项目文件、文献检索、资料与证据、报告与成果仍在顶部「工作区」菜单，不移到常驻侧栏。
- 输入框保留上方文字区，底部左侧来源、附件、多智能体，右侧模型与发送；原有窄屏换行规则保持。未加入上一版预览的底部消息模式切换组。
- 760px 及以下保留导航抽屉，协作面板排在主区域之后；未引入右侧抽屉或新增上下文收起入口。

## 视觉方案

1. 简洁浅色：中性浅灰画布、灰白导航、白色阅读区、石墨正文与主操作；选中项使用轻底色和文字权重。
2. 专注深色：深石墨画布与稍浅的区域表面；文字与焦点清晰，减少大面积高饱和强调。
3. 酒红延续：保留原来的品牌强调色，统一正文与辅助文字的对比度。

字号和字重形成层级，正文约 14–15px、辅助文字约 12px；状态始终保留文字。字体变化产生自然文本重排，但不借此调整栏宽、控件顺序、区域位置或导航架构。输入框通过细边框和可见聚焦态建立操作重心。

用户随后要求聊天对话框更接近 Codex。本版将用户消息改为右侧按内容收缩的浅灰圆角气泡，助手回复使用无整块底色的正文；去掉视觉头像与重复角色标题，保留可访问的作者、时间和明确的模拟标识。输入框改为柔和的 16px 圆角细边框，发送按钮变为圆角胶囊；来源、附件、多智能体、模型和发送的外框与顺序保持。这里只调整聊天区域的呈现，不声称逐像素复制某一版 Codex。

## shadcn 接入映射

项目仍是 React/esbuild/原生 CSS，尚无 `components.json`、Tailwind 和已安装 shadcn 组件。本预览采用自包含 HTML/CSS/JavaScript，只验证设计方向。

| 现有位置 | 可用组件 | 接入要求 |
| --- | --- | --- |
| 原侧栏、目录与顶部菜单 | Sidebar、Select、DropdownMenu、Collapsible | 在原结构内替换控件，不套用整页 Sidebar Block |
| 原输入框与工具栏 | Input Group、Button、Popover、Switch、Select | 原位置和原业务语义保持，不新增同类控制 |
| 消息与状态 | Message、Bubble、Attachment、Badge、Alert、Skeleton、Empty | 优化呈现；来源、失败、批准与归档语义持续可见 |
| 现有弹窗 | Dialog | 标题、键盘关闭、焦点恢复和禁用状态统一 |

官方组件参考：[Sidebar](https://ui.shadcn.com/docs/components/base/sidebar)、[Input Group](https://ui.shadcn.com/docs/components/base/input-group)、[Message](https://ui.shadcn.com/docs/components/base/message)、[Theming](https://ui.shadcn.com/docs/theming)。前批已完成相关文档与 registry 查询，不重复安装或套用 preset。

正式接入时仍保留现有 ScrollHistory 的前后游标、分页窗口、去重与阅读位置恢复，不因外观设计整体替换历史控制。多智能体和来源仍是项目级设置；模型、附件、正式 Run、文稿与批准边界沿用原业务。

## 本批验收

1. 桌面及窄屏区域、栏宽、导航和输入控件顺序符合原布局；三种主题的几何布局一致。
2. 项目→新建/选择会话→阅读→模拟发送可走通；空、加载、失败/重试和归档状态明确。
3. 输入与弹窗键盘路径可用，无真实网络或数据持久化；不伪称模型已运行、资料已检索或附件已上传。
4. 正式前端与既有在途修改保留原字节；本批仅更新预览、说明和精简证据。

实际浏览器检查、独立复核及未运行项见 [evidence.json](evidence.json)。前一版探索记录保留在 Git 历史中，本版取代其布局建议。
