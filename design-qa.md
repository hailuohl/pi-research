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

## 2026-10-02 输入框控件复核

Source visual truth: 用户提供的 OpenResearch 图片 2（3585×1931）：`C:/Users/HAILUO~1/AppData/Local/Temp/codex-clipboard-eaebddbd-f70a-4178-84c7-a863cc8d0aca.png`。本批只对齐输入框左下来源/附件、右下模型/发送及展开菜单；按项目现有设计保留暖白和酒红配色、五种实际来源及多智能体开关。

Implementation: `http://127.0.0.1:4794/`，独立本机夹具项目。桌面1280×720、手机390×844；实现截图均为CSS像素1:1。原图全视图等比缩至1280×689，保留剩余留白；来源图裁剪1320,1615–2560,1930，实现区域312,310–902,654，再各自等比缩放，比较控件关系，不把未知原图密度或有意保留的配色差异当作缺陷。

Same-state evidence: `.validation/composer-controls/composer-desktop-final.png`（来源展开、空闲会话、已选模型），`composer-mobile-final.png`；全视图组合 `qa-full-comparison.png`、控件区域组合 `qa-focused-comparison.png`。已在同一输入中打开两个组合图比较，另查看手机实际截图。

Comparison history:

- [P1，已修复] 初次来源弹层被composer-stack的overflow:hidden裁切，alphaXiv等选项点不到。外壳改为overflow:visible，保留表单和队列圆角；修后DOM alphaXiv勾选改变，五源开关实际保存成功。
- [P2，已修复] 桌面发送按钮另起一行，手机模型字段过宽使发送再起第三行。调整工具栏单排/窄屏两排及字段宽度；最终桌面来源/附件左侧、模型/发送右侧，手机模型与发送在同一行靠右；390px和1280px无横向溢出。
- 用户追加图标要求：引入7份固定版本的Lucide原始SVG及完整ISC/MIT许可，数据源、回形针、模型和来源行统一15–16px；实际图像加载naturalWidth均24，不新增运行时依赖。

Required fidelity surfaces:

- Fonts/typography: 沿用项目现有中文/系统字体，工具条11–12px、菜单12px，主标题与正文不扩批调整；模型ID在窄字段省略，原生选项保留完整名称与思考等级。
- Spacing/layout: 菜单270px、行高至少32px、表单12px圆角，去除label额外下边距。桌面按钮中心对齐，手机保留可点击区域和两排工具栏。
- Colors/tokens: 沿用暖白、灰色与酒红选中/聚焦，保持项目既有主题。没有新增渐变和重阴影。
- Asset fidelity: 使用实际Lucide文件，源提交记录在`apps/web/public/icons/source.json`，原许可随发布目录保存；未用符号或绘制图案代替回形针/数据库/模型图标。
- Copy/content: 五种来源名称对应现有连接器；附件明确TXT/MD/PDF和原件状态；设置保存默认模型，当前会话选择独立。未把PDF原件保存显示成已读全文。

Interactions: 浏览器保存两套模型、空模型首次选择、来源勾选及保存、附件历史下载入口和普通发送已验；原生文件输入的accept/multiple属性已检查。文件读取/逐个导入和失败保留由25项UI检查与实际HTTP/Pi本机SSE工具链验证，未声称自动化操作了系统文件选择对话框。控制台0错误；未调用远端供应商或文献查询。

Nonblocking follow-ups: 来源版本冲突后需刷新重载；两条队列附件CSS声明重复。无剩余P0/P1/P2。

final result: passed

## 2026-10-02 网站图标、紧凑菜单及即时开关

Source visual truth: 同一用户OpenResearch参考图，及上一批`.validation/composer-controls/composer-desktop-final.png`。Implementation: `.validation/source-brand-icons/desktop-immediate.png`、`mobile-immediate.png`。桌面1280×720、手机390×844，CSS与捕获1:1；最终全视图组合`comparison-full-final.png`和控件裁剪组合`comparison-focused-final.png`已在同一输入中打开比较。两边来源菜单均展开、选择4/5且模型相同；主对话历史来自上一批验收，变化在本次编辑区域之外，不据此评判设计漂移。

Fonts/typography: 沿用11–12px工具条/菜单文字，网站名保留；28px行仍可点选。Spacing/layout: 菜单270→218px、约271.8→179.3px，输入最小高度80→64px，工具栏减少留白，取消独立保存按钮。Colors/tokens: 保留网站原始色彩和本项目暖白酒红。Asset fidelity: 五网站真实文件，三个SVG与本地OpenResearch原件哈希一致；PubMed使用官网NCBI favicon，未用上游Pm占位；Crossref为官网ICO。Copy/content: 网站名称、勾选语义和模型/附件入口保持清楚，移除常驻说明，更新失败才显示实际错误。

Interactions: 5图标全部加载，保存按钮0个；勾选PubMed后刷新仍勾选，取消后刷新仍取消。失败/未知状态与重开恢复、并发点击、卸载回写由最终相关39项覆盖。390/1280px菜单完整，无横向溢出，模型和发送同排；控制台0错误。来源版本冲突的旧待办由这次即时更新所需的实际状态回读处理，队列重复CSS仍属原非阻断待办。本批无新P0/P1/P2。

final result: passed
