# 比较与消融

Copyright (c) 2026 alphaXiv. 方法指引适配，MIT 许可见 [../../LICENSES/alphaXiv-MIT.txt](../../LICENSES/alphaXiv-MIT.txt)。可执行入口见 [../chart-suite.md](../chart-suite.md)，无需原Pi运行时。

benchmarks 用实际 benchmark,method,score CSV。每 benchmark 方法顺序和图例一致，spec.method_families 让色相表示家族、明暗表示家族变体；baseline灰色。柱轴从零开始，显示实数标值，禁止截短柱轴。一个单元格只有一个报告分数；有重复测量时先选择适用分析，不能静默平均。

ablation 用实际 variant,seed,value，baseline 必须存在。画 variant−baseline 差值，以零为灰参考，并按实际差值排序。每臂 n 分别报告；不能把最小 n 当全部方法重复数。

独立设计选择 `design:"independent"`，使用Welch–Satterthwaite差值自身95%区间。配对设计选择 `design:"paired"`，真实 seed 一对一且每臂完全相同，使用配对差值 t 区间；不能按行序配对或把独立Welch当万能方法。assumptions 使用统计入口相应字段。

单种子没有区间；零方差或未核验假设保留partial，不画假的误差须。不从两组各自CI重叠推断差异，区间跨零表示当前证据未区分零效应。约8个以上变体、细微精确差异或全在噪声内时，应选稿件中的实际数值表。

检查零基线、固定家族/顺序、数值标签与图例碰撞、真实CI设计与每臂n；audit与实际打印尺寸视觉审阅都不能省略。
