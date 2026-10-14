# 资源来源

`assets/figstyle.py`复制自本项目 `skills/piresearch/pi-research-figures/assets/pi_figstyle.py`，其上游为alphaXiv/OpenResearch，commit `3037f727e80e0ab20c61a87c613a50dde009a835`，路径 `agent-skills/orx-figures/assets/orx_figstyle.py`，blob `c54d418b91b3a5df561abdf31fc8cd51538abe91`。完整MIT头及 `LICENSES/alphaXiv-MIT.txt` 保留。

适配仅移除输出环境变量映射、改模块导入说明，并在save中拒绝已有输出；数学、打印尺寸、字体、字号、布局与碰撞audit保留。本包脚本选择明确的新版本目录，不依赖原服务输出目录。包内方法参考为针对当前纯DuMate任务重写，不复制旧工具调用或默认论文引用。
