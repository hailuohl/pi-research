# Pi Research 0.3.0-experimental

由已独立封存的 **v0.2.2 修复基线** 派生的可选文献证据试验分支。保留 Pi 唯一 Agent 内核，不安装 PaperQA/Robin/LDP/Sakana 或材料模型执行系统。本版不是完整自动科研平台。

## 先运行

核心 Node.js >=22.16.0，随包 dist 不需安装开发依赖：
```
node dist/apps/cli/index.js doctor
node dist/apps/server/index.js
```
打开终端的本地地址（含私有访问令牌，不要分享）。默认 127.0.0.1:4317。

体验新的本地文本流程（只导入明确标注的人工测试资料，不调用 LLM）：
```
node scripts/demo-evidence.mjs
node dist/apps/server/index.js
```
在“文献检索”页面查看“本地原文检索”。普通新项目默认关闭，先在“资料与证据”导入文本，再选择范围启用。

已有真实数值工作流仍可通过 `node dist/apps/cli/index.js demo-campaign` 执行。它运行受信曲线拟合，不是 DFT 或模型自主研究。

## 增强是什么

- 本地词项检索（不是语义模型）：英文单词与汉字单/双字项、固定段落分块。
- 精确重复片段分组，保留所有获准出处，不把副本当新的独立支持。
- PaperQA 固定提交的 MMR 选择流程小范围 TypeScript 移植，Apache-2.0 说明见 third-party/paperqa；默认 mmrLambda=1 不启用，可选择 0.65 试验。
- 返回原文、文件哈希、UTF-16区间、行号和真实 Evidence ID；无虚构页码或模型摘要。
- 仅用户能选择/启用语料；助手仍受任务范围限制。移除或关闭后缓存重放也不能绕过权限。
- 同一服务经 HTTP、Pi工具、界面使用；不创建 Claim，不启动 Run，不扩大批准。

这不是完整 PaperQA2：没有其 Agent循环、摘要模型、嵌入模型、PDF解析或回答生成。Aviary 仅作为对比脚本的环境化评测方法参考，未引入其运行库。

## 比较两个版本

将修复版与增强版解压到不同目录，**不要共享业务数据库**。并行启动时分别设置 PORT=4317 / PORT=4318 和独立 PI_DATA_DIR。

在增强版目录执行：
```
node scripts/compare-variants.mjs ../fixed/pi-research .
```
第一个参数换成实际修复版目录。脚本为两版创建独立临时数据、读入同一组8份人工文本，比较原文上下文、精确去重与MMR消融。结束自动清理测试数据库。

## 说明与验收

- `docs/RELEASE-0.2.2.md`：共同修复内容及历史兼容边界。
- `docs/adoption/DECISION.md`：吸纳/暂不吸纳的决定与试验限制。
- `docs/adoption/LOCAL-TEXT-CONTRACT.md`：API、方法、权限、容量与证据合同。
- `docs/acceptance/0.3.0-experimental/`：本轮实际构建/测试/对比记录。

## 未完成的验证

真实 Pi SDK/供应商调用、Docker通用实验、开发测试沙箱、Windows/WSL实机、远程计算、PDF/论文系统、完整上游逐屏对齐尚未验收。当前 Chromium 的本机导航被管理策略阻止；HTTP与组件测试不等于浏览器验收。npm ci遇到DNS错误；本次编译用可用TS5.8.3/Node类型25.1.0，锁声明类型24.0.4，未称干净锁定安装通过。完整记录有明确区分。

老数据升级：先停止全部写入并备份，用相同绝对数据目录；不要在比较中让两个版本同时接管同一数据库。既有历史保留，缺少新采纳绑定的旧任务结论需要重新核验，不能无条件视为当前有效。
