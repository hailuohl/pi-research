# 方法与架构图：TikZ

回答方法、管线、贡献位置。框、箭头、数学符号适合TikZ：矢量、与论文同引擎排字、Git可diff，审稿修改不必重画。TikZ画示意，matplotlib画数据；不为柱图维护第二套pgfplots。重插画可选绘图工具，TikZ是建议，不是假定所有ML论文都用它。无论工具，PDF必须是真矢量且按打印宽度制作。

## 共用脚手架

用 `research_skill_read`：

```json
{"input":{"skillId":"pi-research-figures","resource":"assets/pi-tikz-preamble.tex"}}
```

保存到私有工作区，作为 `figs/method.tex` 头部。样式中保留 `orx`/`orxblue` 内部名以避免无意义代码改动，它们是TikZ样式名，不是CLI。脚手架定义block/data/flow/stage及与 `pi_figstyle.PALETTE` 同色盘。完整示例亦为 `examples/method.tex`。

现有文稿流程将这份TeX作为实际 `mainFile:"figs/method.tex"` 冻结并按 paper 流程准备；用户配置、单独批准、提交构建。成功PDF由作业归档，不是自动保存即编译，也不保证下载名为method.pdf。把真实输出字节作为主论文 `files` 的 `figs/method.pdf` 资产再冻结。不能用Shell绕过文稿构建。

## 相对定位，一种强调，一个方向

所有节点用positioning，如 `right=of encoder`、`below=4mm of loss`。绝对坐标会在框名变长时迫使重排。贡献是唯一强调元素，其他neutral/muted；五个彩框不能告诉读者什么新。流向统一左→右或上→下；梯度/stop-gradient/teacher反馈用不同 `backflow` 样式。形状表类型：rectangle=计算，trapezoid(data)=张量/数据，虚线stage=阶段。

## 不用scale救尺寸

`scale=0.8` 只缩坐标不缩字，导致碰撞；`transform shape` 缩字又使字低于可读标准。直接按目标宽度画，太宽则缩短文字、垂直堆叠或删阶段。`width=\linewidth` 不救超宽图；先检查实际编译PDF宽度。

给边标张量形状、loss与维度，如 `$B\times T\times d$`，可使读者不依赖方法正文重建流程。

## 常见错误

| 错误 | 处理 |
|---|---|
| `scale=0.7` | 按目标宽度重排/缩短标签 |
| `\node at(...)` | positioning相对定位 |
| 图内标题节点 | 删除，标题归图注 |
| 每框一种颜色 | 仅贡献强调 |
| tikzexternalize/pgfplots外部化/minted | 当前编译禁shell-escape，不使用 |
| 无意义交叉箭头 | 重排；交叉应有含义 |
| 字小于图注 | 节点footnotesize，边scriptsize，不再降低 |

## 完整模板

下面先读并复制共享脚手架，再附picture；示例架构只是软件演示，必须以真实方法替换。

完整可复制代码：[examples/method.tex](../examples/method.tex)，用 research_skill_read 的 resource="examples/method.tex" 读取；该文件已经包含共享preamble，复制后无需再拼接。

## 放入论文

```latex
\begin{figure}[t]
  \centering
  \includegraphics[width=\linewidth]{figs/method.pdf}
  \caption{软件文案示例：router替换固定gate，梯度沿交叉熵路径回传。
    必须改为实际方法及经过核验的说明。}
  \label{fig:method}
\end{figure}
```

也可内联：把 `\usepackage{tikz}`、`\usetikzlibrary{...}`、definecolor/tikzset放主论文preamble，正文input仅tikzpicture部分。trapezium/Stealth/fit/background layer依赖对应库，遗漏会构建失败。不要带 `\familydefault` 改正文；sans已由orx/edgelbl/stagelbl局部样式承担。若图采用serif，与 `use_style(family="serif")` 对齐时移除三处样式sffamily。

## 验收

相对定位、唯一贡献强调、统一流向、反馈有区别，边形状有用时明确。无scale/图内标题，实际PDF宽度适合目标列；必须编译成功并看过PDF。单独示意图无数据轴，不伪造数据轴标签。
