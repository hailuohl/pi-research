# Pi Research 前端视觉复核

Source visual truth: `.validation/frontend-design/research-conversation-desk.png`（用户选择的方案 2）；实验页修订 `.validation/frontend-redesign-20261002/selected-experiment-design.png`；本地 OpenResearch 实际截图 `openresearch-tree-reference.jpg`。

Implementation: `http://127.0.0.1:4794`，独立合成项目与未运行实验。最终截图见 `docs/acceptance/flow-frontend-redesign/experiments-desktop.jpg`、`chat-desktop.jpg` 与 `experiments-mobile.jpg`。

Viewport: desktop 1487×1058，mobile 390×844。源图与桌面实现均为 1487×1058 像素，CSS 与捕获比例为 1:1；视觉对照页将两张图置于同一画面，3020×1125 的完整截图保存在 `.validation/frontend-redesign-20261002/comparison-before-full.jpg` 和 `comparison-after.jpg`，两列同尺度呈现。

State: 1 个基线、3 个候选、1 个分支，全部为草案且没有 Run；选中候选 B。最新用户指示将资料与成果移出常驻侧栏，作为工作区工具入口；这个差异按新指示保留。真实合同、来源信息、授权和运行记录使用项目原有组件。

## Findings and comparison history

- [P2，已修复] 初次对照中实验卡片的标题和状态字号偏小，空运行同时显示两条重复空指标提示。标题调为 16px，状态及运行说明调为 11px，无 Run 时收起重复指标行。后续同屏对照确认主要标题可读、空状态简洁。
- [P2，已修复] 首次实现把协作和资源说明常驻在实验详情中，影响当前实验的层级。改为原生折叠区；相关组件保持挂载，活动协作继续展开。
- [P2，已修复] 多组导航展开后整个侧栏滚动，项目选择与底部状态可能离开视口。改为只滚动菜单和会话区域，头部与底部保持可见。

## Required fidelity surfaces

- Fonts and typography: 沿用本机 Segoe UI、微软雅黑与现有代码字体，正文 14px，主要表单 13px，树节点标题 16px。缩放画布需要放大或切换列表读取小节点；窄屏列表已检查。未使用额外字体依赖。
- Spacing and layout rhythm: 项目会话目录、任务区域与实验详情按三栏组织；桌面统一外边距和圆角，窄屏采用抽屉导航与纵向上下文。12 页均无外层横向溢出。较窄目录及额外合同信息符合用户减少冗杂、融合实际功能的要求。
- Colors and tokens: 暖白画布、白色内容区、酒红主操作、深色正文；运行状态仍以文字区分，语义成功/失败颜色保留。树连线加深，选中节点具有明确边框和焦点反馈。
- Image quality and asset fidelity: π 与原有图标沿用项目身份；界面没有虚构照片或生成图表。实验连线直接来自父子数据，功能图形可交互；没有将设计截图作为界面。原图中的未实现标签和菜单没有制作成无功能装饰。
- Copy and content: 使用真实界面入口及权限语义，草案与运行状态分开，空结果明确。来源、编译和最终报告仍沿原用户权限，未声称本批实现全自动对话确认卡片。

Full-view comparison evidence: 两轮同屏对照截图，见上述 comparison-before-full 与 comparison-after。

Focused-region evidence: 同屏原尺度对照中的节点文字、连线、右侧协议与主操作已检查；另核对桌面与窄屏的导航、文件编辑、文献、报告及资源页面截图。原始逐页截图保留在 `.validation/frontend-redesign-20261002/`。

## Interaction verification

12 页桌面及窄屏可达，工作区菜单打开与选择、抽屉关闭及焦点返回、图与列表、节点选择、缩放、鼠标拖动、键盘平移、项目返回、刷新恢复、归档禁发与聊天草稿保留通过。原始摘要见 `docs/acceptance/flow-frontend-redesign/evidence.json`。浏览器控制台错误为 0。

## Follow-up polish

- [P3] 部分历史能力说明仍沿用后端阶段记录；完整 OpenResearch 行为一致性和对话内待确认操作卡片不在本批证明范围。
- [P3] 很大树图仍全量渲染；实际项目达到该规模后再考虑可见节点裁剪。

final result: passed
