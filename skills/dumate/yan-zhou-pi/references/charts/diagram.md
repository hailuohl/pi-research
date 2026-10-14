# 方法与架构示意图

Copyright (c) 2026 alphaXiv. 方法指引适配，MIT 许可见 [../../LICENSES/alphaXiv-MIT.txt](../../LICENSES/alphaXiv-MIT.txt)。入口见 [../chart-suite.md](../chart-suite.md)。

此独立包从登记的JSON data来源生成真实SVG/PDF矢量图与PNG，不执行任意外部TeX/TikZ代码。source JSON的nodes/edges是实际可编辑结构，图形目录保存diagram-source.json和chart-spec.json。不需要TeX引擎或网络服务。

diagram沿统一保存路径把SVG文字转为矢量路径，打开输出不依赖进程内字体家族。结构与文字仍通过diagram-source.json和chart-spec.json编辑后重新生成，不修改冻结figstyle。

节点需id/label，可用type compute/data/stage；边需from/to，可用label和feedback:true。每个节点和边都必须显式source_id、evidence_ids数组、provenance observed/established/hypothesis。来源必须由本计划授权，evidence属于计划且来源/摘要匹配。observed需要data来源，established需要真实text evidence，hypothesis始终标待验证，不能渲染成已测量结果。文字语义支持仍待科学核验。

spec.flow为LR或TB，contribution指定唯一真实节点。普通前向边必须有向无环，以拓扑层与同层相对槽位布置；有意义反馈显式feedback并用曲线虚线区分。hypothesis普通边点线，所有节点/边显示归属。仅贡献用强调颜色，其他neutral/muted；形状表示计算、数据或阶段。边可注明实际张量形状、loss或维度。

直接按TEXT打印宽度布局；标签过长/碰撞进入audit partial，缩短文字或改变流向后用新版本重画，不能scale压成不可读字体。示意图无数据轴，不伪造轴名、CI或测量n；manifest的n仅为节点数量，图注说明。

构图完成、字体覆盖、audit和文件生成不是视觉/科学/独立审阅通过。必须查看实际PNG和PDF后再决定入稿。
