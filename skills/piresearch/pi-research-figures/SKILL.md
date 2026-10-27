---
name: pi-research-figures
description: "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。"
---

# 研究绘图

在用户批准的文稿任务或 Run 入口中使用本技能。先确认数据来源、独立重复单位、图中量的单位、目标打印尺寸和输出位置，再选择模板；未获授权时不启动运行、不替换真实研究数据。

本目录的 Python 集成、七种示例、TikZ 图和说明按项目功能合同重新编写。numpy、matplotlib、TikZ、通用统计公式和 Okabe–Ito 色板各有来源，不将它们或整份技能声明为本项目的原创算法，也不作法律上的洁净室认证。

## 选择图种

- 训练过程或时间变化：`references/curves.md`、`examples/loss_curve.py`。
- 参数量与误差的尺度关系：`references/scaling.md`、`examples/scaling.py`。
- 多基准比较与组件消融：`references/comparison.md`、`examples/benchmarks.py`、`examples/ablation.py`。
- 成本与收益的取舍：`references/pareto.md`、`examples/pareto.py`。
- 超参数网格和分类混淆：`references/matrix.md`、`examples/sweep.py`、`examples/confusion.py`。
- 数据流和方法结构：`references/diagram.md`、`examples/method.tex`。

## 调用与产物

将需要的示例和 `assets/pi_figstyle.py` 放入工作目录的 `figs/`，从其父目录运行，例如 `python figs/loss_curve.py`。输入 schema、脚本文件名及输出 stem 见 `examples/README.md`。本机未配置输出根时仍写相对或绝对本机路径；Docker/SSH 运行配置 `PI_OUTPUT_DIR`，也兼容 `OUTPUT_DIR`，前者非空时优先。根目录模式仅接受规范相对 stem，拒绝任意位置冒号（含 Windows ADS），并检查符号链接越界；输入位置仍由当前工作目录决定。

`save(fig, "figs/name")` 默认生成 PDF 和 SVG，保留画布物理尺寸，不使用 tight 裁切。文件真实写入后向 stderr 输出审查结果；审查警告不会删除文件，也不能被解释为验收通过。保存异常会向调用者传播；审查器异常打印 FAILED 后同样抛出，已写出的文件保留，close 语义仍有效。普通审查提示不抛错，任何可见非空 axes 标题都会提示与论文 caption 可能重复。只有检查了返回路径、实际文件、统计语义及渲染画面，才能报告出图成功；编译命令已执行不等于 TikZ PDF 已生成。

## 统计与打印约束

第一维必须是独立运行。`mean_ci` 给出均值的点态 95% t 区间；`diff_ci` 先把两组输入分别整体展平，返回标量均值差的 Welch 区间（不对多维输入逐列比较），表格临界值按向下取整的自由度保守查找。单样本明确警告并返回退化点值，不伪称可估计区间；非有限观测明确拒绝。相关或配对研究设计须先确定适用估计方法，不能把同一运行中的步数当成独立样本。

标准宽度为 3.25、5.5、6.75 英寸，正文约 8pt，图例/刻度约 7pt，任何文字不得小于 5pt。按最终打印尺寸查看，核对颜色在灰度和色觉差异下的可辨性、轴单位、图例、文字碰撞及画布越界。字体使用安装的 DejaVu 回退，PDF/PS 使用 TrueType 42、SVG 保留文字。自动审查报告不能替代像素检查和论文语义审查。

缺失数据保留为空白或明确拒绝；禁止补零、补造重复、隐藏无效观测或把拟合线标成实测。演示生成器只用于隔离验证目录，其固定标记说明数据为软件演示；保留拒绝覆盖既有数据的行为。
