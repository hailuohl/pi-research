# 资源来源

`assets/figstyle.py`复制自本项目 `skills/piresearch/pi-research-figures/assets/pi_figstyle.py`，其上游为alphaXiv/OpenResearch，commit `3037f727e80e0ab20c61a87c613a50dde009a835`，路径 `agent-skills/orx-figures/assets/orx_figstyle.py`，blob `c54d418b91b3a5df561abdf31fc8cd51538abe91`。完整MIT头及 `LICENSES/alphaXiv-MIT.txt` 保留。

适配仅移除输出环境变量映射、改模块导入说明，并在save中拒绝已有输出；数学、打印尺寸、字体、字号、布局与碰撞audit保留。本包脚本选择明确的新版本目录，不依赖原服务输出目录。包内方法参考为针对当前纯DuMate任务重写，不复制旧工具调用或默认论文引用。

1.0.2的 `scripts/format_paper.py`为独立实现的后排版命令，依据本项目 `skills/piresearch/pi-research-paper/assets/starter-main.tex` 的单栏article结构，以及 `docs/acceptance/flow-paper-writing/second-draft/main.tex` 实际中文稿的A4、25mm、11pt版式规则。没有复制示例正文、作者、日期、参考文献或图像；不是期刊模板或通用TeX执行器。字体只读取本机已有的Windows Noto Serif SC（SIL Open Font License），用已有FontTools在内存按本稿字符生成400/700实例，供PDF嵌入子集；不在Skill中分发或落盘完整字体。不可用时使用ReportLab内置STSong-Light/Times，并在实际导出清单标明回退、缺少粗体及partial。Word依赖使用方已有字体。

原 `research.py`字节及SHA256 `d21aa9bdcc9a19e5f424a9d2b83a9c9b76f362d536bf0a2a1d4b874e798e5b67`、`figstyle.py`和旧科研产物不随本次格式迁移改写；新增格式器直接复用原校验和唯一锁。原1.0.0/1.0.1发行、旧稿、旧链接保留。


科学核对补充的 `references/scientific-review.md` 适配自本项目 `skills/piresearch/pi-research-paper/references/scientific-review.md`（基线e315385），保留数值/方向/单位/统计/条件核对、实际独立审阅和限定修订方法，去除Pi工具及服务调用。其上游沿用alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835的 `agent-skills/orx-paper/SKILL.md`，MIT许可保留。新增 `scripts/check_revision.py` 为本项目独立实现的标准库范围核对，不改冻结research.py、旧receipt或在途格式器；不含论文正文、原始数据或默认结论。

1.0.3的 `plot_scatter.py` 为独立实现的所选CSV原始配对绘图，scatter方法沿用本项目pi-research-figures的观测保留、打印尺寸、轴语义及科学/视觉检查原则；复用既有figstyle的MIT资产，不复制示例论文或研究结论，不增加统计检验。冻结helper、资产、article格式器和修订核对器原字节保持。
