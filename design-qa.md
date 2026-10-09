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

## 2026-10-02 实验转入研究对话

Source visual truth: 既有 `docs/acceptance/flow-frontend-redesign/experiments-desktop.jpg`（1487×1058），及用户的实验由智能体管理指示。Implementation: `.validation/experiment-dialogue/experiments-result-desktop.png`（1280×720）、`experiments-result-mobile.png`（390×844）、对话确认/完成卡截图。完整对比 `qa-comparison-full.png` 与详情区对比 `qa-comparison-focused.png` 已在同一输入中打开检查；旧图等比缩入1280×720，旧/新实验数量和结果状态不同，只比较本批入口与详情，不将数据、密度或状态差异作为设计缺陷。

Fonts/typography、colors/tokens、asset quality: 沿用原主题、字体、图标与原生SVG树，没有生成或替换资产。Spacing/layout: 移除创建/准备/派生/授权表单，增加简短返回当前对话区域，参数改只读查看。Copy/content: 明确由对话Pi准备，必要确认进入原对话；指标来自实际Run，不把空状态或执行成功当结论。Inspector仍有来源、运行选择、真实日志与原始产物，树保持缩放/列表切换。

Browser interactions: 普通意向确认可见，点击后只有当前根普通消息入队，Pi调用后出现真实Run与指标；实验页无手工创建/派生/准备/提交，配置只读且保存按钮0。完成后重开卡仍可查结果，确认按钮0，不重复提交。390/1280px无横向溢出，控制台0错误。首次观察完成卡已折叠，展开后结果链接可用，属于正常历史收起而非丢失。旧会话回跳兼容已恢复且原断言通过。无剩余P0/P1/P2。

final result: passed


## 2026-10-08 模型管理：方案 2 概览与侧栏编辑

Source visual truth: 用户在三张设计中选择的第 2 张“概览与侧栏编辑”：`C:/Users/hailuohpc/.codex/generated_images/01a1180f-fd71-7b92-93e1-a681d2e5dbfa/exec-744d2d78-22a5-4a3a-b89d-c643c5122604.png`；配套 JSON 子视图 `exec-f3c67848-966f-4481-a56e-0a3ef7b52990.png`。两图实际均 1487×1058。选定记录保留在本机 `.validation/model-settings-design-20261008/design-choices.json`。

Implementation: 独立合成数据服务 `http://127.0.0.1:4807/`；主项目交付入口 `http://127.0.0.1:4794/`。桌面 CSS viewport 1487×1058，捕获像素 1487×1058，实际捕获与 CSS 1:1，无重采样；手机 390×844／320×844，实际捕获亦 1:1。合成数据中的提供商数量、会话名称、已保存状态和 temperature=0.8 与参考不同，只比较布局和同一目标的编辑状态，不据此判为设计漂移。

Same-state evidence: [思考编辑](docs/acceptance/flow-model-settings-sheet/reasoning-desktop.jpg)选中 high，列表＋单条编辑＋参数入口；[JSON 编辑](docs/acceptance/flow-model-settings-sheet/json-desktop.jpg)只呈现 high 的参数。参考与实现同时置于同一 HTML 输入，完整对照 [reasoning-comparison-final.jpg](docs/acceptance/flow-model-settings-sheet/reasoning-comparison-final.jpg)、[json-comparison-final.jpg](docs/acceptance/flow-model-settings-sheet/json-comparison-final.jpg) 已打开检查；原像素局部对照 [reasoning-focused-final.jpg](docs/acceptance/flow-model-settings-sheet/reasoning-focused-final.jpg)、[json-focused-final.jpg](docs/acceptance/flow-model-settings-sheet/json-focused-final.jpg) 再检查列表、标签、输入和 JSON。局部对照只用 CSS 裁切图片（source x997/y125、actual x966/y125，各 520×900），不改变位图；页脚完整性以全图及手机截图为准。

Comparison history:

- [P2，已修复] 初版侧栏遮住概览，字号偏小。桌面为 520px 编辑栏保留 548px 空间；标题 18px、输入及编辑器 14px、字段标签 13px。最终 overviewRight=922.67、sheetLeft=967.33，1487px 无横向溢出；最新全图与局部对照确认层级及表单可读。
- [P2，已修复] 提供商名称与排序挤成窄列、编辑按钮换行。桌面提供商列固定 200px，排序放下一行，模型表的操作保持横排；最新桌面截图不再出现单字纵排。
- [P1，已修复] JSON Apply 按钮被 React 复用成父表单 submit，点击局部应用曾实际意外保存。为两组动作设置不同 key，并先阻止事件默认动作；真实浏览器修后 Apply 前后台状态完全相同，显式 Save 才 version4→5，默认选择不变。不是仅以 handler 单测宣称修复。
- [P2，已修复] 手机 390px 页面存在滚动条时 100vw 使 dialog 左侧 x=-15.33 被裁。改用 inset0/width:auto/max-width100%；[390px 思考](docs/acceptance/flow-model-settings-sheet/reasoning-mobile-390.jpg)、[320px JSON](docs/acceptance/flow-model-settings-sheet/json-mobile-320.jpg)均 x0、right<=clientWidth，保存／应用页脚完整可见。

Required fidelity surfaces:

- Fonts/typography: 沿用项目系统中文字体、Consolas JSON 字体与现有原生选择器。重点是清楚的主标题、页签、列表、单条表单；未另载字体。
- Spacing/layout: 520px 右编辑栏，概览保留左侧；四个短页签，三条紧凑等级列表只展开一条。JSON 替换栏内主体，不在长表单中再堆编辑器。固定页脚、独立中间滚动；手机全宽。
- Colors/tokens: 沿用项目浅灰背景、细分隔线、深色主按钮与现有选中灰色。参考图浅蓝选中色采用项目已有中性色以保持同页统一；没有新增主题、渐变或重阴影。
- Asset fidelity/image quality: 沿用现有 Icon 与 Pi Research 品牌，不新增位图。提供商首字母／排序箭头为既有控件；没有把整张参考图当运行 UI。参考中的头像、额外会话和模型仅为示例数据，不扩批实现。
- Copy/content: 明确“模型默认思考等级”与“新会话全局默认”分别保存；JSON 明确目标和“应用到模型草稿”，始终说明保存后才生效。取消本次编辑与关闭保留草稿语义区分清楚。

Interactions: 列表切换、JSON 错误与类型校验、局部应用、明确保存、重开读取、关闭保留、键盘 Tab／Escape 已验；异步目标与版本边界由相关 46 项检查覆盖。全量 1378 通过／0 失败／24 环境项跳过，最后手机 CSS 修后干净安装／构建／类型检查和 622 文件一致。浏览器控制台错误及警告 0，无真实供应商调用。

Follow-up polish: 原生 textarea 暂不提供语法着色；320px 下标题及“已保存配置”会自然换行，操作和内容未裁切。均为 P3，无剩余 P0/P1/P2。不新增编辑器依赖。

final result: passed

## 2026-10-09 会话右栏页签与整列调宽

Source visual truth: [selected.png](docs/design/conversation-right-panel-2026-10-09/selected.png)，用户选择的第2张；具体交互边界以同目录 design.txt 为准。Implementation capture: [desktop.jpg](docs/acceptance/flow-conversation-right-panel/desktop.jpg)、[mobile.jpg](docs/acceptance/flow-conversation-right-panel/mobile.jpg)。

Viewport: desktop 1487×1058、mobile 390×844。源图与桌面捕获均为1487×1058原始像素；不进行缩放或密度换算。源图与实现图在同一次比较输入中以原始尺寸查看；没有将分别展示的图片称为拼接或并排对照。State: 协作空间页签选中、浅色主题。生成图包含模拟协作任务；实现保留真实空任务与未配置模型提示，这些内容差异已被设计范围明确排除。右栏初始320px按已定规范，而非照搬生成图的宽度。

Required fidelity surfaces:

- Fonts/typography: 沿用既有中文/系统字体；三页签12px，选中态650字重，正文沿用原组件。标签均单行可读，不引入字体依赖。
- Spacing/layout: 三个短页签顶置、细分隔线、原左导航和会话输入保持位置；14px整高拖动区域位于整列之间。空协作保留留白。320px初始宽度、280px下限与620px叠放会话区均为实现规范内的尺寸。
- Colors/tokens: 白色面板、浅灰画布、石墨文字及原中性选中/聚焦色，使用已有语义变量；无新主题或装饰渐变。
- Image/asset fidelity: 沿用原品牌与既有Lucide Icon，握柄复用menu并旋转，目录箭头复用chevron；没有将整个设计图栅格化为运行UI，也未新增装饰图像。原图模拟头像不进入实现。
- Copy/content: 三个正式标签准确；目录标明项目共享工作区，文本预览不执行HTML。工具权限保留“受控工具”，协作审批与结果沿用原语义；未加入原图额外管理入口或模拟实验结论。

Full-view comparison evidence: selected.png与desktop.jpg在同一比较输入中核对整体区域、页签层级、间隙与输入位置。Focused-region comparison: 核对同一原尺寸输入中的右栏顶部三页签、握柄及输入工具行，相关标签均清晰可读，无需另裁切放大。手机截图额外确认页签可达和无横向溢出。

Comparison history:

- [P1，已修复] 独立复核发现1000px窗口下上下布局将历史滚动宿主变为工作台，历史仍按conversation/window操作；真实100条合成历史复现。四行CSS改为有界620px会话，并保留内部conversation滚动。修后初次进入到最新，向上滚动加载更早条目并保持阅读位置；390px下同一宿主可用。
- 编译阶段两处setState类型错误已修复；它们不是视觉对照结果，不计作视觉迭代。

Interactions: 三页签、目录展开/纯文本预览及状态保留、实际鼠标拖动、键盘调整与双击复位、刷新恢复、项目隔离、无项目提示、1000px上下布局、390px页签均已检查。拖动时实验树视角和草稿保持。浏览器控制台错误0。未测试真实触控或屏幕阅读器；相关ARIA信息与键盘路径已核对。

Follow-up: 成功读取的目录清单在本页面内缓存；工作区新建文件后的目录刷新保留为非阻断待办。无剩余P0/P1/P2。

final result: passed
