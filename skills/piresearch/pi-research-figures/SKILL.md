---
name: pi-research-figures
description: "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。"
---

# 图是一项论证

每幅图只支持一个可以核对的主张。跳过正文的读者也应读对结论。默认 matplotlib 的屏幕尺寸、标题、色循环和栅格输出不足以用于投稿。

先确定图要回答的问题和数据来源，按下方六类入口读取适用参考。保存脚本、实际生成并归档图由具备相应工具和批准的执行者完成，再写图注、放入固定稿件检查真实版面。交付真实图文件及其脚本、输入与版本关联；没有数据时交付明确标注的软件示例或缺口，不把示例画成实测结果。

## 必须满足的科学与版式要求

1. **按最终打印尺寸制作**。资源中的 `COLUMN=3.25`、`TEXT=5.5`、`WIDE=6.75` 单位为英寸，按实际模板列宽选择。8 英寸图缩至3.25英寸会把字号缩成不可读的3pt。论文仍用 `width=\linewidth`，但它不是救济错误尺寸的办法：双栏 `WIDE` 必须放 `figure*`，普通 `figure` 会把它再缩半。
2. **矢量导出**。轴、线、文字输出 PDF，并同时保存 SVG 预览。只有照片、样本图像网格、像素级注意力图等真实栅格内容适合 PNG；不能把绘图画布截图当论文图。
3. **数字可追溯**。先用 `run_inspect`/`run_logs` 读取真实指标，按 `pi-research-evidence` 保存来源。原论文报告值须标注原文来源，不能与自己的测量混淆。不画记忆、四舍五入猜测或“合理”的值。本资源模板均为**软件示例，不是科研结果**，交付研究图前必须替换为真实来源数据。
4. **图注承担标题**。论文图不用 `ax.set_title`；多面板用 `(a)`、`(b)` 等标号。
5. **不确定性可解释**。跨种子显示区间，图注明确样本数和含义；单次运行注明 single seed，不画假误差条。一个种子只能说明该次运行。
6. **轴名含量和单位**。Loss 可以是量名，但 step 必须说明是优化器步数还是 tokens；墙钟时间说明硬件。
7. **色盲与灰阶可辨**。使用模块调色板，同时用线型或标记区分。禁用 jet、rainbow、hsv，它们会制造不存在的边界。不能认为颜色本身足以保证灰阶可辨。
8. **所有图字体一致**。`use_style()` 默认采用 Helvetica 度量的无衬线字体，便于5–8pt打印阅读；图字体可不同于正文字体，但图和方法图之间一致。重数学且需融入衬线正文时可用 `use_style(family="serif")`。

## 读取资源并保存脚本

项目工具参数必须放在 `input` 内。例如 `research_skill_read`：

```json
{"input":{"skillId":"pi-research-figures","resource":"assets/pi_figstyle.py"}}
```

具备 `workspace_write` 的主协调者/writer 等获准执行者把返回的完整文本保存为自己的私有工作区 `figs/pi_figstyle.py`；创建 `expectedDigest:null`，修改先读取当前 digest。检查读取成功且非空，不从错误响应生成空模块。模块与调用它的脚本放一起；报告脚本也需要同目录副本，以便以后复现。保留 MIT 版权和 [PROVENANCE.md](PROVENANCE.md)。

analyst 可读数据并用获准的 `artifact_create` 保存文本分析，但没有工作区写入和开发绘图执行工具；reviewer 只读核对，不保存或修图。二者可在 Task 的 `task_result_submit` 中交回分析、图注、问题和真实来源，由获准主协调者/writer 接收、保存并回读，不能因技能可读而要求自行生成图。自动结果分析仅用本次实际工具核对获准 Run，不能写工作区、执行绘图、读页图或新开计算；若可用 `artifact_create` 可保存正文，没有 `artifact_read` 时交回真实 ID 与未回读状态，由交互协调者回读。工具缺失或动作被拒绝据实交接，不扩角色或审批。

Python 模板只需 numpy 和 matplotlib；TikZ 需相应 TeX 包。技能资源是可读取复制的文本，不是加载后自动执行的扩展。具备实际执行工具的主协调者/writer 等按已有开发测试、正式 Run 或用户动作执行：开发流程 `development_prepare` 固定源码、argv、镜像、资源、数据资产和预期输出，批准后 `development_submit`，再 `development_inspect`/`development_logs` 核对真实终态与审查输出。正式研究运行由具备 `run_prepare` 的交互主协调者准备并单独批准，writer 不调用此入口。依赖缺失则交回配置，不自动安装。导入项目代码的绘图必须使用项目环境。

主协调者默认无任意 Shell。`host_execute` 仅适用于用户显式启用本机完全访问的交互主会话，不能绕过正式 Run、文稿编译或外发审批。Codex 终端、图像和 LaTeX 工具不是 Pi Research 工具。示例中的 `python figs/loss_curve.py` 是批准环境内 argv 所执行的命令，不是无条件运行授权。

## 输出位置和真实引用

| 用途 | 输出位置 | 引用方式 |
|---|---|---|
| 论文 | 相对文稿 `mainFile` 的 `figs/`；冻结时把图及文稿支持的源文件纳入 `manuscript_create.files` | TeX 用真实相对路径；交付用实际 revision/file 或 artifact ID |
| 报告/聊天 | 获准私有工作区的主题/交付目录，如 `transformer-sweep/figures/`，参见 reports | 归档作业返回的 artifact ID、精确文件名和宿主实际预览/下载入口 |

Pi Research 不实现上游 `<file path="..." />` 根目录解析器。不能加想象的 `artifacts/` 前缀、下载URL或产物ID。容器临时文件不等于交付：输入仍从工作目录读，`pi_figstyle.save` 把相对stem写入本机Docker的 `PI_OUTPUT_DIR` 或SSH的 `OUTPUT_DIR`。例如逻辑路径 `figs/loss_curve.pdf` 实际写入 `/output/figs/loss_curve.pdf`，批准的 `expectedArtifacts` 填逻辑相对路径；只声明文件名不会复制 `/work/figs`。无输出变量的已获准本机执行保留相对路径。

`artifact_create` 只保存 UTF-8 文本，不能保存二进制 PDF；文稿图资产使用真实、获准的 artifactId 或 contentBase64。Python生成脚本不属于文稿允许扩展名，不能塞入 `manuscript_create.files`；保留在固定Run源码或独立文本产物，并在报告中关联源版本、输入和图。图和脚本不能只留在 `/tmp`。

生成脚本与图放同目录，如 `figs/loss_curve.py` → `.pdf`/`.svg`。需要增加一个种子时必须找得到脚本和输入。按实际列宽制作后仍写：

```latex
\begin{figure}[t] % 双栏 WIDE 改为 figure*
  \centering
  \includegraphics[width=\linewidth]{figs/loss_curve.pdf}
  \caption{\textbf{经过核验的结果主张。}验证损失随优化器步数变化；
    5个种子的均值，阴影为95\%区间。}
  \label{fig:loss}
\end{figure}
```

这里的示例主张必须替换。15英寸画布缩至5.5英寸会把11pt变为4pt；`width=\linewidth` 会掩盖问题，不能解决它。

## 同时撰写图注

先用一个简短加粗短语陈述可见发现，再给读者信任它需要的方法事实。上游观察到论文图注常为约28词、常有多句；单图可约25–40英文词，多图分别说明面板，不把字数当科学规范。

```latex
% 软件文案示例；LPO、数值和比较均须由实际来源替换。
\caption{\textbf{LPO以三分之一计算达到奖励平台。}
保留集奖励对训练计算；LPO与两个基线为5个种子均值，阴影为95\%区间。
虚线为预训练模型。}
```

- 写发现而非“LPO与基线的训练曲线”，轴已经说明设置。
- 图要独立可读，跳过结果正文也不会误解。
- 图注写 seed 数、误差含义、平滑、归一化、哪些点拟合/排除、前沿是测量还是示意连线。
- 关键未显示内容也写明：单种子、截断轴、提前终止运行。
- 不重复轴名，不把图注重复成轴内标题。

## 多面板

每个面板顶部左侧用 `panel_labels()` 标 `(a)`、`(b)`，正文可引用 Fig.2b。相同量共享轴（如 `sharey=True`），仅显示刻度的面板标一次轴名；悄悄改范围会使高度不可比。整个图只放一个图例，在下方或最后一个面板外。顺序从左到右、从上到下，与论证顺序一致。各面板若不支持共同主张，应拆成独立图，不做无关2×3拼贴。

用 `figure_grid(nrows,ncols,width=TEXT,sharey=True)` 按最终整图宽度制作。

## 按问题只读一个参考

| 问题 | resource |
|---|---|
| 训练指标怎样变化，差距是否超过种子噪声？ | [references/curves.md](references/curves.md) |
| 性能如何随尺度变化，能预测什么？ | [references/scaling.md](references/scaling.md) |
| 哪个方法赢，哪个消融组件有效？ | [references/comparison.md](references/comparison.md) |
| 奖励/KL、质量/成本/延迟如何权衡？ | [references/pareto.md](references/pareto.md) |
| 二维扫描、混淆矩阵或层诊断怎样呈现？ | [references/matrix.md](references/matrix.md) |
| 方法、架构或管线是什么？ | [references/diagram.md](references/diagram.md) |

`research_skill_read` 使用本技能ID与上表精确 resource。缺清单资源是打包问题，不通过任意网络补件或执行脚本。所有参考保留完整模板，另有 [examples/README.md](examples/README.md) 的可复制脚本入口。默认输出 `figs/`；报告改到上述获准主题目录，并同步数据、脚本和作业输出路径。六类之外的照片、样本图、地图仍遵守尺寸、来源、字幕和样式要求。

## 分别完成三类检查

| 检查 | 实际覆盖与完成依据 |
|---|---|
| 脚本与文件自检 | 读取 `save()` 打印的 audit，检查物理宽度、Type42字体、重复标题、缺轴名、低于5pt、文字重叠或越界；核对真实输出文件和从头复现所用输入/版本 |
| 模型视觉检查 | 默认模型具备图片识别能力；获准真实图片到达后直接检查打印尺寸下的可读性、标注/图例遮挡、面板次序及图注，记录实际看过的固定图或页 |
| 数据与科学论证核查 | 回查真实数据、运行/文献来源、比较条件、样本数和区间算法，确认图中主张被显示的证据支持；视觉可读不证明这一项通过 |

`save()` 的 audit 是绘图脚本中的规则检查，不是模型看图，也不是科学审查。只有 audit 为 `clean` 才称脚本审查通过；它不会抛异常，因此退出码0不能代替读审查结果，不能静默关闭审查。缺出版字体是环境缺口：模块会保留 fallback 并报告，明确交付限制，不能擅自装字体或伪称 clean。

在真实版面检查轴、单位、图例和图注；数据点/参考线旁的标注若遮挡刻度，移开或加白背景遮罩后重新看图。核对区间和 n、平滑/拟合/排除规则、残留图例与单种子限制；保留源数据和脚本，不能仅凭图像判断这些方法正确。

未实际成图写“尚未生成”；未看图写“视觉未验证”；来源或统计尚未核对时写明具体缺口。原论文图流程看 lit-review：项目已有用户 PDF 取得、解析和页图能力，但没有模型自动裁剪工具，不能用生成的相似图替换原证据。

## 在真实版面上检查

图表先从真实获准数据生成并归档，放入固定文稿实际编译。准备编译、读取页图或修订前，必须读 [paper/references/build-and-review.md](../pi-research-paper/references/build-and-review.md)。交互主协调者按其中 publication_page_image_read 准确页面批准流程读取已有页 PNG，再检查缩到列宽后的字体、轴/单位、数据遮挡、图例和图注；图种参考与统计方法仍要按需读取。

脚本退出码、PDF生成和模型自述都不能代替实际图片到达模型。仅检查已读页，工具实际拒绝、超限或撤权时记录具体未完成项，不绕过模型目录或权限校验；视觉可读性不证明数据、误差条或结论正确。Task/reviewer 不自动拥有该图片工具，不把主协调者布局观察当独立科学审查。修图后重新实际编译并看新页，不能重复交付旧图。

交付分别报告图/脚本与来源保存状态、audit 结果、实际视觉检查范围、数据与论证核查及限制；其中一项通过不替代其他项。

## 来源

适配 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835，MIT，Copyright (c) 2026 alphaXiv。精确上游文件、blob、改名及差异见 [PROVENANCE.md](PROVENANCE.md)，许可见 [LICENSE](LICENSE)。保留方法与自动审查；替换CLI、角色、归档与执行流程。资源不授予额外权限，也不表示原版服务或全部示例已在用户环境验收。
