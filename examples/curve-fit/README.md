# 可追溯数值实验示例
这是实际执行的小型多项式拟合，而非 LLM 或 DFT 模拟。数据由固定数学函数生成，使用确定性 180/60 训练/测试划分。
入口固定为 node experiment.mjs；候选只修改已版本化 config.json。可比较 polynomialDegree 1、2、3。
metrics.json 中 mse 越小越好、r2 越大越好。指标不是“科研假设成立”的自动判断。
