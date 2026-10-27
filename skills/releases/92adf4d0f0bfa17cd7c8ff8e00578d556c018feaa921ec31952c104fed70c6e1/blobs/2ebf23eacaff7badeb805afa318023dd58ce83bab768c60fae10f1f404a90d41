# TikZ 方法图

方法图解释数据如何经过计算成为结果，优先保留读者需要理解的节点、方向及反馈。示例 `method.tex` 为完整 standalone 文档，包含 TikZ、amsmath、Latin Modern矢量字体、颜色与样式，展示 Data → Encode → Our method → Output、Inference stage 分组及反馈虚线。文字和数学符号与正文术语保持一致。项目编译环境已包含Latin Modern；编译后仍应检查字体嵌入，避免Type3位图字体。

`assets/pi-tikz-preamble.tex` 是可复制前导。新样式统一使用 `research` 名称：box 是一般计算框，data 是数据，method 强调贡献节点，muted 弱化辅助步骤，flow 是实线流程，feedback 是虚线反馈，edge label 控制边标签，stage 表示阶段分组。颜色为 piBlue、piOrange、piGreen、piInk、piGray，使用标准色值和浅填充，避免把所有节点都高亮。

正文可复制示例 tikzpicture，并在文稿前导加载样式；无需引入额外绘图库。stage 位于背景层，不能挡住前景节点，反馈与主流程应可凭线型分辨。节点文字用约 9pt 的 small，边和阶段标签约 7pt 的 scriptsize；缩放到稿件最终宽度后仍应达到至少 5pt，过宽时重排节点，不仅整体缩小。

从 figs 父目录可执行 `pdflatex -halt-on-error -output-directory figs figs/method.tex`。确认输出 PDF 实际生成，再查看阶段标题、边标签、箭头与边框。Python save 的输出根和审查不自动作用于 TeX，编译目标应通过 Run 的已批准路径设置；编译日志或命令计划不能冒充图形产物。
